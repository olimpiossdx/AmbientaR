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

export const SNIRH_ESTACOES_ARCGIS_URL =
  "https://portal1.snirh.gov.br/server/rest/services/Esta%C3%A7%C3%B5es_Hidrometeorol%C3%B3gicas_SNIRH/FeatureServer/0";

export type AnaEstacaoProxima = {
  codigo: number | string;
  nome: string;
  latitude: number;
  longitude: number;
  distanciaKm: number;
};

export type GeoHidrologiaContext = {
  raioKm: number;
  estacoesAnaProximas: AnaEstacaoProxima[];
  resumo: string;
  fonteUrl: string;
  fetchedAtUtc: string;
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bboxCenter(bbox: [number, number, number, number]): [number, number] {
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
}

/** Expande bbox ~raioKm (aproximação em graus). */
export function expandBboxByKm(
  bbox: [number, number, number, number],
  raioKm: number,
): [number, number, number, number] {
  const [cx, cy] = bboxCenter(bbox);
  const dLat = raioKm / 111;
  const dLon = raioKm / (111 * Math.cos((cy * Math.PI) / 180));
  return [cx - dLon, cy - dLat, cx + dLon, cy + dLat];
}

/** Estações SNIRH num raio (via ArcGIS REST + filtro haversine). */
export async function findEstacoesAnaNearBbox(
  bbox: [number, number, number, number],
  raioKm = 50,
  maxResults = 15,
): Promise<AnaEstacaoProxima[]> {
  const [cx, cy] = bboxCenter(bbox);
  const searchBbox = expandBboxByKm(bbox, raioKm);
  const [minX, minY, maxX, maxY] = searchBbox;

  const url = new URL(`${SNIRH_ESTACOES_ARCGIS_URL}/query`);
  url.searchParams.set("f", "json");
  url.searchParams.set("where", "1=1");
  url.searchParams.set("geometry", `${minX},${minY},${maxX},${maxY}`);
  url.searchParams.set("geometryType", "esriGeometryEnvelope");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "Nome,Codigo,Latitude,Longitude");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("resultRecordCount", "200");

  const res = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) return [];

  const json = (await res.json()) as {
    features?: {
      attributes?: {
        Nome?: string;
        Codigo?: number;
        Latitude?: number;
        Longitude?: number;
      };
    }[];
  };

  const estacoes: AnaEstacaoProxima[] = [];
  for (const f of json.features ?? []) {
    const a = f.attributes;
    if (!a?.Latitude || !a.Longitude || a.Codigo == null) continue;
    const dist = haversineKm(cy, cx, a.Latitude, a.Longitude);
    if (dist > raioKm) continue;
    estacoes.push({
      codigo: a.Codigo,
      nome: a.Nome ?? `Estação ${a.Codigo}`,
      latitude: a.Latitude,
      longitude: a.Longitude,
      distanciaKm: Math.round(dist * 10) / 10,
    });
  }

  estacoes.sort((a, b) => a.distanciaKm - b.distanciaKm);
  return estacoes.slice(0, maxResults);
}

export async function buildHidrologiaContext(
  bbox: [number, number, number, number],
  raioKm = 50,
): Promise<GeoHidrologiaContext> {
  const estacoesAnaProximas = await findEstacoesAnaNearBbox(bbox, raioKm);
  const resumo =
    estacoesAnaProximas.length > 0
      ? `${estacoesAnaProximas.length} estação(ões) SNIRH/ANA num raio de ${raioKm} km (mais próxima: ${estacoesAnaProximas[0].nome}, ~${estacoesAnaProximas[0].distanciaKm} km).`
      : `Nenhuma estação SNIRH/ANA no raio de ${raioKm} km do centro do perímetro.`;

  return {
    raioKm,
    estacoesAnaProximas,
    resumo,
    fonteUrl: SNIRH_ESTACOES_ARCGIS_URL,
    fetchedAtUtc: new Date().toISOString(),
  };
}
