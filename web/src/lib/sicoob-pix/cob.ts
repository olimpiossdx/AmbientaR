import type { ClientPackage } from "@/lib/types";
import type { SicoobImmediateChargeResult } from "@/lib/billing/types";
import { formatPixAmountBrl } from "@/lib/billing/pricing";
import { getSicoobPixConfig } from "@/lib/sicoob-pix/config";
import { getSicoobAccessToken, getSicoobPixApiUrl } from "@/lib/sicoob-pix/oauth";
import { sicoobHttpsFetch } from "@/lib/sicoob-pix/tls";
import type {
  SicoobCobImmediateRequest,
  SicoobCobImmediateResponse,
} from "@/lib/sicoob-pix/types";

function buildMockPixCopiaECola(txid: string, amountBrl: number): string {
  return `00020126580014br.gov.bcb.pix0136mock-ambientar-${txid}520400005303986540${formatPixAmountBrl(amountBrl)}5802BR5925PIMENTA CONSULTORIA6009SAO PAULO62070503***6304MOCK`;
}

export async function createSicoobImmediateCharge(input: {
  txid: string;
  amountBrl: number;
  packageId: ClientPackage;
  payerLabel?: string;
}): Promise<SicoobImmediateChargeResult> {
  const config = getSicoobPixConfig();
  const expiresAt = new Date(
    Date.now() + config.chargeExpirationSeconds * 1000,
  ).toISOString();

  if (config.mockMode) {
    return {
      txid: input.txid,
      amountBrl: input.amountBrl,
      pixCopiaECola: buildMockPixCopiaECola(input.txid, input.amountBrl),
      qrCodeBase64: undefined,
      expiresAt,
      status: "ATIVA",
      mock: true,
    };
  }

  if (!config.pixKey) {
    throw new Error("SICOOB_PIX_KEY não configurada.");
  }

  const token = await getSicoobAccessToken();
  const payload: SicoobCobImmediateRequest = {
    calendario: { expiracao: config.chargeExpirationSeconds },
    valor: { original: formatPixAmountBrl(input.amountBrl) },
    chave: config.pixKey,
    solicitacaoPagador: `AmbientaR — plano ${input.packageId}`,
    infoAdicionais: input.payerLabel
      ? [{ nome: "Titular", valor: input.payerLabel.slice(0, 50) }]
      : undefined,
  };

  const url = getSicoobPixApiUrl(`/cob/${encodeURIComponent(input.txid)}`);
  const res = await sicoobHttpsFetch(url, config, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      client_id: config.clientId,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Cobrança Pix Sicoob falhou (${res.status}): ${text.slice(0, 800)}`);
  }

  const json = JSON.parse(text) as SicoobCobImmediateResponse;
  if (!json.pixCopiaECola) {
    throw new Error("Resposta Sicoob sem pixCopiaECola.");
  }

  return {
    txid: json.txid ?? input.txid,
    amountBrl: input.amountBrl,
    pixCopiaECola: json.pixCopiaECola,
    expiresAt,
    status: json.status ?? "ATIVA",
    mock: false,
  };
}

export async function getSicoobChargeStatus(txid: string): Promise<{
  txid: string;
  status: string;
  mock: boolean;
}> {
  const config = getSicoobPixConfig();
  if (config.mockMode) {
    return { txid, status: "ATIVA", mock: true };
  }

  const token = await getSicoobAccessToken();
  const url = getSicoobPixApiUrl(`/cob/${encodeURIComponent(txid)}`);
  const res = await sicoobHttpsFetch(url, config, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      client_id: config.clientId,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Consulta cob Sicoob falhou (${res.status}): ${text.slice(0, 500)}`);
  }
  const json = JSON.parse(text) as SicoobCobImmediateResponse;
  return { txid, status: json.status ?? "DESCONHECIDA", mock: false };
}

/** Simula confirmação em mock (debug / homologação local). */
export function isSicoobChargePaidStatus(status: string): boolean {
  const s = status.toUpperCase();
  return s === "CONCLUIDA" || s === "CONCLUÍDA" || s === "PAID_MOCK";
}
