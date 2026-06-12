import type { GeoJSON } from "geojson";

export type FadWorkspaceStatus = "draft" | "ready" | "archived";

export type FadAoiSource = "car" | "drawn" | "shp" | "kml" | "coords";

export type FadWorkspace = {
  id: string;
  name: string;
  ownerId: string;
  status: FadWorkspaceStatus;
  aoi?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  aoiSource?: FadAoiSource;
  carCode?: string;
  bbox?: [number, number, number, number];
  areaHa?: number;
  archiveSummary?: {
    mosaicCount: number;
    yearMin?: number;
    yearMax?: number;
    lastBuiltAt?: string;
  };
  linkedClientId?: string;
  linkedProjectId?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type CreateFadWorkspaceInput = {
  name: string;
  aoi?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  aoiSource?: FadAoiSource;
  carCode?: string;
};

export type UpdateFadWorkspaceInput = Partial<
  Pick<
    FadWorkspace,
    | "name"
    | "status"
    | "aoi"
    | "aoiSource"
    | "carCode"
    | "bbox"
    | "areaHa"
    | "linkedClientId"
    | "linkedProjectId"
  >
>;

export type FadMosaicStatus = "queued" | "processing" | "ready" | "failed";

export type FadMosaicQuality = "good" | "fair" | "poor";

export type FadMosaic = {
  id: string;
  workspaceId: string;
  ownerId: string;
  status: FadMosaicStatus;
  requestedDate: string;
  sceneDate?: string;
  year: number;
  pipeline?: string;
  resolutionM?: number;
  cloudCover?: number | null;
  quality?: FadMosaicQuality;
  stacCollection?: string;
  stacItemId?: string;
  storage?: {
    previewPath: string;
    geotiffPath?: string;
    manifestPath?: string;
    bytes?: number;
  };
  attribution: "CBERS/INPE";
  errorMessage?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
};

export type FadMosaicWithUrls = FadMosaic & {
  previewUrl?: string;
  geotiffUrl?: string;
};

export type FadTimelineEventKind = "satellite_mosaic_created" | "manual_note";

export type FadTimelineEvent = {
  id: string;
  workspaceId: string;
  ownerId: string;
  kind: FadTimelineEventKind;
  title: string;
  body?: string;
  occurredAt: string;
  mosaicId?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
};

export type CreateFadTimelineEventInput = {
  kind: "manual_note";
  title: string;
  body?: string;
  occurredAt?: string;
};

export type UpdateFadTimelineEventInput = {
  title?: string;
  body?: string;
  occurredAt?: string;
};

export type FadEvidenceKind = "comparison" | "timelapse";

export type FadEvidenceItem = {
  id: string;
  workspaceId: string;
  ownerId: string;
  kind: FadEvidenceKind;
  title: string;
  description?: string;
  beforeMosaicId?: string;
  afterMosaicId?: string;
  mosaicIds?: string[];
  beforeDate?: string;
  afterDate?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
};

export type CreateFadEvidenceInput = {
  kind: FadEvidenceKind;
  title: string;
  description?: string;
  beforeMosaicId?: string;
  afterMosaicId?: string;
  mosaicIds?: string[];
};

export type FadCompareSession = {
  workspaceId: string;
  before: FadMosaicWithUrls;
  after: FadMosaicWithUrls;
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
};

export type FadTimelapseFrame = {
  mosaicId: string;
  date: string;
  previewUrl?: string;
  sceneDate?: string;
};
