import {
  getSicoobApiBaseUrl,
  getSicoobPixConfig,
  SICOOB_OAUTH_SCOPE,
  SICOOB_OAUTH_TOKEN_URL,
} from "@/lib/sicoob-pix/config";
import { sicoobHttpsFetch } from "@/lib/sicoob-pix/tls";
import type { SicoobOAuthTokenResponse } from "@/lib/sicoob-pix/types";

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getSicoobAccessToken(): Promise<string> {
  const config = getSicoobPixConfig();
  if (config.mockMode) return "mock-sicoob-token";

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  if (!config.clientId) {
    throw new Error("SICOOB_CLIENT_ID não configurado.");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    scope: SICOOB_OAUTH_SCOPE,
  }).toString();

  const res = await sicoobHttpsFetch(SICOOB_OAUTH_TOKEN_URL, config, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": String(Buffer.byteLength(body)),
    },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`OAuth Sicoob falhou (${res.status}): ${text.slice(0, 500)}`);
  }

  const json = JSON.parse(text) as SicoobOAuthTokenResponse;
  if (!json.access_token) {
    throw new Error("OAuth Sicoob não retornou access_token.");
  }

  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 300) * 1000,
  };
  return json.access_token;
}

export async function testSicoobOAuth(): Promise<{
  ok: boolean;
  environment: string;
  tokenPreview?: string;
  error?: string;
}> {
  const config = getSicoobPixConfig();
  if (config.mockMode) {
    return {
      ok: true,
      environment: config.environment,
      tokenPreview: "mock-***",
    };
  }
  try {
    const token = await getSicoobAccessToken();
    return {
      ok: true,
      environment: config.environment,
      tokenPreview: `${token.slice(0, 8)}…`,
    };
  } catch (err) {
    return {
      ok: false,
      environment: config.environment,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getSicoobPixApiUrl(path: string): string {
  const config = getSicoobPixConfig();
  const base = getSicoobApiBaseUrl(config.environment).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
