import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import type { Fuso } from "@/lib/types";

export type MemorialContext = "georef" | "studies";

export type MemorialMetadata = {
  imovel: string;
  proprietario: string;
  cpfCnpj: string;
  matricula: string;
  municipio: string;
  uf: string;
  tituloArea: string;
  fuso: Fuso;
  responsavelTecnico: string;
  creaCft: string;
};

export type MemorialUtmPoint = {
  easting: number;
  northing: number;
};

export type MemorialSegment = {
  fromVertex: string;
  toVertex: string;
  easting1: number;
  northing1: number;
  easting2: number;
  northing2: number;
  distancia: number;
  azimute: number;
  confrontante: string;
};

export type MemorialMetrics = {
  areaHa: number;
  perimetroM: number;
  vertexCount: number;
  fuso: Fuso;
};

export type MemorialComputation = {
  segments: MemorialSegment[];
  metrics: MemorialMetrics;
  utmRing: MemorialUtmPoint[];
};

export type MemorialDraft = {
  metadata: MemorialMetadata;
  polygon: Feature<Polygon | MultiPolygon> | null;
  confrontantes: string[];
  memorialText: string;
  sourceLabel?: string;
};

export type MemorialGeoRing = Position[];

export const DEFAULT_MEMORIAL_METADATA: MemorialMetadata = {
  imovel: "",
  proprietario: "",
  cpfCnpj: "",
  matricula: "",
  municipio: "",
  uf: "MG",
  tituloArea: "PERÍMETRO",
  fuso: "23",
  responsavelTecnico: "",
  creaCft: "",
};

export const MEMORIAL_DRAFT_STORAGE_KEYS: Record<MemorialContext, string> = {
  georef: "memorial-descritivo-draft-georef",
  studies: "memorial-descritivo-draft-studies",
};
