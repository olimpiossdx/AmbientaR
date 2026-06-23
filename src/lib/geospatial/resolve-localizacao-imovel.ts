import area from "@turf/area";
import bbox from "@turf/bbox";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import center from "@turf/center";
import distance from "@turf/distance";
import intersect from "@turf/intersect";
import { featureCollection } from "@turf/helpers";
import type { Feature, Point, Polygon } from "geojson";
import {
  geometryToFeaturePolygon,
  parsePerimeterPolygon,
  type PerimeterParseInput,
} from "@/lib/geospatial/perimeter";
import { fetchCarByCodImovelCached } from "@/lib/geospatial/sicar-car-cache";
import {
  queryCarsInPerimeter,
  SICAR_WFS_BASE_URL,
} from "@/lib/geospatial/sicar-car-service";
import { resolveUfsForBbox } from "@/lib/geospatial/sicar-uf-bounds";
import type {
  ConfiancaLocalizacao,
  ImovelSicarResumo,
  LocalizacaoResolvida,
  LocalizacaoStatus,
  MetodoEntrada,
  PerimetroFonte,
  ResolveLocalizacaoOptions,
} from "@/lib/types/localizacao-imovel";
import type { SicarCarRecord } from "@/lib/types/sicar-car";

const SICAR_FONTE = {
  nome: "SICAR GeoServer (consulta pública)",
  url: SICAR_WFS_BASE_URL,
  metodo: "WFS GetFeature + CQL/INTERSECTS",
};

const AVISO_APP_RL =
  "APP e Reserva Legal declaradas não constam na camada pública do SICAR; consulte o demonstrativo no portal CAR.";

function toResumo(record: SicarCarRecord): ImovelSicarResumo {
  return {
    codImovel: record.codImovel,
    situacao: record.situacao,
    statusLabel: record.statusLabel,
    condicao: record.condicao,
    areaHa: record.areaHa,
    municipio: record.municipio,
    uf: record.uf,
    tipoImovel: record.tipoImovel,
    dataAtualizacao: record.dataAtualizacao,
  };
}

export function sicarRecordToPolygonFeature(
  record: SicarCarRecord,
): Feature<Polygon> | null {
  if (!record.geometry?.geometry) return null;
  return geometryToFeaturePolygon(record.geometry.geometry);
}

function perimeterFromFeature(feature: Feature<Polygon>): {
  perimetroFinal: Feature<Polygon>;
  areaHa: number;
  bbox: [number, number, number, number];
} {
  const areaHa = area(feature) / 10_000;
  const box = bbox(feature) as [number, number, number, number];
  return { perimetroFinal: feature, areaHa, bbox: box };
}

function intersectionAreaHa(
  perimeter: Feature<Polygon>,
  record: SicarCarRecord,
): number {
  if (!record.geometry) return 0;
  try {
    const ix = intersect(
      featureCollection([perimeter, record.geometry as Feature<Polygon>]),
    );
    if (!ix) return 0;
    return area(ix) / 10_000;
  } catch {
    return 0;
  }
}

function sortImoveisByIntersection(
  perimeter: Feature<Polygon>,
  imoveis: SicarCarRecord[],
): SicarCarRecord[] {
  return [...imoveis].sort(
    (a, b) =>
      intersectionAreaHa(perimeter, b) - intersectionAreaHa(perimeter, a),
  );
}

function parseCoordinateEntry(data: string): { lat: number; lng: number } | null {
  const cleaned = data.replace(/[;\n]/g, " ").trim();
  const parts = cleaned.split(/[\s,]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  let lat = Number(parts[0]);
  let lng = Number(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    [lat, lng] = [lng, lat];
  }
  return { lat, lng };
}

function computeConfianca(params: {
  perimetroFonte: PerimetroFonte;
  status: LocalizacaoStatus;
  gpsAccuracyM?: number;
  pointInPolygon?: boolean;
  distToCentroidKm?: number;
}): { confianca: ConfiancaLocalizacao; motivo?: string } {
  if (params.status === "ambiguo") {
    return { confianca: "baixa", motivo: "Múltiplos imóveis CAR no local." };
  }
  if (params.status === "nao_encontrado") {
    return { confianca: "baixa", motivo: "Nenhum CAR identificado." };
  }
  if (params.perimetroFonte === "buffer_ponto") {
    return { confianca: "baixa", motivo: "Perímetro estimado por buffer de ponto." };
  }
  if (params.gpsAccuracyM != null && params.gpsAccuracyM > 50) {
    return {
      confianca: "media",
      motivo: `GPS com precisão ±${Math.round(params.gpsAccuracyM)} m.`,
    };
  }
  if (params.pointInPolygon === false && (params.distToCentroidKm ?? 0) > 0.05) {
    return {
      confianca: "media",
      motivo: "Ponto distante do limite do imóvel CAR.",
    };
  }
  if (params.perimetroFonte === "sicar") {
    return { confianca: "alta", motivo: "Geometria oficial SICAR." };
  }
  return { confianca: "media", motivo: "Perímetro desenhado ou enviado." };
}

function extratoMgFlags(
  imovel: ImovelSicarResumo | undefined,
  extratoUfEsperada: string,
): { extratoMgAplicavel: boolean; avisoUf?: string } {
  if (!imovel?.uf) {
    return { extratoMgAplicavel: false };
  }
  const ok = imovel.uf.toUpperCase() === extratoUfEsperada.toUpperCase();
  return {
    extratoMgAplicavel: ok,
    avisoUf: ok
      ? undefined
      : `Imóvel em ${imovel.uf}. Este pacote cobre ${extratoUfEsperada}. Use Análise Geoespacial completa para consulta fora de ${extratoUfEsperada}.`,
  };
}

function pickImovel(
  imoveis: SicarCarRecord[],
  codSelecionado?: string,
): SicarCarRecord | undefined {
  if (!imoveis.length) return undefined;
  if (codSelecionado) {
    return imoveis.find((i) => i.codImovel === codSelecionado) ?? imoveis[0];
  }
  return imoveis[0];
}

function buildFromImovel(params: {
  record: SicarCarRecord;
  metodoEntrada: MetodoEntrada;
  imoveis: SicarCarRecord[];
  perimetroFonte: PerimetroFonte;
  perimetroFinal: Feature<Polygon>;
  areaHa: number;
  bbox: [number, number, number, number];
  status: LocalizacaoStatus;
  gpsAccuracyM?: number;
  coordenadasEntrada?: { lat: number; lng: number };
  extratoUfEsperada: string;
  imovelSelecionadoCod?: string;
}): LocalizacaoResolvida {
  const imovelResumo = toResumo(params.record);
  const { extratoMgAplicavel, avisoUf } = extratoMgFlags(
    imovelResumo,
    params.extratoUfEsperada,
  );
  const point: Feature<Point> | null =
    params.coordenadasEntrada != null
      ? {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [
              params.coordenadasEntrada.lng,
              params.coordenadasEntrada.lat,
            ],
          },
        }
      : null;
  const pointInPolygon = point
    ? booleanPointInPolygon(point, params.perimetroFinal)
    : undefined;
  const distToCentroidKm = point
    ? distance(point, center(params.perimetroFinal), { units: "kilometers" })
    : undefined;
  const { confianca, motivo } = computeConfianca({
    perimetroFonte: params.perimetroFonte,
    status: params.status,
    gpsAccuracyM: params.gpsAccuracyM,
    pointInPolygon,
    distToCentroidKm,
  });

  return {
    status: params.status,
    metodoEntrada: params.metodoEntrada,
    imoveis: params.imoveis.map(toResumo),
    imovelSelecionadoCod: params.imovelSelecionadoCod ?? params.record.codImovel,
    perimetroFinal: params.perimetroFinal,
    areaHa: params.areaHa,
    bbox: params.bbox,
    perimetroFonte: params.perimetroFonte,
    confianca,
    confiancaMotivo: motivo,
    gpsAccuracyM: params.gpsAccuracyM,
    coordenadasEntrada: params.coordenadasEntrada,
    consultadoEmUtc: new Date().toISOString(),
    ufsConsultadas: resolveUfsForBbox(params.bbox),
    extratoMgAplicavel,
    avisoUf,
    fonte: { ...SICAR_FONTE, metodo: SICAR_FONTE.metodo },
    avisos: [AVISO_APP_RL],
  };
}

function failureResult(params: {
  metodoEntrada: MetodoEntrada;
  status: LocalizacaoStatus;
  error: string;
  perimetroFinal?: Feature<Polygon>;
  areaHa?: number;
  bbox?: [number, number, number, number];
  perimetroFonte?: PerimetroFonte;
  imoveis?: SicarCarRecord[];
  imovelSelecionadoCod?: string;
  gpsAccuracyM?: number;
  coordenadasEntrada?: { lat: number; lng: number };
  extratoUfEsperada: string;
}): LocalizacaoResolvida {
  const imoveis = params.imoveis ?? [];
  const imovelResumo = imoveis[0] ? toResumo(imoveis[0]) : undefined;
  const { extratoMgAplicavel, avisoUf } = extratoMgFlags(
    imovelResumo,
    params.extratoUfEsperada,
  );
  const { confianca, motivo } = computeConfianca({
    perimetroFonte: params.perimetroFonte ?? "buffer_ponto",
    status: params.status,
    gpsAccuracyM: params.gpsAccuracyM,
  });

  const fallbackPoly: Feature<Polygon> = params.perimetroFinal ?? {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 0.001], [0.001, 0.001], [0.001, 0], [0, 0]]] },
  };

  return {
    status: params.status,
    metodoEntrada: params.metodoEntrada,
    imoveis: imoveis.map(toResumo),
    imovelSelecionadoCod: params.imovelSelecionadoCod,
    perimetroFinal: fallbackPoly,
    areaHa: params.areaHa ?? 0,
    bbox: params.bbox ?? [0, 0, 0, 0],
    perimetroFonte: params.perimetroFonte ?? "buffer_ponto",
    confianca,
    confiancaMotivo: motivo,
    gpsAccuracyM: params.gpsAccuracyM,
    coordenadasEntrada: params.coordenadasEntrada,
    consultadoEmUtc: new Date().toISOString(),
    ufsConsultadas: params.bbox ? resolveUfsForBbox(params.bbox) : [],
    extratoMgAplicavel,
    avisoUf,
    fonte: { ...SICAR_FONTE, metodo: SICAR_FONTE.metodo },
    avisos: [AVISO_APP_RL, params.error],
  };
}

export async function resolveLocalizacaoImovel(
  input: PerimeterParseInput,
  options: ResolveLocalizacaoOptions = {},
): Promise<LocalizacaoResolvida> {
  const extratoUfEsperada = options.extratoUfEsperada ?? "MG";
  const metodoEntrada: MetodoEntrada =
    input.dataType === "coordinates"
      ? options.gpsAccuracyM != null
        ? "gps"
        : "coordinates"
      : input.dataType;

  if (input.dataType === "car") {
    const result = await fetchCarByCodImovelCached(input.data.trim());
    if (!result.ok || result.imoveis.length === 0) {
      return failureResult({
        metodoEntrada: "car",
        status: "nao_encontrado",
        error: result.error ?? "CAR não encontrado na base pública do SICAR.",
        imoveis: [],
        extratoUfEsperada,
      });
    }
    const record = result.imoveis[0];
    const poly = sicarRecordToPolygonFeature(record);
    if (!poly) {
      return failureResult({
        metodoEntrada: "car",
        status: "nao_encontrado",
        error: "CAR localizado sem geometria pública disponível.",
        imoveis: result.imoveis,
        extratoUfEsperada,
      });
    }
    const { perimetroFinal, areaHa, bbox: box } = perimeterFromFeature(poly);
    return buildFromImovel({
      record,
      metodoEntrada: "car",
      imoveis: result.imoveis,
      perimetroFonte: "sicar",
      perimetroFinal,
      areaHa,
      bbox: box,
      status: "ok",
      extratoUfEsperada,
    });
  }

  if (input.dataType === "coordinates") {
    const coords = parseCoordinateEntry(input.data);
    const parsed = await parsePerimeterPolygon(input);
    if (!parsed || !coords) {
      return failureResult({
        metodoEntrada,
        status: "nao_encontrado",
        error: "Coordenadas inválidas.",
        extratoUfEsperada,
        gpsAccuracyM: options.gpsAccuracyM,
      });
    }

    const carQuery = await queryCarsInPerimeter(input);
    const sorted = sortImoveisByIntersection(parsed.polygon, carQuery.imoveis);

    if (sorted.length === 0) {
      return failureResult({
        metodoEntrada,
        status: "nao_encontrado",
        error: "Nenhum imóvel CAR intersectou o ponto consultado.",
        perimetroFinal: parsed.polygon,
        areaHa: parsed.areaHa,
        bbox: parsed.bbox,
        perimetroFonte: "buffer_ponto",
        imoveis: [],
        gpsAccuracyM: options.gpsAccuracyM,
        coordenadasEntrada: coords,
        extratoUfEsperada,
      });
    }

    if (sorted.length > 1 && !options.codImovelSelecionado) {
      const suggested = sorted[0];
      return failureResult({
        metodoEntrada,
        status: "ambiguo",
        error: `${sorted.length} imóveis CAR no local. Selecione um imóvel.`,
        perimetroFinal: parsed.polygon,
        areaHa: parsed.areaHa,
        bbox: parsed.bbox,
        perimetroFonte: "buffer_ponto",
        imoveis: sorted,
        imovelSelecionadoCod: suggested.codImovel,
        gpsAccuracyM: options.gpsAccuracyM,
        coordenadasEntrada: coords,
        extratoUfEsperada,
      });
    }

    const record = pickImovel(sorted, options.codImovelSelecionado)!;
    const sicarPoly = sicarRecordToPolygonFeature(record);
    const finalFeature = sicarPoly ?? parsed.polygon;
    const { perimetroFinal, areaHa, bbox: box } = perimeterFromFeature(finalFeature);

    return buildFromImovel({
      record,
      metodoEntrada,
      imoveis: sorted,
      perimetroFonte: sicarPoly ? "sicar" : "buffer_ponto",
      perimetroFinal,
      areaHa,
      bbox: box,
      status: "ok",
      imovelSelecionadoCod: record.codImovel,
      gpsAccuracyM: options.gpsAccuracyM,
      coordenadasEntrada: coords,
      extratoUfEsperada,
    });
  }

  const parsed = await parsePerimeterPolygon(input);
  if (!parsed) {
    return failureResult({
      metodoEntrada,
      status: "nao_encontrado",
      error: "Perímetro inválido para consulta.",
      extratoUfEsperada,
    });
  }

  const perimetroFonte: PerimetroFonte =
    input.dataType === "kml" || input.dataType === "shp" ? "upload" : "desenho";

  const carQuery = await queryCarsInPerimeter(input);
  const sorted = sortImoveisByIntersection(parsed.polygon, carQuery.imoveis);

  if (sorted.length === 0) {
    return failureResult({
      metodoEntrada,
      status: "nao_encontrado",
      error: "Nenhum imóvel CAR intersectou o perímetro.",
      perimetroFinal: parsed.polygon,
      areaHa: parsed.areaHa,
      bbox: parsed.bbox,
      perimetroFonte,
      imoveis: [],
      extratoUfEsperada,
    });
  }

  if (sorted.length > 1 && !options.codImovelSelecionado) {
    return failureResult({
      metodoEntrada,
      status: "ambiguo",
      error: `${sorted.length} imóveis CAR intersectam o perímetro.`,
      perimetroFinal: parsed.polygon,
      areaHa: parsed.areaHa,
      bbox: parsed.bbox,
      perimetroFonte,
      imoveis: sorted,
      imovelSelecionadoCod: sorted[0].codImovel,
      extratoUfEsperada,
    });
  }

  const record = pickImovel(sorted, options.codImovelSelecionado)!;
  return buildFromImovel({
    record,
    metodoEntrada,
    imoveis: sorted,
    perimetroFonte,
    perimetroFinal: parsed.polygon,
    areaHa: parsed.areaHa,
    bbox: parsed.bbox,
    status: "ok",
    imovelSelecionadoCod: record.codImovel,
    extratoUfEsperada,
  });
}

export type ParsedAnalysisPerimeter = {
  polygon: Feature<Polygon>;
  areaHa: number;
  bbox: [number, number, number, number];
  source: PerimetroFonte | PerimeterParseInput["dataType"];
  resolved?: LocalizacaoResolvida;
};

/** Perímetro normalizado para Wave A (resolve CAR e coordenadas com prioridade SICAR). */
export async function parseAnalysisPerimeter(
  input: PerimeterParseInput,
  options: ResolveLocalizacaoOptions = {},
): Promise<ParsedAnalysisPerimeter> {
  if (input.dataType === "car" || input.dataType === "coordinates") {
    const resolved = await resolveLocalizacaoImovel(input, options);

    if (input.dataType === "car") {
      if (resolved.status === "nao_encontrado") {
        throw new Error(
          resolved.avisos.find((a) => a !== AVISO_APP_RL) ??
            "CAR não encontrado no SICAR.",
        );
      }
      if (resolved.status === "ambiguo") {
        throw new Error(
          "Múltiplos imóveis CAR para este recibo. Informe o número completo.",
        );
      }
    }

    if (input.dataType === "coordinates" && resolved.status === "ambiguo") {
      throw new Error(
        resolved.avisos.find((a) => a !== AVISO_APP_RL) ??
          "Múltiplos imóveis CAR no ponto. Selecione o imóvel.",
      );
    }

    if (
      input.dataType === "coordinates" &&
      resolved.status === "nao_encontrado"
    ) {
      if (resolved.areaHa <= 0) {
        throw new Error("Coordenadas inválidas.");
      }
      return {
        polygon: resolved.perimetroFinal,
        areaHa: resolved.areaHa,
        bbox: resolved.bbox,
        source: "buffer_ponto",
        resolved,
      };
    }

    return {
      polygon: resolved.perimetroFinal,
      areaHa: resolved.areaHa,
      bbox: resolved.bbox,
      source: resolved.perimetroFonte,
      resolved,
    };
  }

  const parsed = await parsePerimeterPolygon(input);
  if (!parsed) {
    throw new Error(
      "Perímetro inválido. Desenhe um polígono no mapa ou informe GeoJSON/WKT válido.",
    );
  }

  return {
    polygon: parsed.polygon,
    areaHa: parsed.areaHa,
    bbox: parsed.bbox,
    source: input.dataType,
  };
}

export { localizacaoToPerimeterInput } from "@/lib/geospatial/localizacao-imovel-client";
