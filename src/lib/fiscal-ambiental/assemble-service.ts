import type { GeoJSON } from "geojson";
import {
  findBestItemForDate,
  pickGeotiffAssetHref,
  pickPreviewAssetHref,
  type InpeStacItem,
} from "./inpe-stac-client";
import {
  bumpWorkspaceArchiveSummary,
  completeMosaic,
  createMosaicProcessing,
  failMosaic,
  findCachedMosaic,
  attachSignedUrls,
  mosaicStoragePaths,
  uploadBufferToStorage,
} from "./mosaic-service";
import { callFiscalSatelliteWorkerAssemble } from "./worker-client";
import type { FadMosaicWithUrls } from "./types";

function qualityFromCloud(cloud: number | null): "good" | "fair" | "poor" {
  if (cloud == null) return "fair";
  if (cloud <= 30) return "good";
  if (cloud <= 70) return "fair";
  return "poor";
}

async function downloadUrl(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  if (!res.ok) throw new Error(`Download falhou (${res.status})`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function assembleInlinePreview(params: {
  workspaceId: string;
  mosaicId: string;
  item: InpeStacItem;
}): Promise<{ previewPath: string; geotiffPath?: string; bytes: number }> {
  const paths = mosaicStoragePaths(params.workspaceId, params.mosaicId);
  const previewHref = pickPreviewAssetHref(params.item);
  if (!previewHref) {
    throw new Error("Nenhuma imagem de visualização disponível nesta cena INPE.");
  }

  const previewBuf = await downloadUrl(previewHref);
  const previewBytes = await uploadBufferToStorage(
    paths.previewPath,
    previewBuf,
    previewHref.includes(".png") ? "image/png" : "image/jpeg",
  );

  let geotiffPath: string | undefined;
  let extraBytes = 0;
  const geotiffHref = pickGeotiffAssetHref(params.item);
  if (geotiffHref) {
    try {
      const tifBuf = await downloadUrl(geotiffHref);
      extraBytes = await uploadBufferToStorage(paths.geotiffPath, tifBuf, "image/tiff");
      geotiffPath = paths.geotiffPath;
    } catch {
      /* GeoTIFF opcional no modo inline */
    }
  }

  const manifest = {
    stacItemId: params.item.id,
    stacCollection: params.item.collection,
    previewSource: previewHref,
    geotiffSource: geotiffHref ?? null,
    mode: "inline_stac_asset",
  };
  await uploadBufferToStorage(
    paths.manifestPath,
    Buffer.from(JSON.stringify(manifest, null, 2)),
    "application/json",
  );

  return {
    previewPath: paths.previewPath,
    geotiffPath,
    bytes: previewBytes + extraBytes,
  };
}

export async function assembleMosaicForDate(params: {
  workspaceId: string;
  ownerId: string;
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  date: string;
}): Promise<FadMosaicWithUrls> {
  const cached = await findCachedMosaic(params.workspaceId, params.date);
  if (cached) return attachSignedUrls(cached);

  const item = await findBestItemForDate(params.aoi, params.date);
  if (!item) {
    throw new Error(`Nenhuma imagem INPE encontrada para ${params.date}.`);
  }

  const mosaic = await createMosaicProcessing({
    workspaceId: params.workspaceId,
    ownerId: params.ownerId,
    requestedDate: params.date,
  });

  try {
    const workerResult = await callFiscalSatelliteWorkerAssemble({
      workspaceId: params.workspaceId,
      mosaicId: mosaic.id,
      aoi: params.aoi,
      date: params.date,
      stacItemId: item.id,
      stacCollection: item.collection,
    });

    const storage = workerResult ?? (await assembleInlinePreview({
      workspaceId: params.workspaceId,
      mosaicId: mosaic.id,
      item,
    }));

    const completed = await completeMosaic(params.workspaceId, mosaic.id, {
      status: "ready",
      sceneDate: item.datetime,
      pipeline: item.collection,
      resolutionM: item.resolutionM,
      cloudCover: item.cloudCover,
      quality: qualityFromCloud(item.cloudCover),
      stacCollection: item.collection,
      stacItemId: item.id,
      storage: {
        previewPath: storage.previewPath,
        geotiffPath: storage.geotiffPath,
        manifestPath: mosaicStoragePaths(params.workspaceId, mosaic.id).manifestPath,
        bytes: storage.bytes,
      },
    });

    await bumpWorkspaceArchiveSummary(params.workspaceId);
    return attachSignedUrls(completed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao montar imagem.";
    await failMosaic(params.workspaceId, mosaic.id, msg);
    throw e;
  }
}
