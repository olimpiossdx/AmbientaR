/**
 * Cliente ANA HidroWeb REST (séries e estações telemétricas) — P6.
 * Documentação: manual HidroWebservice (ANA/SNIRH).
 */

const HIDROWEB_BASE = "https://www.snirh.gov.br/hidroweb/rest/api";

export type AnaEstacaoTelemetrica = {
  id?: number;
  codigoEstacao?: string;
  nomeEstacao?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
};

export async function fetchEstacaoTelemetrica(
  stationId: string | number,
): Promise<AnaEstacaoTelemetrica | null> {
  const url = `${HIDROWEB_BASE}/estacaotelemetrica?id=${encodeURIComponent(String(stationId))}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as AnaEstacaoTelemetrica | AnaEstacaoTelemetrica[];
  if (Array.isArray(json)) return json[0] ?? null;
  return json;
}

export async function fetchTelemetricasDocument(params: {
  codigosEstacoes: string;
  tipoArquivo?: number;
  periodoInicial: string;
  periodoFinal: string;
}): Promise<unknown> {
  const url = new URL(`${HIDROWEB_BASE}/documento/gerarTelemetricas`);
  url.searchParams.set("codigosEstacoes", params.codigosEstacoes);
  url.searchParams.set("tipoArquivo", String(params.tipoArquivo ?? 2));
  url.searchParams.set("periodoInicial", params.periodoInicial);
  url.searchParams.set("periodoFinal", params.periodoFinal);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    throw new Error(`ANA HidroWeb HTTP ${res.status}`);
  }
  return res.json();
}

/** Estações de referência MG (amostra) — expandir via SNIRH ou catálogo. */
export const ANA_MG_STATION_SAMPLES = [
  { id: "5669600", nome: "Exemplo MG (probe)" },
] as const;
