import type { SicoobPixEnvironment } from "@/lib/sicoob-pix/types";

export type SicoobPixConfig = {
  clientId: string;
  pixKey: string;
  environment: SicoobPixEnvironment;
  mockMode: boolean;
  certPem?: string;
  keyPem?: string;
  certPath?: string;
  keyPath?: string;
  webhookAccessToken?: string;
  chargeExpirationSeconds: number;
};

export function getSicoobPixConfig(): SicoobPixConfig {
  const environment =
    process.env.SICOOB_ENVIRONMENT === "production" ? "production" : "sandbox";
  const mockMode =
    process.env.SICOOB_MOCK_MODE === "true" ||
    (!process.env.SICOOB_CLIENT_ID?.trim() && process.env.NODE_ENV !== "production");

  return {
    clientId: process.env.SICOOB_CLIENT_ID?.trim() ?? "",
    pixKey: process.env.SICOOB_PIX_KEY?.trim() ?? "",
    environment,
    mockMode,
    certPem: process.env.SICOOB_CERT_PEM?.trim(),
    keyPem: process.env.SICOOB_CERT_KEY?.trim(),
    certPath: process.env.SICOOB_CERT_PATH?.trim(),
    keyPath: process.env.SICOOB_KEY_PATH?.trim(),
    webhookAccessToken: process.env.SICOOB_WEBHOOK_ACCESS_TOKEN?.trim(),
    chargeExpirationSeconds: Number(process.env.SICOOB_CHARGE_EXPIRATION_SECONDS ?? "86400"),
  };
}

export function getSicoobApiBaseUrl(environment: SicoobPixEnvironment): string {
  if (environment === "production") {
    return "https://api.sicoob.com.br/pix/api/v2";
  }
  return "https://sandbox.sicoob.com.br/sicoob/sandbox/pix/api/v2";
}

export const SICOOB_OAUTH_TOKEN_URL =
  "https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token";

export const SICOOB_OAUTH_SCOPE =
  "cob.read cob.write pix.read webhook.read webhook.write";
