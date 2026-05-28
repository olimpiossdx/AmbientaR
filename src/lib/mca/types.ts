import type { FeatureCollection } from "geojson";
import type { McaLayoutJson } from "./types-v2";

export type McaAgentMode = "deterministic" | "ia_assisted" | "layout_only";

export type McaAgentFamily =
  | "orchestration"
  | "ingest"
  | "learn"
  | "fund"
  | "hydro"
  | "uso"
  | "amb"
  | "infra"
  | "base"
  | "layout"
  | "cad"
  | "qa";

export type McaAgentDef = {
  family: McaAgentFamily;
  mode: McaAgentMode;
  etapa_min: number;
  depends_on: string[];
  produces: string;
};

export type McaRegistry = Record<string, McaAgentDef>;

export type McaProjectMeta = {
  propertyName?: string;
  ownerName?: string;
  municipality?: string;
  comarca?: string;
  cartorio?: string;
  matriculas?: string[];
  car?: string;
  areaTotalHa?: number;
  scale?: string;
  templateId?: string;
  crs?: string;
  technicalResponsible?: string;
  crea?: string;
  ownerCpf?: string;
  sedeLat?: string;
  sedeLon?: string;
  compensacaoSei?: string;
  dwgFileName?: string;
  dwgConvertedAt?: string;
  importedLayerKeys?: string[];
  lastImportAt?: string;
  invalidatedLayerKeys?: string[];
  goldPresetId?: string;
};

export type McaEtapaStatus = "locked" | "active" | "pass" | "fail";

export type McaProjectDoc = {
  uid: string;
  title: string;
  meta: McaProjectMeta;
  perimeterGeoJson?: FeatureCollection | GeoJSON.Feature | GeoJSON.Polygon;
  currentEtapa: number;
  etapaStatus: Record<string, McaEtapaStatus>;
  layerPlan?: string[];
  tables?: {
    uso?: McaTableRow[];
    app?: McaTableRow[];
    rl?: McaRlRow[];
  };
  layoutMeta?: Record<string, unknown>;
  /** Layout JSON v2 — contrato jsPDF + QGIS futuro */
  layoutJson?: McaLayoutJson;
  scores?: {
    geometric?: number;
    topological?: number;
    environmental?: number;
    semantic?: number;
    visual?: number;
    ia?: number;
    final?: number;
  };
  dwgGcsPath?: string;
  lastJobId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type McaTableRow = {
  classe: string;
  areaHa: number;
  percent?: number;
};

export type McaRlRow = {
  matricula: string;
  gleba: string;
  areaHa: number;
  compensada?: boolean;
};

export type McaAgentRunStatus = "pending" | "running" | "pass" | "fail" | "skipped";

export type McaAgentRun = {
  agentId: string;
  status: McaAgentRunStatus;
  message?: string;
  durationMs?: number;
  score?: number;
};

export type McaAgentContext = {
  project: McaProjectDoc;
  layers: Map<string, FeatureCollection>;
  logs: string[];
};

export type McaAgentResult = {
  agentId: string;
  status: McaAgentRunStatus;
  message?: string;
  layerKey?: string;
  geojson?: FeatureCollection;
  meta?: Record<string, unknown>;
  score?: number;
};
