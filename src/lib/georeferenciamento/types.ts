/** Tipos do módulo Georeferenciamento (AmbientaR). */

export type GeorefTipo =
  | "rural"
  | "urbano"
  | "ambiental"
  | "misto";

export type GeorefStatus =
  | "prospeccao"
  | "contratacao"
  | "campo"
  | "processamento"
  | "documentacao"
  | "certificacao_sigef"
  | "validacao_car"
  | "registro_cartorio"
  | "concluido"
  | "cancelado";

export type GeorefChecklistState = Record<string, boolean>;

/** Vértice importado (planilha SIGEF, CSV, GeoJSON, KML). */
export type GeorefVertice = {
  codigo?: string;
  sequencia?: number;
  /** Graus decimais (SIRGAS2000 geográficas). */
  lon?: number;
  lat?: number;
  /** UTM (quando não houver lat/lon). */
  easting?: number;
  northing?: number;
  altitude?: number;
  confrontante?: string;
};

export type GeorefVerticesMeta = {
  vertices: GeorefVertice[];
  sourceFile?: string;
  importedAt?: string;
  format?: "csv" | "xlsx" | "ods" | "geojson" | "kml" | "xml" | string;
  crsHint?: string;
  warnings?: string[];
};

export type GeorefProject = {
  id: string;
  title: string;
  tipo: GeorefTipo;
  status: GeorefStatus;
  /** Processo (`requests`) vinculado. */
  requestId?: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  municipio?: string;
  uf?: string;
  matricula?: string;
  car?: string;
  ccir?: string;
  cnsCartorio?: string;
  areaHa?: number;
  responsavelTecnico?: string;
  crea?: string;
  artRrt?: string;
  sigefParcelaId?: string;
  checklist: GeorefChecklistState;
  notes?: string;
  polygonGeojson?: object;
  vertices?: GeorefVertice[];
  verticesMeta?: Omit<GeorefVerticesMeta, "vertices">;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export const GEOREF_STATUS_LABELS: Record<GeorefStatus, string> = {
  prospeccao: "Prospecção",
  contratacao: "Contratação / RT",
  campo: "Levantamento de campo",
  processamento: "Processamento / cálculos",
  documentacao: "Memorial e planta",
  certificacao_sigef: "Certificação SIGEF (INCRA)",
  validacao_car: "CAR / órgão ambiental",
  registro_cartorio: "Registro em cartório",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const GEOREF_TIPO_LABELS: Record<GeorefTipo, string> = {
  rural: "Rural (SIGEF/INCRA)",
  urbano: "Urbano (cartório)",
  ambiental: "Ambiental (CAR)",
  misto: "Misto",
};
