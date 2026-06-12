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
