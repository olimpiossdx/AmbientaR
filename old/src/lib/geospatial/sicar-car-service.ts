import booleanIntersects from "@turf/boolean-intersects";
import center from "@turf/center";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import {
  parsePerimeterPolygon,
  type PerimeterParseInput,
} from "@/lib/geospatial/perimeter";
import {
  extractUfFromCodImovel,
  resolveUfsForBbox,
  sicarTypeNameForUf,
} from "@/lib/geospatial/sicar-uf-bounds";
import {
  fetchWfsFeaturesInBbox,
  fetchWfsFeaturesWithCql,
} from "@/lib/geospatial/wfs-client";
import type { SicarCarQueryResult, SicarCarRecord } from "@/lib/types/sicar-car";

export const SICAR_WFS_BASE_URL =
  "https://geoserver.car.gov.br/geoserver/sicar/wfs";

const SICAR_FONT = {
  nome: "SICAR GeoServer (consulta pública)",
  url: "https://geoserver.car.gov.br/geoserver/sicar/wms",
  metodo: "WFS GetFeature + CQL/INTERSECTS",
};

const STATUS_LABELS: Record<string, string> = {
  AT: "Ativo",
  PE: "Pendente",
  SU: "Suspenso",
  CA: "Cancelado",
};

function escapeCqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function statusLabel(code: string | undefined): string {
  if (!code) return "Desconhecido";
  return STATUS_LABELS[code.toUpperCase()] ?? code;
}

function buildSituacao(statusCodigo: string, condicao: string): string {
  const label = statusLabel(statusCodigo);
  if (condicao && condicao !== label) {
    return `${label} — ${condicao}`;
  }
  return condicao || label;
}

function parseSicarFeature(feature: Feature): SicarCarRecord | null {
  const props = feature.properties ?? {};
  const codImovel = String(
    props.cod_imovel ?? props.codImovel ?? props.COD_IMOVEL ?? "",
  ).trim();
  if (!codImovel) return null;

  const statusCodigo = String(
    props.status_imovel ?? props.ind_status ?? props.status ?? "",
  ).trim();
  const condicao = String(props.condicao ?? props.des_condic ?? "").trim();
  const areaRaw = props.area ?? props.num_area;
  const areaHa =
    typeof areaRaw === "number"
      ? areaRaw
      : Number.parseFloat(String(areaRaw ?? "0")) || 0;

  const geometry =
    feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon"
      ? ({
          type: "Feature",
          properties: {},
          geometry: feature.geometry,
        } as Feature<Polygon | MultiPolygon>)
      : undefined;

  return {
    codImovel,
    statusCodigo,
    statusLabel: statusLabel(statusCodigo),
    condicao,
    situacao: buildSituacao(statusCodigo, condicao),
    areaHa,
    municipio: String(props.municipio ?? "").trim(),
    uf: String(props.uf ?? props.cod_estado ?? extractUfFromCodImovel(codImovel) ?? "")
      .trim()
      .toUpperCase(),
    tipoImovel: props.tipo_imovel ? String(props.tipo_imovel) : undefined,
    modFiscal:
      typeof props.m_fiscal === "number"
        ? props.m_fiscal
        : typeof props.mod_fiscal === "number"
          ? props.mod_fiscal
          : undefined,
    dataCriacao: props.dat_criacao ? String(props.dat_criacao) : undefined,
    dataAtualizacao: props.data_atualizacao
      ? String(props.data_atualizacao)
      : undefined,
    geometry,
  };
}

function polygonToCqlWkt(polygon: Feature<Polygon>): string {
  const ring = polygon.geometry.coordinates[0];
  if (!ring?.length) return "";
  const closed =
    ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
      ? ring
      : [...ring, ring[0]];
  const pairs = closed.map(([lng, lat]) => `${lng} ${lat}`).join(", ");
  return `POLYGON((${pairs}))`;
}

function dedupeRecords(records: SicarCarRecord[]): SicarCarRecord[] {
  const map = new Map<string, SicarCarRecord>();
  for (const r of records) {
    map.set(r.codImovel, r);
  }
  return [...map.values()];
}

function buildResumo(imoveis: SicarCarRecord[]): string {
  if (imoveis.length === 0) {
    return "Nenhum imóvel CAR intersectou o perímetro consultado.";
  }
  if (imoveis.length === 1) {
    const i = imoveis[0];
    return `${i.codImovel} · ${i.situacao} · ${i.areaHa.toFixed(2)} ha · ${i.municipio}/${i.uf}`;
  }
  const preview = imoveis
    .slice(0, 3)
    .map((i) => `${i.codImovel} (${i.statusLabel})`)
    .join("; ");
  const extra = imoveis.length > 3 ? ` (+${imoveis.length - 3})` : "";
  return `${imoveis.length} imóveis: ${preview}${extra}`;
}

async function fetchByCql(params: {
  uf: string;
  cqlFilter: string;
  maxFeatures?: number;
}): Promise<SicarCarRecord[]> {
  const typeName = sicarTypeNameForUf(params.uf);
  const wfs = await fetchWfsFeaturesWithCql({
    baseUrl: SICAR_WFS_BASE_URL,
    typeName,
    cqlFilter: params.cqlFilter,
    maxFeatures: params.maxFeatures ?? 50,
  });
  if (!wfs.ok) return [];
  return wfs.features
    .map((f) => parseSicarFeature(f))
    .filter((r): r is SicarCarRecord => r != null);
}

async function fetchByBbox(params: {
  uf: string;
  bbox: [number, number, number, number];
  maxFeatures?: number;
}): Promise<SicarCarRecord[]> {
  const typeName = sicarTypeNameForUf(params.uf);
  const wfs = await fetchWfsFeaturesInBbox({
    baseUrls: [SICAR_WFS_BASE_URL],
    typeNames: [typeName],
    bbox: params.bbox,
    maxFeatures: params.maxFeatures ?? 50,
  });
  if (!wfs.ok) return [];
  return wfs.features
    .map((f) => parseSicarFeature(f))
    .filter((r): r is SicarCarRecord => r != null);
}

function filterByPerimeter(
  records: SicarCarRecord[],
  perimeter: Feature<Polygon>,
): SicarCarRecord[] {
  return records.filter((record) => {
    if (!record.geometry) return true;
    try {
      return booleanIntersects(perimeter, record.geometry);
    } catch {
      return true;
    }
  });
}

/** Consulta imóvel pelo número CAR (recibo SICAR). */
export async function fetchCarByCodImovel(
  codImovel: string,
): Promise<SicarCarQueryResult> {
  const trimmed = codImovel.trim();
  const queriedAtUtc = new Date().toISOString();
  const fonte = { ...SICAR_FONT, queriedAtUtc };

  if (trimmed.length < 8) {
    return {
      ok: false,
      imoveis: [],
      resumo: "Número CAR inválido.",
      error: "Número CAR inválido.",
      fonte,
    };
  }

  const uf = extractUfFromCodImovel(trimmed);
  if (!uf) {
    return {
      ok: false,
      imoveis: [],
      resumo: "UF não identificada no número CAR.",
      error: "Formato CAR inválido (esperado UF-IBGE-…).",
      fonte,
    };
  }

  const escaped = escapeCqlString(trimmed);
  let imoveis = await fetchByCql({
    uf,
    cqlFilter: `cod_imovel='${escaped}'`,
    maxFeatures: 5,
  });

  if (imoveis.length === 0) {
    imoveis = await fetchByCql({
      uf,
      cqlFilter: `cod_imovel IN ('${escaped}')`,
      maxFeatures: 5,
    });
  }

  if (imoveis.length === 0) {
    return {
      ok: false,
      imoveis: [],
      resumo: "CAR não encontrado na base pública do SICAR.",
      error: "Imóvel não localizado no WFS público.",
      fonte,
    };
  }

  return {
    ok: true,
    imoveis,
    resumo: buildResumo(imoveis),
    fonte,
  };
}

/** Identifica imóveis CAR que intersectam ponto, coordenadas ou polígono. */
export async function queryCarsInPerimeter(
  input: PerimeterParseInput,
): Promise<SicarCarQueryResult> {
  const queriedAtUtc = new Date().toISOString();
  const fonte = { ...SICAR_FONT, queriedAtUtc };

  const parsed = await parsePerimeterPolygon(input);
  if (!parsed) {
    return {
      ok: false,
      imoveis: [],
      resumo: "Perímetro inválido para consulta CAR.",
      error: "Não foi possível interpretar a geometria.",
      fonte,
    };
  }

  const { polygon, bbox } = parsed;
  const ufs = resolveUfsForBbox(bbox);
  if (ufs.length === 0) {
    return {
      ok: false,
      imoveis: [],
      resumo: "Área fora do recorte das UFs disponíveis no SICAR.",
      error: "BBox sem UF correspondente.",
      fonte,
    };
  }

  const wkt = polygonToCqlWkt(polygon);
  const centroid = center(polygon);
  const [centLng, centLat] = centroid.geometry.coordinates;

  const collected: SicarCarRecord[] = [];

  for (const uf of ufs) {
    if (wkt) {
      const byPoly = await fetchByCql({
        uf,
        cqlFilter: `INTERSECTS(geo_area_imovel,${wkt})`,
        maxFeatures: 50,
      });
      collected.push(...byPoly);
    }

    if (collected.length === 0) {
      const byPoint = await fetchByCql({
        uf,
        cqlFilter: `INTERSECTS(geo_area_imovel,POINT(${centLng} ${centLat}))`,
        maxFeatures: 50,
      });
      collected.push(...byPoint);
    }

    if (collected.length === 0) {
      const byBbox = await fetchByBbox({ uf, bbox, maxFeatures: 50 });
      collected.push(...byBbox);
    }
  }

  const intersecting = filterByPerimeter(dedupeRecords(collected), polygon);

  if (intersecting.length === 0) {
    return {
      ok: true,
      imoveis: [],
      resumo: "Nenhum imóvel CAR intersectou o perímetro consultado.",
      fonte,
    };
  }

  return {
    ok: true,
    imoveis: intersecting,
    resumo: buildResumo(intersecting),
    fonte,
  };
}

export function sicarRecordsToFactualSummary(records: SicarCarRecord[]): string {
  if (records.length === 0) return "Nenhum CAR no perímetro.";
  return records
    .map(
      (r) =>
        `${r.codImovel}: ${r.situacao}${r.municipio ? ` · ${r.municipio}/${r.uf}` : ""} · ${r.areaHa.toFixed(2)} ha`,
    )
    .join(" | ");
}
