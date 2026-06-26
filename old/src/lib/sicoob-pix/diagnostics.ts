import { getSicoobPixConfig, getSicoobApiBaseUrl } from "@/lib/sicoob-pix/config";
import { hasSicoobCertificate } from "@/lib/sicoob-pix/tls";
import type { SicoobConfigDiagnostic } from "@/lib/sicoob-pix/types";

export function diagnoseSicoobConfig(): SicoobConfigDiagnostic {
  const config = getSicoobPixConfig();
  const hasCert = hasSicoobCertificate(config);
  const notes: string[] = [];

  if (config.mockMode) {
    notes.push("SICOOB_MOCK_MODE ativo ou SICOOB_CLIENT_ID ausente — cobranças simuladas.");
  }
  if (!config.clientId) notes.push("Falta SICOOB_CLIENT_ID.");
  if (!config.pixKey) notes.push("Falta SICOOB_PIX_KEY.");
  if (!config.mockMode && !hasCert) {
    notes.push("Falta certificado mTLS (SICOOB_CERT_PEM + SICOOB_CERT_KEY ou paths).");
  }
  if (!config.webhookAccessToken && process.env.NODE_ENV === "production") {
    notes.push("Recomendado: SICOOB_WEBHOOK_ACCESS_TOKEN em produção.");
  }

  const ready =
    config.mockMode ||
    Boolean(config.clientId && config.pixKey && hasCert);

  return {
    mockMode: config.mockMode,
    environment: config.environment,
    hasClientId: Boolean(config.clientId),
    hasPixKey: Boolean(config.pixKey),
    hasCertificate: hasCert,
    apiBaseUrl: getSicoobApiBaseUrl(config.environment),
    ready,
    notes,
  };
}
