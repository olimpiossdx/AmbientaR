import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { FeatureCollection } from "geojson";
import { firebaseConfig } from "@/firebase/config";
import { studyMapsAdminStorage } from "@/lib/study-maps/admin";
import { mapCadLayerToMcaKey, normalizeCadLayerName } from "./layer-import";

export type DwgConvertResult = {
  ok: boolean;
  layers: Record<string, FeatureCollection>;
  layerKeys: string[];
  message: string;
  ogrAvailable: boolean;
};

function runCmd(cmd: string, args: string[], timeoutMs = 120_000): {
  ok: boolean;
  stdout: string;
  stderr: string;
} {
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    timeout: timeoutMs,
    windowsHide: true,
  });
  return {
    ok: r.status === 0,
    stdout: (r.stdout ?? "").toString(),
    stderr: (r.stderr ?? "").toString(),
  };
}

export function isOgr2ogrAvailable(): boolean {
  return runCmd("ogr2ogr", ["--version"]).ok;
}

function parseGsUri(uri: string): { bucket: string; object: string } {
  const m = uri.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (!m) throw new Error("URI GCS inválida.");
  return { bucket: m[1], object: m[2] };
}

function listGpkgLayers(gpkgPath: string): string[] {
  const r = runCmd("ogrinfo", ["-json", gpkgPath]);
  if (!r.ok) return [];
  try {
    const data = JSON.parse(r.stdout) as { layers?: { name: string }[] };
    return (data.layers ?? []).map((l) => l.name).filter(Boolean);
  } catch {
    return [];
  }
}

function layerToGeoJson(gpkgPath: string, layerName: string, outPath: string): boolean {
  const r = runCmd("ogr2ogr", [
    "-f",
    "GeoJSON",
    outPath,
    gpkgPath,
    layerName,
    "-t_srs",
    "EPSG:31983",
  ]);
  return r.ok && fs.existsSync(outPath);
}

function mapLayerName(cadName: string): string {
  return mapCadLayerToMcaKey(cadName) ?? normalizeCadLayerName(cadName);
}

/**
 * Converte ficheiro CAD local (DWG/DXF) em layers GeoJSON via ogr2ogr → GPKG → GeoJSON.
 */
export function convertCadFileToLayers(localPath: string): DwgConvertResult {
  const ogrAvailable = isOgr2ogrAvailable();
  if (!ogrAvailable) {
    return {
      ok: false,
      layers: {},
      layerKeys: [],
      message: "ogr2ogr não encontrado no servidor. Instale GDAL ou importe GeoJSON manualmente.",
      ogrAvailable: false,
    };
  }

  if (!fs.existsSync(localPath)) {
    return {
      ok: false,
      layers: {},
      layerKeys: [],
      message: "Ficheiro CAD não encontrado.",
      ogrAvailable: true,
    };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mca-dwg-"));
  const gpkgPath = path.join(tmpDir, "cad.gpkg");

  try {
    const toGpkg = runCmd("ogr2ogr", [
      "-f",
      "GPKG",
      gpkgPath,
      localPath,
      "-t_srs",
      "EPSG:31983",
      "-skipfailures",
    ]);

    if (!toGpkg.ok || !fs.existsSync(gpkgPath)) {
      return {
        ok: false,
        layers: {},
        layerKeys: [],
        message: `ogr2ogr GPKG falhou: ${toGpkg.stderr.slice(0, 500)}`,
        ogrAvailable: true,
      };
    }

    const ogrLayers = listGpkgLayers(gpkgPath);
    const out: Record<string, FeatureCollection> = {};

    for (const layerName of ogrLayers) {
      const safe = layerName.replace(/[^\w-]/g, "_");
      const geoPath = path.join(tmpDir, `${safe}.geojson`);
      if (!layerToGeoJson(gpkgPath, layerName, geoPath)) continue;
      try {
        const fc = JSON.parse(fs.readFileSync(geoPath, "utf8")) as FeatureCollection;
        if (!fc?.features?.length) continue;
        const key = mapLayerName(layerName);
        if (out[key]) {
          out[key] = {
            type: "FeatureCollection",
            features: [...out[key].features, ...fc.features],
          };
        } else {
          out[key] = fc;
        }
      } catch {
        /* skip invalid json */
      }
    }

    const layerKeys = Object.keys(out);
    return {
      ok: layerKeys.length > 0,
      layers: out,
      layerKeys,
      message:
        layerKeys.length > 0
          ? `${layerKeys.length} layer(s) extraída(s) do CAD.`
          : "Nenhuma layer com geometria reconhecida no DWG.",
      ogrAvailable: true,
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

function mapWorkerLayers(
  raw: Record<string, FeatureCollection>,
): Record<string, FeatureCollection> {
  const out: Record<string, FeatureCollection> = {};
  for (const [cadName, fc] of Object.entries(raw)) {
    if (!fc?.features?.length) continue;
    const key = mapLayerName(cadName);
    if (out[key]) {
      out[key] = {
        type: "FeatureCollection",
        features: [...out[key].features, ...fc.features],
      };
    } else {
      out[key] = fc;
    }
  }
  return out;
}

export function isCadWorkerConfigured(): boolean {
  return Boolean(
    process.env.GEO_EXPORT_WORKER_URL?.trim() && process.env.WORKER_SHARED_SECRET?.trim(),
  );
}

/** Conversão via Cloud Run (GDAL no worker geo-export). */
export async function convertDwgFromGcsWorker(gsUri: string): Promise<DwgConvertResult> {
  const workerUrl = process.env.GEO_EXPORT_WORKER_URL?.replace(/\/$/, "");
  const workerSecret = process.env.WORKER_SHARED_SECRET;
  if (!workerUrl || !workerSecret) {
    return {
      ok: false,
      layers: {},
      layerKeys: [],
      message: "GEO_EXPORT_WORKER_URL ou WORKER_SHARED_SECRET não configurados.",
      ogrAvailable: isOgr2ogrAvailable(),
    };
  }

  try {
    const wr = await fetch(`${workerUrl}/v1/cad/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Secret": workerSecret,
      },
      body: JSON.stringify({ input_gcs_uri: gsUri, target_crs: "EPSG:31983" }),
      signal: AbortSignal.timeout(180_000),
    });
    const data = (await wr.json()) as {
      ok?: boolean;
      layers?: Record<string, FeatureCollection>;
      message?: string;
      detail?: string;
    };
    if (!wr.ok) {
      return {
        ok: false,
        layers: {},
        layerKeys: [],
        message: data.detail ?? data.message ?? `Worker HTTP ${wr.status}`,
        ogrAvailable: isOgr2ogrAvailable(),
      };
    }
    const mapped = mapWorkerLayers(data.layers ?? {});
    const layerKeys = Object.keys(mapped);
    return {
      ok: Boolean(data.ok && layerKeys.length > 0),
      layers: mapped,
      layerKeys,
      message: data.message ?? `${layerKeys.length} layer(s) via worker.`,
      ogrAvailable: isOgr2ogrAvailable(),
    };
  } catch (e) {
    return {
      ok: false,
      layers: {},
      layerKeys: [],
      message: e instanceof Error ? e.message : "Worker CAD ingest falhou.",
      ogrAvailable: isOgr2ogrAvailable(),
    };
  }
}

async function convertDwgFromGcsLocal(gsUri: string): Promise<DwgConvertResult> {
  const { bucket, object } = parseGsUri(gsUri);
  const b = studyMapsAdminStorage().bucket(bucket);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mca-dwg-dl-"));
  const ext = path.extname(object) || ".dwg";
  const localPath = path.join(tmpDir, `input${ext}`);

  try {
    await b.file(object).download({ destination: localPath });
    return convertCadFileToLayers(localPath);
  } catch (e) {
    return {
      ok: false,
      layers: {},
      layerKeys: [],
      message: e instanceof Error ? e.message : "Download GCS falhou.",
      ogrAvailable: isOgr2ogrAvailable(),
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

/** Local ogr2ogr primeiro; se falhar ou indisponível, tenta worker Cloud Run. */
export async function convertDwgFromGcs(gsUri: string): Promise<DwgConvertResult> {
  if (isOgr2ogrAvailable()) {
    const local = await convertDwgFromGcsLocal(gsUri);
    if (local.ok) return local;
    if (isCadWorkerConfigured()) {
      const remote = await convertDwgFromGcsWorker(gsUri);
      if (remote.ok) {
        return {
          ...remote,
          message: `${remote.message} (fallback worker; local: ${local.message.slice(0, 120)})`,
        };
      }
    }
    return local;
  }

  if (isCadWorkerConfigured()) {
    return convertDwgFromGcsWorker(gsUri);
  }

  return {
    ok: false,
    layers: {},
    layerKeys: [],
    message:
      "ogr2ogr local indisponível e worker não configurado. Defina GEO_EXPORT_WORKER_URL + WORKER_SHARED_SECRET ou instale GDAL.",
    ogrAvailable: false,
  };
}
