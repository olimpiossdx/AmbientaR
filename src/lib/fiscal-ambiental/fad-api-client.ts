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
