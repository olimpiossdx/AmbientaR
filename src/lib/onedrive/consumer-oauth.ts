import { randomUUID } from "crypto";
import { adminDb } from "@/lib/firebase-admin";

const TOKEN_COLLECTION = "onedrive_oauth_tokens";
const STATE_COLLECTION = "onedrive_oauth_states";
const PRIMARY_TOKEN_DOC_ID = "primary";

type OneDriveOAuthTokenDoc = {
  uid: string;
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
  scope?: string;
  tokenType?: string;
  updatedAt: string;
};

type PendingOAuthStateDoc = {
  uid: string;
  state: string;
  returnPath: string;
  createdAt: string;
  expiresAtMs: number;
};

type OAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

function getClientId(): string {
  const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID?.trim();
  if (!clientId) throw new Error("MICROSOFT_GRAPH_CLIENT_ID não configurado.");
  return clientId;
}

function getClientSecret(): string {
  const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET?.trim();
  if (!clientSecret) {
    throw new Error("MICROSOFT_GRAPH_CLIENT_SECRET não configurado.");
  }
  return clientSecret;
}

function getOauthAuthoritySegment(): string {
  const seg = process.env.ONEDRIVE_GRAPH_AUTHORITY?.trim();
  if (seg) return seg;
  return "consumers";
}

function getOauthBaseUrl(): string {
  return `https://login.microsoftonline.com/${getOauthAuthoritySegment()}/oauth2/v2.0`;
}

export function getOAuthRedirectUri(): string {
  const fromEnv = process.env.ONEDRIVE_GRAPH_REDIRECT_URI?.trim();
  return fromEnv || "http://localhost:9002/api/onedrive-consumer/auth/callback";
}

export function getOAuthScopes(): string[] {
  const raw =
    process.env.ONEDRIVE_GRAPH_SCOPES?.trim() ||
    "openid profile offline_access User.Read Files.Read";
  return raw
    .split(/[\s,]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function createOneDriveAuthState(params: {
  uid: string;
  returnPath?: string;
}): Promise<{ state: string; authUrl: string }> {
  const state = randomUUID();
  const now = Date.now();
  const doc: PendingOAuthStateDoc = {
    uid: params.uid,
    state,
    returnPath: params.returnPath?.trim() || "/ai-lab/cloud-library",
    createdAt: new Date(now).toISOString(),
    expiresAtMs: now + 15 * 60 * 1000,
  };
  await adminDb().collection(STATE_COLLECTION).doc(state).set(doc);

  const query = new URLSearchParams({
    client_id: getClientId(),
    response_type: "code",
    redirect_uri: getOAuthRedirectUri(),
    response_mode: "query",
    scope: getOAuthScopes().join(" "),
    state,
    prompt: "select_account",
  });

  const authUrl = `${getOauthBaseUrl()}/authorize?${query.toString()}`;
  return { state, authUrl };
}

export async function consumeOneDriveAuthState(
  state: string,
): Promise<PendingOAuthStateDoc> {
  const ref = adminDb().collection(STATE_COLLECTION).doc(state);
  const snap = await ref.get();
  await ref.delete().catch(() => undefined);
  if (!snap.exists) {
    throw new Error("Estado OAuth inválido ou expirado.");
  }
  const doc = snap.data() as PendingOAuthStateDoc;
  if (Date.now() > doc.expiresAtMs) {
    throw new Error("Estado OAuth expirado. Inicie o login novamente.");
  }
  return doc;
}

async function requestToken(
  params: URLSearchParams,
): Promise<OAuthTokenResponse> {
  const res = await fetch(`${getOauthBaseUrl()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const json = (await res.json()) as OAuthTokenResponse;
  if (!res.ok || !json.access_token) {
    throw new Error(
      json.error_description || json.error || "Falha no token OAuth OneDrive.",
    );
  }
  return json;
}

export async function exchangeCodeForDelegatedToken(params: {
  code: string;
  uid: string;
}): Promise<void> {
  const body = new URLSearchParams({
    client_id: getClientId(),
    client_secret: getClientSecret(),
    code: params.code,
    redirect_uri: getOAuthRedirectUri(),
    grant_type: "authorization_code",
    scope: getOAuthScopes().join(" "),
  });

  const json = await requestToken(body);
  const expiresIn = Number(json.expires_in || 3600);
  const tokenDoc: OneDriveOAuthTokenDoc = {
    uid: params.uid,
    accessToken: json.access_token || "",
    refreshToken: json.refresh_token || "",
    expiresAtMs: Date.now() + expiresIn * 1000,
    scope: json.scope,
    tokenType: json.token_type,
    updatedAt: new Date().toISOString(),
  };

  await adminDb().collection(TOKEN_COLLECTION).doc(PRIMARY_TOKEN_DOC_ID).set(tokenDoc);
}

export async function getDelegatedTokenDoc(): Promise<OneDriveOAuthTokenDoc | null> {
  const snap = await adminDb()
    .collection(TOKEN_COLLECTION)
    .doc(PRIMARY_TOKEN_DOC_ID)
    .get();
  if (!snap.exists) return null;
  return snap.data() as OneDriveOAuthTokenDoc;
}

export async function getDelegatedGraphAccessToken(): Promise<string> {
  const current = await getDelegatedTokenDoc();
  if (!current) {
    throw new Error(
      "OneDrive pessoal não conectado. Use 'Ligar conta Microsoft' na Biblioteca IA.",
    );
  }

  if (current.expiresAtMs > Date.now() + 60_000) {
    return current.accessToken;
  }

  if (!current.refreshToken) {
    throw new Error("Token OneDrive expirado sem refresh_token. Reconecte a conta.");
  }

  const body = new URLSearchParams({
    client_id: getClientId(),
    client_secret: getClientSecret(),
    grant_type: "refresh_token",
    refresh_token: current.refreshToken,
    redirect_uri: getOAuthRedirectUri(),
    scope: getOAuthScopes().join(" "),
  });

  const json = await requestToken(body);
  const expiresIn = Number(json.expires_in || 3600);
  const refreshed: OneDriveOAuthTokenDoc = {
    uid: current.uid,
    accessToken: json.access_token || current.accessToken,
    refreshToken: json.refresh_token || current.refreshToken,
    expiresAtMs: Date.now() + expiresIn * 1000,
    scope: json.scope || current.scope,
    tokenType: json.token_type || current.tokenType,
    updatedAt: new Date().toISOString(),
  };

  await adminDb()
    .collection(TOKEN_COLLECTION)
    .doc(PRIMARY_TOKEN_DOC_ID)
    .set(refreshed, { merge: true });

  return refreshed.accessToken;
}

export async function disconnectDelegatedToken(): Promise<void> {
  await adminDb().collection(TOKEN_COLLECTION).doc(PRIMARY_TOKEN_DOC_ID).delete();
}

function getAppOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (raw) {
    const withProto = raw.startsWith("http") ? raw : `https://${raw}`;
    return withProto.replace(/\/$/, "");
  }
  const port = process.env.PORT?.trim() || "9002";
  return `http://localhost:${port}`;
}

export function getCallbackRedirectTarget(params: {
  returnPath: string;
  ok: boolean;
  message?: string;
}): string {
  const safePath = params.returnPath.startsWith("/")
    ? params.returnPath
    : "/ai-lab/cloud-library";
  const base = new URL(`${getAppOrigin()}${safePath}`);
  base.searchParams.set("onedriveAuth", params.ok ? "success" : "error");
  if (params.message) {
    base.searchParams.set("onedriveAuthMessage", params.message.slice(0, 180));
  }
  return `${base.pathname}${base.search}`;
}
