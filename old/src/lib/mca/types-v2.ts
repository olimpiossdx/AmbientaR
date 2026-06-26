import type { FeatureCollection } from "geojson";
import type { McaProjectMeta, McaRlRow, McaTableRow } from "./types";

/** Estados de layer (orquestrador stateful v2). */
export type McaLayerState =
  | "pending"
  | "running"
  | "blocked"
  | "invalidated"
  | "stale"
  | "reviewed"
  | "promoted";

export type McaReviewStatus = "draft" | "reviewed" | "promoted";

export type McaSemanticLayer = {
  semanticId: string;
  spatialRef: string;
  class: string;
  taxonomy: "ambiental" | "fund" | "hydro" | "uso" | "infra" | "ctx" | "base";
  legalBasis?: string;
  origin: string;
  derivedFrom?: string[];
  reviewStatus: McaReviewStatus;
};

export type McaSpatialLayer = {
  spatialId: string;
  geometryRef: string;
  checksum: string;
  topologyStatus: "valid" | "repaired" | "invalid";
  sourceAgentId: string;
  areaHa?: number;
  layerState?: McaLayerState;
};

export type McaCartographicView = {
  viewId: string;
  spatialRef: string;
  scaleDenominator: number;
  templateId: string;
  styleProfile: string;
  zIndex: number;
};

export type McaLayoutJsonFrame = {
  type: "main" | "inset";
  extent?: [number, number, number, number];
  scale?: string;
};

export type McaLayoutJsonLegendItem = {
  layerKey: string;
  label: string;
  group: string;
};

export type McaLayoutJson = {
  version: 2;
  templateId: string;
  title: string;
  scale: string;
  scaleDenominator: number;
  crs: string;
  meta: Pick<
    McaProjectMeta,
    | "propertyName"
    | "ownerName"
    | "municipality"
    | "matriculas"
    | "car"
    | "areaTotalHa"
    | "technicalResponsible"
    | "crea"
  >;
  frames: McaLayoutJsonFrame[];
  layerOrder: string[];
  legend: McaLayoutJsonLegendItem[];
  tables: {
    uso: McaTableRow[];
    app: McaTableRow[];
    rl: McaRlRow[];
  };
  northArrow: boolean;
  grid: { utm: boolean };
  inset: { scale: string; enabled: boolean };
  stamp: { crea?: string; technicalResponsible?: string };
  layoutFragments: Record<string, unknown>;
  semanticLayers: McaSemanticLayer[];
  spatialLayers: McaSpatialLayer[];
  cartographicViews: McaCartographicView[];
  generatedAt: string;
};

export type McaLayerBundle = {
  layerKey: string;
  geojson: FeatureCollection;
  checksum: string;
  sourceAgentId?: string;
};
