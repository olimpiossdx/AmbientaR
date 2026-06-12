import type { GeoJSON } from "geojson";
import type { FISCAL_AMBIENTAL_FLAGS } from "./constants";

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

export type FadTimelineEventKind =
  | "satellite_mosaic_created"
  | "manual_note"
  | "change_analysis_completed"
  | "fiscal_check_completed"
  | "monitoring_run_completed";

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

export type FadChangeAnalysisType =
  | "vegetation_loss"
  | "vegetation_gain"
  | "bare_soil_exposure";

export type FadChangeAnalysisStatus = "queued" | "processing" | "ready" | "failed";

export type FadChangePolygon = {
  type: FadChangeAnalysisType;
  geometry: GeoJSON.Polygon;
  areaHa: number;
  confidence: number;
};

export type FadChangeAnalysis = {
  id: string;
  workspaceId: string;
  ownerId: string;
  status: FadChangeAnalysisStatus;
  beforeMosaicId: string;
  afterMosaicId: string;
  beforeDate: string;
  afterDate: string;
  summary: {
    lossHa: number;
    gainHa: number;
    bareHa: number;
    totalChangedHa: number;
  };
  polygons: FadChangePolygon[];
  storage?: {
    previewPath?: string;
    maskPath?: string;
  };
  confidence: number;
  disclaimer: string;
  mode: "worker" | "inline";
  previewUrl?: string;
  errorMessage?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
};

export type FadEvidenceKind = "comparison" | "timelapse" | "change_analysis";

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
  changeAnalysisId?: string;
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
  changeAnalysisId?: string;
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

export type FadFiscalFindingType =
  | "vegetation_loss"
  | "vegetation_gain"
  | "bare_soil_exposure"
  | "app_intervention"
  | "manual_observation";

export type FadFiscalSeverity = "low" | "medium" | "high" | "critical";

export type FadFiscalFindingStatus = "open" | "under_review" | "dismissed";

export type FadFiscalFindingSource =
  | "change_analysis"
  | "manual"
  | "evidence"
  | "sig_crosscheck";

export type FadFiscalFinding = {
  id: string;
  workspaceId: string;
  ownerId: string;
  type: FadFiscalFindingType;
  severity: FadFiscalSeverity;
  status: FadFiscalFindingStatus;
  title: string;
  description: string;
  areaHa?: number;
  confidence?: number;
  changeAnalysisId?: string;
  evidenceId?: string;
  geometry?: GeoJSON.Polygon;
  source: FadFiscalFindingSource;
  dismissedReason?: string;
  dedupKey?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type CreateFadManualFindingInput = {
  title: string;
  description: string;
  type?: FadFiscalFindingType;
  severity?: FadFiscalSeverity;
};

export type UpdateFadFiscalFindingInput = {
  status?: FadFiscalFindingStatus;
  dismissedReason?: string;
};

export type FadReportType = "acervo" | "mudancas" | "fiscalizacao" | "consolidado";

export type FadSmartReportStatus = "generating" | "ready" | "failed";

export type FadSmartReport = {
  id: string;
  workspaceId: string;
  ownerId: string;
  type: FadReportType;
  title: string;
  status: FadSmartReportStatus;
  storage?: {
    pdfPath: string;
    bytes?: number;
  };
  errorMessage?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
};

export type FadMonitoringFrequency =
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | "manual";

export type FadMonitoringRule = {
  id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  frequency: FadMonitoringFrequency;
  enabled: boolean;
  lastRunAt?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
};

export type CreateFadMonitoringRuleInput = {
  name: string;
  frequency: FadMonitoringFrequency;
};

export type FadMonitoringRunStatus = "running" | "completed" | "failed" | "skipped";

export type FadMonitoringAlertLevel = "none" | "low" | "medium" | "high" | "critical";

export type FadMonitoringRunStep = {
  step: string;
  status: "ok" | "skipped" | "failed";
  message?: string;
};

export type FadMonitoringRun = {
  id: string;
  workspaceId: string;
  ruleId: string;
  ownerId: string;
  status: FadMonitoringRunStatus;
  steps: FadMonitoringRunStep[];
  summary?: {
    latestMosaicId?: string;
    beforeMosaicId?: string;
    analysisId?: string;
    findingsCreated?: number;
    openFindings?: number;
    alertLevel?: FadMonitoringAlertLevel;
    latestDate?: string;
    previousDate?: string;
  };
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  createdBy: string;
};

export type FadEsgIndicators = {
  mosaicCount: number;
  vegetationGainHa: number;
  vegetationLossHa: number;
  bareSoilHa: number;
  preservedAreaHa: number;
  anthropizedAreaHa: number;
  vegetationCoverPct: number;
  openFindings: number;
  criticalFindings: number;
  highFindings: number;
  prodesAlerts: number;
  appInterventionFindings: number;
  analysisPeriod?: string;
};

export type FadEsgScores = {
  environmental: number;
  compliance: number;
  risk: number;
};

export type FadEsgExplanations = {
  environmental: string[];
  compliance: string[];
  risk: string[];
};

export type FadEsgSnapshot = {
  id: string;
  workspaceId: string;
  ownerId: string;
  indicators: FadEsgIndicators;
  scores: FadEsgScores;
  explanations: FadEsgExplanations;
  createdAt: string;
  createdBy: string;
};

export type FadEsgDashboard = {
  workspaceId: string;
  workspaceName: string;
  indicators: FadEsgIndicators;
  scores: FadEsgScores;
  explanations: FadEsgExplanations;
  latestSnapshot?: FadEsgSnapshot;
  snapshots: FadEsgSnapshot[];
};

export type FadDashboardStats = {
  workspaceCount: number;
  readyMosaicCount: number;
  totalMosaicCount: number;
  lastMosaicDate: string | null;
  openFindingsCount: number;
  monitoringRuleCount: number;
  reportCount: number;
  evidenceCount: number;
  changeAnalysisCount: number;
};

export type FadModuleSettings = {
  enabled: boolean;
  standaloneMode: boolean;
  sigCrosscheckEnabled: boolean;
  monitoringCronConfigured: boolean;
  satelliteWorkerConfigured: boolean;
  intelligenceWorkerConfigured: boolean;
  flags: typeof FISCAL_AMBIENTAL_FLAGS;
  attribution: string;
};
