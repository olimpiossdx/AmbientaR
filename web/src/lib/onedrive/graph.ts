import type { GraphDeltaResponse, GraphDriveItem } from "@/lib/onedrive/types";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

let tokenCache: { accessToken: string; expiresAtMs: number } | null = null;

export type GraphAuthMode = "app" | "delegated";

export function getGraphAuthMode(): GraphAuthMode {
  const raw = process.env.ONEDRIVE_GRAPH_AUTH_MODE?.trim().toLowerCase();
  return raw === "delegated" ? "delegated" : "app";
}

function graphUrl(pathOrUrl: string): string {
  return pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${GRAPH_BASE}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export class MicrosoftGraphError extends Error {
  status: number;
  body?: string;

  constructor(message: string, status: number, body?: string) {
    super(message);
    this.name = "MicrosoftGraphError";
    this.status = status;
    this.body = body;
  }
}

export async function getGraphAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAtMs > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID?.trim();
  const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID?.trim();
  const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET?.trim();

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Microsoft Graph não configurado (MICROSOFT_GRAPH_TENANT_ID, CLIENT_ID, CLIENT_SECRET).",
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );

  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
    error?: string;
  };

  if (!res.ok || !json.access_token) {
    throw new MicrosoftGraphError(
      json.error_description || json.error || "Falha ao obter token Microsoft Graph.",
      res.status,
      JSON.stringify(json),
    );
  }

  const expiresIn = Number(json.expires_in || 3600);
  tokenCache = {
    accessToken: json.access_token,
    expiresAtMs: Date.now() + expiresIn * 1000,
  };

  return tokenCache.accessToken;
}

export async function getGraphAccessTokenForMode(
  mode: GraphAuthMode = getGraphAuthMode(),
): Promise<string> {
  if (mode === "delegated") {
    const { getDelegatedGraphAccessToken } = await import(
      "@/lib/onedrive/consumer-oauth"
    );
    return getDelegatedGraphAccessToken();
  }
  return getGraphAccessToken();
}

export async function graphFetch<T>(
  pathOrUrl: string,
  init?: RequestInit,
): Promise<T> {
  return graphFetchForMode<T>("app", pathOrUrl, init);
}

export async function graphFetchForMode<T>(
  mode: GraphAuthMode,
  pathOrUrl: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getGraphAccessTokenForMode(mode);
  const url = graphUrl(pathOrUrl);

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new MicrosoftGraphError(
      `Microsoft Graph ${res.status}: ${text.slice(0, 400)}`,
      res.status,
      text,
    );
  }

  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}

type GraphDriveList = {
  value?: { id: string; name?: string; driveType?: string }[];
};

export async function resolveDefaultDriveId(): Promise<{
  driveId: string;
  driveName?: string;
}> {
  const configured = process.env.ONEDRIVE_DEFAULT_DRIVE_ID?.trim();
  if (configured) {
    return { driveId: configured };
  }

  const hint = (process.env.ONEDRIVE_DRIVE_NAME_HINT || "Pimenta")
    .trim()
    .toLowerCase();

  const list = await graphFetch<GraphDriveList>("/drives?$select=id,name,driveType");
  const drives = list.value || [];
  if (drives.length === 0) {
    throw new Error("Nenhum drive encontrado no tenant Microsoft Graph.");
  }

  const byHint = drives.find((d) =>
    (d.name || "").toLowerCase().includes(hint),
  );
  const picked = byHint || drives[0];
  return { driveId: picked.id, driveName: picked.name };
}

type GraphDriveSingle = { id: string; name?: string; driveType?: string };

export async function resolveDefaultDriveIdForMode(
  mode: GraphAuthMode,
): Promise<{ driveId: string; driveName?: string }> {
  if (mode === "delegated") {
    const meDrive = await graphFetchForMode<GraphDriveSingle>(
      mode,
      "/me/drive?$select=id,name,driveType",
    );
    if (!meDrive?.id) {
      throw new Error("Conta OneDrive pessoal sem drive provisionado.");
    }
    return { driveId: meDrive.id, driveName: meDrive.name || "OneDrive" };
  }
  return resolveDefaultDriveId();
}

export async function getDriveItemByPath(
  driveId: string,
  folderPath: string,
): Promise<GraphDriveItem> {
  const { toGraphItemByPathUrl } = await import("@/lib/onedrive/path-utils");
  return graphFetch<GraphDriveItem>(toGraphItemByPathUrl(driveId, folderPath));
}

export async function getDriveItemByPathForMode(
  mode: GraphAuthMode,
  driveId: string,
  folderPath: string,
): Promise<GraphDriveItem> {
  if (mode === "delegated") {
    const normalized = folderPath
      .trim()
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
    const segments = normalized.split("/").filter(Boolean);
    const encoded = segments.map((s) => encodeURIComponent(s)).join("/");
    const pathUrl = encoded
      ? `/me/drive/root:/${encoded}:`
      : "/me/drive/root";
    return graphFetchForMode<GraphDriveItem>(mode, pathUrl);
  }
  return getDriveItemByPath(driveId, folderPath);
}

export async function getDriveItem(
  driveId: string,
  itemId: string,
): Promise<GraphDriveItem & { "@microsoft.graph.downloadUrl"?: string }> {
  return graphFetch(
    `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}?$select=id,name,eTag,size,file,folder,parentReference,webUrl,@microsoft.graph.downloadUrl`,
  );
}

type GraphChildrenList = { value?: GraphDriveItem[] };

/** Lista filhos imediatos de uma pasta no drive. */
export async function listDriveChildren(
  driveId: string,
  folderItemId: string,
): Promise<GraphDriveItem[]> {
  const data = await graphFetch<GraphChildrenList>(
    `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(folderItemId)}/children?$select=id,name,size,file,folder,eTag`,
  );
  return data.value || [];
}

export async function listDriveChildrenForMode(
  mode: GraphAuthMode,
  driveId: string,
  folderItemId: string,
): Promise<GraphDriveItem[]> {
  if (mode === "delegated") {
    const data = await graphFetchForMode<GraphChildrenList>(
      mode,
      `/me/drive/items/${encodeURIComponent(folderItemId)}/children?$select=id,name,size,file,folder,eTag,parentReference`,
    );
    return data.value || [];
  }
  return listDriveChildren(driveId, folderItemId);
}

export async function fetchDeltaPage(
  driveId: string,
  folderItemId: string,
  deltaLink?: string,
): Promise<GraphDeltaResponse> {
  if (deltaLink) {
    return graphFetch<GraphDeltaResponse>(deltaLink);
  }
  return graphFetch<GraphDeltaResponse>(
    `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(folderItemId)}/delta?$select=id,name,eTag,size,file,folder,parentReference,deleted`,
  );
}

export async function fetchDeltaPageForMode(
  mode: GraphAuthMode,
  driveId: string,
  folderItemId: string,
  deltaLink?: string,
): Promise<GraphDeltaResponse> {
  if (deltaLink) {
    return graphFetchForMode<GraphDeltaResponse>(mode, deltaLink);
  }
  if (mode === "delegated") {
    return graphFetchForMode<GraphDeltaResponse>(
      mode,
      `/me/drive/items/${encodeURIComponent(folderItemId)}/delta?$select=id,name,eTag,size,file,folder,parentReference,deleted`,
    );
  }
  return fetchDeltaPage(driveId, folderItemId, deltaLink);
}
