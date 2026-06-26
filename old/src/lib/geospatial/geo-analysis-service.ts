import type { GeoFactualItem, GeoFonte } from "@/lib/types/analise-ambiental";
import type { SicarCarRecord } from "@/lib/types/sicar-car";
import { runWaveAAnalysis } from "@/lib/geospatial/run-wave-a-analysis";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import {
  fetchCarByCodImovel,
  queryCarsInPerimeter,
  sicarRecordsToFactualSummary,
  SICAR_WFS_BASE_URL,
} from "@/lib/geospatial/sicar-car-service";

type SobreposicaoResultado = {
  bioma: string;
  sobreposicaoUC: {
    ocorreu: boolean;
    nomeUC?: string;
    distanciaKm?: number;
  };
  hidrografia: Array<{ nome: string; tipo: string }>;
  factualData: GeoFactualItem[];
  fontesConsultadas: GeoFonte[];
  carImoveis?: SicarCarRecord[];
};

export type CarResultado = {
  codImovel: string;
  areaTotal: number;
  situacao: string;
  statusCodigo: string;
  condicao: string;
  municipio: string;
  uf: string;
  tipoImovel?: string;
  modFiscal?: number;
  dataAtualizacao?: string;
  /** Não disponível na camada área do imóvel do WFS público. */
  appDeclarada?: number;
  reservaLegalDeclarada?: number;
  fonte: "sicar-wfs-publico";
  aviso?: string;
};

const SICAR_FONTE: GeoFonte = {
  nome: "SICAR GeoServer (consulta pública)",
  url: SICAR_WFS_BASE_URL,
  tipo: "ogc",
};

const DEFAULT_FONTES: GeoFonte[] = [
  {
    nome: "IDE-Sisema GeoServer",
    url: "https://geoserver.meioambiente.mg.gov.br/",
    tipo: "ogc",
  },
  SICAR_FONTE,
  {
    nome: "IBAMA PAMGIA",
    url: "https://pamgia.ibama.gov.br/geoservicos/",
    tipo: "ogc",
  },
];

function estimateAreaByInput(input: string): number | undefined {
  if (!input) return undefined;
  const normalized = input.toLowerCase();
  if (normalized.includes("polygon") || normalized.includes("geojson")) {
    return 87.4;
  }
  if (normalized.includes(",")) {
    return 12.8;
  }
  return undefined;
}

function recordToCarResultado(record: SicarCarRecord): CarResultado {
  return {
    codImovel: record.codImovel,
    areaTotal: record.areaHa,
    situacao: record.situacao,
    statusCodigo: record.statusCodigo,
    condicao: record.condicao,
    municipio: record.municipio,
    uf: record.uf,
    tipoImovel: record.tipoImovel,
    modFiscal: record.modFiscal,
    dataAtualizacao: record.dataAtualizacao,
    fonte: "sicar-wfs-publico",
    aviso:
      "APP e Reserva Legal declaradas não constam na camada pública de área do imóvel; consulte o demonstrativo no SICAR.",
  };
}

function mergeFontes(base: GeoFonte[], extra: GeoFonte[]): GeoFonte[] {
  const seen = new Set<string>();
  const out: GeoFonte[] = [];
  for (const f of [...base, ...extra]) {
    const key = `${f.nome}|${f.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

async function queryCarForInput(
  data: string,
  dataType: PerimeterParseInput["dataType"],
): Promise<SicarCarRecord[]> {
  if (dataType === "car") {
    const result = await fetchCarByCodImovel(data);
    return result.imoveis;
  }
  if (
    dataType === "coordinates" ||
    dataType === "polygon" ||
    dataType === "kml" ||
    dataType === "shp"
  ) {
    const result = await queryCarsInPerimeter({ dataType, data });
    return result.imoveis;
  }
  return [];
}

export async function fetchCarData(numeroCAR: string): Promise<CarResultado> {
  const trimmed = numeroCAR.trim();
  if (!trimmed) {
    throw new Error("Número do CAR inválido.");
  }

  const result = await fetchCarByCodImovel(trimmed);
  if (!result.ok || result.imoveis.length === 0) {
    throw new Error(
      result.error ?? "CAR não encontrado na base pública do SICAR.",
    );
  }

  return recordToCarResultado(result.imoveis[0]);
}

export async function queryCarByGeometry(
  input: PerimeterParseInput,
): Promise<SicarCarRecord[]> {
  const result = await queryCarsInPerimeter(input);
  return result.imoveis;
}

export async function runGeospatialOverlay(
  data: string,
  dataType: PerimeterParseInput["dataType"] = "polygon",
): Promise<SobreposicaoResultado> {
  let carImoveis: SicarCarRecord[] = [];
  try {
    carImoveis = await queryCarForInput(data, dataType);
  } catch {
    carImoveis = [];
  }

  const carFactual: GeoFactualItem | null =
    carImoveis.length > 0
      ? {
          camada: "CAR / SICAR (imóveis no perímetro)",
          fonte: SICAR_FONTE.nome,
          metodo: "WFS GetFeature + INTERSECTS (GeoServer CAR)",
          resultado: sicarRecordsToFactualSummary(carImoveis),
        }
      : dataType !== "car"
        ? {
            camada: "CAR / SICAR (imóveis no perímetro)",
            fonte: SICAR_FONTE.nome,
            metodo: "WFS GetFeature + INTERSECTS (GeoServer CAR)",
            resultado: "Nenhum imóvel CAR intersectou o perímetro consultado.",
          }
        : null;

  try {
    const wave = await runWaveAAnalysis({ dataType, data });
    const biomaLayer = wave.layers.find((l) => l.layerId === "mg_bioma");
    const hidroLayer = wave.layers.find((l) => l.layerId === "mg_hidrografia");
    const bioma =
      biomaLayer?.stats[0]?.label ?? biomaLayer?.summary ?? "Não identificado";
    const hidrografia =
      hidroLayer?.stats.length
        ? hidroLayer.stats.map((s) => ({
            nome: s.label,
            tipo: s.lengthKm != null ? `${s.lengthKm} km` : "interseção",
          }))
        : [{ nome: hidroLayer?.summary ?? "Sem feições", tipo: "—" }];

    const factualData: GeoFactualItem[] = wave.layers.map((layer) => ({
      camada: layer.title,
      fonte: layer.source?.name ?? "IDE-Sisema GeoServer MG",
      metodo: layer.source?.method ?? "WFS + interseção (Onda A)",
      resultado: layer.summary,
      areaHa: layer.stats[0]?.areaHa,
    }));

    if (carFactual) {
      factualData.unshift(carFactual);
    }

    return {
      bioma,
      sobreposicaoUC: {
        ocorreu: false,
        nomeUC: "Consulta Onda A (UC não incluída nesta onda)",
        distanciaKm: undefined,
      },
      hidrografia,
      factualData,
      fontesConsultadas: mergeFontes(
        wave.fontesConsultadas.length ? wave.fontesConsultadas : DEFAULT_FONTES,
        [SICAR_FONTE],
      ),
      carImoveis,
    };
  } catch {
    // Fallback mínimo se perímetro inválido para Onda A
  }

  let bioma = "Cerrado";
  const hidrografia: Array<{ nome: string; tipo: string }> = [
    { nome: "Consulta Onda A indisponível — verifique o polígono", tipo: "—" },
  ];
  const areaHa = estimateAreaByInput(data);

  const factualData: GeoFactualItem[] = [];
  if (carFactual) {
    factualData.push(carFactual);
  }
  factualData.push(
    {
      camada: "Hidrografia (Onda A)",
      fonte: "IDE-Sisema",
      metodo: "fallback",
      resultado: hidrografia[0]?.nome ?? "—",
      areaHa,
    },
    {
      camada: "Bioma (Onda A)",
      fonte: "IDE-Sisema",
      metodo: "fallback",
      resultado: bioma,
      areaHa,
    },
    {
      camada: "Solos (Onda A)",
      fonte: "IDE-Sisema",
      metodo: "fallback",
      resultado: "Perímetro inválido ou serviço indisponível.",
      areaHa,
    },
  );

  return {
    bioma,
    sobreposicaoUC: {
      ocorreu: false,
      nomeUC: "Não consultado",
      distanciaKm: 15,
    },
    hidrografia,
    factualData,
    fontesConsultadas: mergeFontes(DEFAULT_FONTES, [SICAR_FONTE]),
    carImoveis,
  };
}
