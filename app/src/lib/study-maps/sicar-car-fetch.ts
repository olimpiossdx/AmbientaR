import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";
import area from "@turf/area";
import bbox from "@turf/bbox";

/**
 * Consulta geometria CAR via WFS público SICAR (GeoServer MAPA).
 * Módulo autónomo — não importar src/lib/geospatial/* (fronteira MCA / Análise Geoespacial).
 */

const SICAR_WFS = "https://geoserver.car.gov.br/geoserver/sicar/ows";
const WFS_TIMEOUT_MS = 45_000;

export type StudyMapsSicarCarRecord = {
  codImovel: string;
  situacao: string;
  areaHa: number;
  municipio: string;
  uf: string;
};

export type StudyMapsSicarFetchResult = {
  ok: boolean;
  polygon: Feature<Polygon> | null;
  record: StudyMapsSicarCarRecord | null;
  error?: string;
  fonte: { nome: string; url: string; metodo: string };
};

function extractUfFromCodImovel(codImovel: string): string | null {
  const match = codImovel.trim().match(/^([A-Za-z]{2})-/);
  if (!match?.[1]) return null;
  const uf = match[1].toUpperCase();
  return uf === "DF" ? "DF" : uf.toLowerCase();
}

function sicarTypeNameForUf(uf: string): string {
  const normalized = uf === "DF" ? "DF" : uf.toLowerCase();
  return `sicar:sicar_imoveis_${normalized}`;
}

function escapeCql(value: string): string {
  return value.replace(/'/g, "''");
}

function closeRing(ring: Position[]): Position[] {
  if (ring.length < 3) return ring;
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function normalizeToPolygonFeature(
  geometry: Polygon | MultiPolygon,
): Feature<Polygon> | null {
  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates.map((ring) => closeRing(ring));
    if (!coords[0]?.length) return null;
    return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: coords } };
  }
  const first = geometry.coordinates[0];
  if (!first?.[0]?.length) return null;
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [closeRing(first[0])] },
  };
}

function parseFeatureCollection(text: string): FeatureCollection | null {
  try {
    const json = JSON.parse(text) as FeatureCollection;
    if (json?.type === "FeatureCollection" && Array.isArray(json.features)) return json;
  } catch {
    return null;
  }
  return null;
}

async function fetchWfsByCql(typeName: string, cqlFilter: string): Promise<Feature[]> {
  const url = new URL(SICAR_WFS);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.0.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typeName", typeName);
  url.searchParams.set("outputFormat", "application/json");
  url.searchParams.set("CQL_FILTER", cqlFilter);
  url.searchParams.set("maxFeatures", "5");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WFS_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "AmbientaR/1.0 (MCA study-maps; SICAR WFS)",
      },
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (text.trim().startsWith("<")) return [];
    const fc = parseFeatureCollection(text);
    return fc?.features ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function propsFromFeature(f: Feature, codImovel: string): StudyMapsSicarCarRecord {
  const p = (f.properties ?? {}) as Record<string, unknown>;
  const areaM2 = area(f);
  const status =
    String(p.status ?? p.status_imovel ?? p.condicao ?? p.situacao ?? "Consulta WFS").trim();
  return {
    codImovel: String(p.cod_imovel ?? p.codigo ?? codImovel),
    situacao: status,
    areaHa: areaM2 / 10_000,
    municipio: String(p.municipio ?? p.nome_municipio ?? "—"),
    uf: String(p.uf ?? p.estado ?? extractUfFromCodImovel(codImovel) ?? "—").toUpperCase(),
  };
}

function featureToPolygon(f: Feature): Feature<Polygon> | null {
  const g = f.geometry;
  if (!g) return null;
  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    return normalizeToPolygonFeature(g);
  }
  return null;
}

/** Obtém polígono do imóvel rural pelo recibo CAR (WFS SICAR). */
export async function fetchSicarCarGeometry(
  codImovel: string,
): Promise<StudyMapsSicarFetchResult> {
  const trimmed = codImovel.trim();
  const fonte = {
    nome: "SICAR GeoServer (MAPA)",
    url: SICAR_WFS,
    metodo: "WFS GetFeature (CQL cod_imovel)",
  };

  if (trimmed.length < 8) {
    return { ok: false, polygon: null, record: null, error: "Recibo CAR inválido.", fonte };
  }

  const uf = extractUfFromCodImovel(trimmed);
  if (!uf) {
    return {
      ok: false,
      polygon: null,
      record: null,
      error: "UF não reconhecida no recibo (esperado MG-…).",
      fonte,
    };
  }

  const typeName = sicarTypeNameForUf(uf);
  const escaped = escapeCql(trimmed);
  const filters = [
    `cod_imovel='${escaped}'`,
    `codigo='${escaped}'`,
    `recibo='${escaped}'`,
  ];

  let features: Feature[] = [];
  for (const cql of filters) {
    features = await fetchWfsByCql(typeName, cql);
    if (features.length) break;
  }

  if (!features.length) {
    return {
      ok: false,
      polygon: null,
      record: null,
      error:
        "Imóvel não encontrado no WFS SICAR. Verifique o recibo ou importe SHP/KML exportado do portal.",
      fonte,
    };
  }

  const hit = features.find((f) => featureToPolygon(f)) ?? features[0]!;
  const polygon = featureToPolygon(hit);
  if (!polygon) {
    return {
      ok: false,
      polygon: null,
      record: null,
      error: "Geometria CAR inválida no WFS (sem polígono).",
      fonte,
    };
  }

  const record = propsFromFeature(hit, trimmed);
  polygon.properties = {
    source: "sicar_wfs",
    codImovel: record.codImovel,
    areaHa: record.areaHa,
    municipio: record.municipio,
  };

  return { ok: true, polygon, record, fonte };
}

export function sicarPolygonMeta(polygon: Feature<Polygon>): {
  areaHa: number;
  bbox: [number, number, number, number];
} {
  const box = bbox(polygon) as [number, number, number, number];
  return { areaHa: area(polygon) / 10_000, bbox: box };
}
