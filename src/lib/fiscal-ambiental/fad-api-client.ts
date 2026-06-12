import type { GeoJSON } from "geojson";
import type {
  CreateFadWorkspaceInput,
  FadWorkspace,
  UpdateFadWorkspaceInput,
} from "./types";

async function fadFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    data?: T;
    error?: { message?: string } | string;
  };

  if (!res.ok) {
    const message =
      typeof body.error === "string"
        ? body.error
        : body.error?.message ?? `Erro ${res.status}`;
    return { ok: false, error: message, status: res.status };
  }

  if (body.ok === false) {
    const message =
      typeof body.error === "string"
        ? body.error
        : body.error?.message ?? "Pedido falhou";
    return { ok: false, error: message, status: res.status };
  }

  return { ok: true, data: (body.data ?? body) as T };
}

export async function listFadWorkspaces(token: string) {
  return fadFetch<FadWorkspace[]>("/api/fiscal-ambiental/workspace", token);
}

export async function getFadWorkspace(token: string, workspaceId: string) {
  return fadFetch<FadWorkspace>(`/api/fiscal-ambiental/workspace/${workspaceId}`, token);
}

export async function createFadWorkspace(token: string, input: CreateFadWorkspaceInput) {
  return fadFetch<FadWorkspace>("/api/fiscal-ambiental/workspace", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateFadWorkspace(
  token: string,
  workspaceId: string,
  patch: UpdateFadWorkspaceInput,
) {
  return fadFetch<FadWorkspace>(`/api/fiscal-ambiental/workspace/${workspaceId}`, token, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteFadWorkspace(token: string, workspaceId: string) {
  return fadFetch<{ deleted: true }>(`/api/fiscal-ambiental/workspace/${workspaceId}`, token, {
    method: "DELETE",
  });
}

export type InpeDayAvailability = {
  date: string;
  quality: "good" | "fair" | "none";
  resolutionM: number;
  label: string;
  cloudCover: number | null;
  candidateCount: number;
};

export type FadMosaicDto = {
  id: string;
  workspaceId: string;
  requestedDate: string;
  sceneDate?: string;
  resolutionM?: number;
  quality?: string;
  stacCollection?: string;
  previewUrl?: string;
  geotiffUrl?: string;
  attribution: string;
  status: string;
};

export async function fetchInpeAvailability(
  token: string,
  workspaceId: string,
  year: number,
) {
  return fadFetch<{ year: number; days: InpeDayAvailability[] }>(
    "/api/fiscal-ambiental/inpe/availability",
    token,
    { method: "POST", body: JSON.stringify({ workspaceId, year }) },
  );
}

export async function assembleInpeMosaic(
  token: string,
  workspaceId: string,
  date: string,
) {
  return fadFetch<{ mosaic: FadMosaicDto; progress: number; currentStep: string }>(
    "/api/fiscal-ambiental/inpe/assemble",
    token,
    { method: "POST", body: JSON.stringify({ workspaceId, date }) },
  );
}

export async function preheatWorkspace(token: string, workspaceId: string) {
  return fadFetch<{ mosaic?: FadMosaicDto; preheatedDate?: string; skipped?: boolean }>(
    "/api/fiscal-ambiental/preheat",
    token,
    { method: "POST", body: JSON.stringify({ workspaceId }) },
  );
}

export async function listMosaics(token: string, workspaceId: string) {
  return fadFetch<FadMosaicDto[]>(
    `/api/fiscal-ambiental/mosaic?workspaceId=${encodeURIComponent(workspaceId)}`,
    token,
  );
}

export async function getGeotiffDownloadUrl(
  token: string,
  workspaceId: string,
  mosaicId: string,
) {
  return fadFetch<{ downloadUrl: string }>(
    `/api/fiscal-ambiental/mosaic/${mosaicId}/download?workspaceId=${encodeURIComponent(workspaceId)}`,
    token,
  );
}

export type FadTimelineEventDto = {
  id: string;
  kind: string;
  title: string;
  body?: string;
  occurredAt: string;
  mosaicId?: string;
};

export async function listTimeline(token: string, workspaceId: string) {
  return fadFetch<FadTimelineEventDto[]>(
    `/api/fiscal-ambiental/timeline?workspaceId=${encodeURIComponent(workspaceId)}`,
    token,
  );
}

export async function createTimelineNote(
  token: string,
  workspaceId: string,
  input: { title: string; body?: string; occurredAt?: string },
) {
  return fadFetch<FadTimelineEventDto>("/api/fiscal-ambiental/timeline", token, {
    method: "POST",
    body: JSON.stringify({ workspaceId, ...input }),
  });
}

export async function deleteTimelineNote(token: string, workspaceId: string, eventId: string) {
  return fadFetch<{ deleted: true }>(
    `/api/fiscal-ambiental/timeline/${eventId}?workspaceId=${encodeURIComponent(workspaceId)}`,
    token,
    { method: "DELETE" },
  );
}

export type FadCompareSessionDto = {
  workspaceId: string;
  before: FadMosaicDto;
  after: FadMosaicDto;
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
};

export async function createCompareSession(
  token: string,
  workspaceId: string,
  beforeMosaicId: string,
  afterMosaicId: string,
) {
  return fadFetch<FadCompareSessionDto>("/api/fiscal-ambiental/compare/create-session", token, {
    method: "POST",
    body: JSON.stringify({ workspaceId, beforeMosaicId, afterMosaicId }),
  });
}

export type FadTimelapseFrameDto = {
  mosaicId: string;
  date: string;
  previewUrl?: string;
  sceneDate?: string;
};

export async function fetchTimelapse(token: string, workspaceId: string, mosaicIds?: string[]) {
  return fadFetch<{ frames: FadTimelapseFrameDto[] }>(
    "/api/fiscal-ambiental/compare/timelapse",
    token,
    { method: "POST", body: JSON.stringify({ workspaceId, mosaicIds }) },
  );
}

export type FadEvidenceDto = {
  id: string;
  kind: string;
  title: string;
  description?: string;
  beforeMosaicId?: string;
  afterMosaicId?: string;
  beforeDate?: string;
  afterDate?: string;
  mosaicIds?: string[];
  beforePreviewUrl?: string;
  afterPreviewUrl?: string;
  framePreviewUrls?: string[];
  createdAt: string;
};

export async function listEvidence(token: string, workspaceId: string) {
  return fadFetch<FadEvidenceDto[]>(
    `/api/fiscal-ambiental/evidence?workspaceId=${encodeURIComponent(workspaceId)}`,
    token,
  );
}

export type FadChangeAnalysisDto = {
  id: string;
  workspaceId: string;
  status: string;
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
  polygons: Array<{
    type: string;
    geometry: GeoJSON.Polygon;
    areaHa: number;
    confidence: number;
  }>;
  confidence: number;
  disclaimer: string;
  mode: string;
  previewUrl?: string;
};

export async function detectChanges(
  token: string,
  workspaceId: string,
  beforeMosaicId: string,
  afterMosaicId: string,
) {
  return fadFetch<FadChangeAnalysisDto>(
    "/api/fiscal-ambiental/intelligence/detect-changes",
    token,
    {
      method: "POST",
      body: JSON.stringify({ workspaceId, beforeMosaicId, afterMosaicId }),
    },
  );
}

export async function getChangeAnalysis(token: string, workspaceId: string, analysisId: string) {
  return fadFetch<FadChangeAnalysisDto>(
    `/api/fiscal-ambiental/intelligence/analysis/${analysisId}?workspaceId=${encodeURIComponent(workspaceId)}`,
    token,
  );
}

export async function listChangeAnalyses(token: string, workspaceId: string) {
  return fadFetch<FadChangeAnalysisDto[]>(
    `/api/fiscal-ambiental/intelligence/analyses?workspaceId=${encodeURIComponent(workspaceId)}`,
    token,
  );
}

export async function saveEvidence(
  token: string,
  workspaceId: string,
  input: {
    kind: "comparison" | "timelapse" | "change_analysis";
    title: string;
    description?: string;
    beforeMosaicId?: string;
    afterMosaicId?: string;
    mosaicIds?: string[];
    changeAnalysisId?: string;
  },
) {
  return fadFetch<FadEvidenceDto>("/api/fiscal-ambiental/evidence", token, {
    method: "POST",
    body: JSON.stringify({ workspaceId, ...input }),
  });
}

export async function deleteEvidence(token: string, workspaceId: string, evidenceId: string) {
  return fadFetch<{ deleted: true }>(
    `/api/fiscal-ambiental/evidence/${evidenceId}?workspaceId=${encodeURIComponent(workspaceId)}`,
    token,
    { method: "DELETE" },
  );
}

export type FadFiscalFindingDto = {
  id: string;
  workspaceId: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "under_review" | "dismissed";
  title: string;
  description: string;
  areaHa?: number;
  confidence?: number;
  changeAnalysisId?: string;
  source: string;
  createdAt: string;
};

export async function listFiscalFindings(token: string, workspaceId: string) {
  return fadFetch<FadFiscalFindingDto[]>(
    `/api/fiscal-ambiental/findings?workspaceId=${encodeURIComponent(workspaceId)}`,
    token,
  );
}

export async function createManualFinding(
  token: string,
  workspaceId: string,
  input: { title: string; description: string },
) {
  return fadFetch<FadFiscalFindingDto>("/api/fiscal-ambiental/findings", token, {
    method: "POST",
    body: JSON.stringify({ workspaceId, ...input }),
  });
}

export async function updateFiscalFinding(
  token: string,
  workspaceId: string,
  findingId: string,
  input: { status: "open" | "under_review" | "dismissed"; dismissedReason?: string },
) {
  return fadFetch<FadFiscalFindingDto>(
    `/api/fiscal-ambiental/findings/${findingId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ workspaceId, ...input }),
    },
  );
}

export async function runFiscalChecks(token: string, workspaceId: string) {
  return fadFetch<{ created: number; findings: FadFiscalFindingDto[] }>(
    "/api/fiscal-ambiental/fiscalizacao/run-checks",
    token,
    { method: "POST", body: JSON.stringify({ workspaceId }) },
  );
}

export type FadSmartReportDto = {
  id: string;
  type: string;
  title: string;
  status: string;
  downloadUrl?: string;
  createdAt: string;
};

export async function generateFadReport(
  token: string,
  workspaceId: string,
  type: "acervo" | "mudancas" | "fiscalizacao" | "consolidado",
) {
  return fadFetch<FadSmartReportDto>("/api/fiscal-ambiental/reports/generate", token, {
    method: "POST",
    body: JSON.stringify({ workspaceId, type }),
  });
}

export async function listFadReports(token: string, workspaceId: string) {
  return fadFetch<FadSmartReportDto[]>(
    `/api/fiscal-ambiental/reports?workspaceId=${encodeURIComponent(workspaceId)}`,
    token,
  );
}

export async function getFadReportDownloadUrl(
  token: string,
  workspaceId: string,
  reportId: string,
) {
  return fadFetch<{ downloadUrl: string; report: FadSmartReportDto }>(
    `/api/fiscal-ambiental/reports/${reportId}/download?workspaceId=${encodeURIComponent(workspaceId)}`,
    token,
  );
}
