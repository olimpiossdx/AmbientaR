import { attachSignedUrls, getMosaic, listMosaicsForWorkspace } from "./mosaic-service";
import type { FadCompareSession, FadTimelapseFrame, FadWorkspace } from "./types";

export async function createCompareSession(params: {
  workspace: FadWorkspace;
  beforeMosaicId: string;
  afterMosaicId: string;
}): Promise<FadCompareSession> {
  const { workspace, beforeMosaicId, afterMosaicId } = params;

  if (beforeMosaicId === afterMosaicId) {
    throw Object.assign(new Error("Escolha duas datas diferentes."), { status: 400 });
  }

  const [before, after] = await Promise.all([
    getMosaic(workspace.id, beforeMosaicId),
    getMosaic(workspace.id, afterMosaicId),
  ]);

  if (!before || before.status !== "ready") {
    throw Object.assign(new Error("Imagem «antes» não encontrada ou indisponível."), { status: 404 });
  }
  if (!after || after.status !== "ready") {
    throw Object.assign(new Error("Imagem «depois» não encontrada ou indisponível."), { status: 404 });
  }

  const [beforeUrls, afterUrls] = await Promise.all([
    attachSignedUrls(before),
    attachSignedUrls(after),
  ]);

  return {
    workspaceId: workspace.id,
    before: beforeUrls,
    after: afterUrls,
    aoi: workspace.aoi!,
  };
}

export async function buildTimelapse(params: {
  workspaceId: string;
  mosaicIds?: string[];
}): Promise<FadTimelapseFrame[]> {
  const mosaics = await listMosaicsForWorkspace(params.workspaceId);
  const ready = mosaics.filter((m) => m.status === "ready");

  let selected = ready;
  if (params.mosaicIds?.length) {
    const idSet = new Set(params.mosaicIds);
    selected = ready.filter((m) => idSet.has(m.id));
  }

  selected.sort((a, b) => a.requestedDate.localeCompare(b.requestedDate));

  const frames: FadTimelapseFrame[] = [];
  for (const m of selected) {
    const withUrl = await attachSignedUrls(m);
    frames.push({
      mosaicId: m.id,
      date: m.requestedDate,
      sceneDate: m.sceneDate,
      previewUrl: withUrl.previewUrl,
    });
  }

  return frames;
}
