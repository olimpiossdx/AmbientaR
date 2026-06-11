import type { Feature, Polygon } from "geojson";
import type { SicarCarRecord } from "@/lib/types/sicar-car";

export type LocalizacaoStatus = "ok" | "nao_encontrado" | "ambiguo";

export type MetodoEntrada =
  | "car"
  | "coordinates"
  | "gps"
  | "polygon"
  | "kml"
  | "shp";

export type PerimetroFonte =
  | "sicar"
  | "buffer_ponto"
  | "desenho"
  | "upload";

export type ConfiancaLocalizacao = "alta" | "media" | "baixa";

export type ImovelSicarResumo = Pick<
  SicarCarRecord,
  | "codImovel"
  | "situacao"
  | "statusLabel"
  | "condicao"
  | "areaHa"
  | "municipio"
  | "uf"
  | "tipoImovel"
  | "dataAtualizacao"
>;

export type LocalizacaoResolvida = {
  status: LocalizacaoStatus;
  metodoEntrada: MetodoEntrada;
  imoveis: ImovelSicarResumo[];
  imovelSelecionadoCod?: string;
  perimetroFinal: Feature<Polygon>;
  areaHa: number;
  bbox: [number, number, number, number];
  perimetroFonte: PerimetroFonte;
  confianca: ConfiancaLocalizacao;
  confiancaMotivo?: string;
  gpsAccuracyM?: number;
  coordenadasEntrada?: { lat: number; lng: number };
  consultadoEmUtc: string;
  ufsConsultadas: string[];
  extratoMgAplicavel: boolean;
  avisoUf?: string;
  fonte: {
    nome: string;
    url: string;
    metodo: string;
  };
  avisos: string[];
};

/** Snapshot persistido em trâmites (`requests`). */
export type RequestLocalizacaoImovel = {
  codImovel: string;
  municipio?: string;
  uf?: string;
  areaHa: number;
  metodoEntrada: MetodoEntrada;
  perimetroFonte: PerimetroFonte;
  confianca: ConfiancaLocalizacao;
  confirmadoEmUtc: string;
  gpsAccuracyM?: number;
  /** Conecta Gov (L5) — APP/RL quando credencial de órgão activa. */
  areaAppHa?: number;
  areaRlHa?: number;
  conectaGovConsultadoEmUtc?: string;
};

export type ResolveLocalizacaoOptions = {
  codImovelSelecionado?: string;
  gpsAccuracyM?: number;
  /** UF do preset de extrato (default MG). */
  extratoUfEsperada?: string;
};
