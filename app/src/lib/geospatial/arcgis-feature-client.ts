import type { Feature, FeatureCollection } from "geojson";
import type { WfsFetchResult } from "@/lib/geospatial/wfs-client";

const ARCGIS_TIMEOUT_MS = 45_000;

const ARCGIS_HEADERS: HeadersInit = {
  Accept: "application/json, application/geo+json;q=0.9, */*;q=0.1",
  "User-Agent": "AmbientaR/1.0 (consultoria ambiental MG; ArcGIS REST)",
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Tempo limite ArcGIS excedido.")), ms);
    promise
      .then((v) => {
        clearTimeout(id);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(id);
        reject(e);
      });
  });
}

function parseFeatureCollection(raw: unknown): FeatureCollection | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as FeatureCollection & { error?: { message?: string } };
  if (obj.error) return null;
  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) return obj;
  return null;
}

/** Consulta feições em bbox via ArcGIS REST Query (PAMGIA / FeatureServer). */
export async function fetchArcGisFeaturesInBbox(params: {
  layerUrl: string;
  bbox: [number, number, number, number];
  maxFeatures?: number;
}): Promise<WfsFetchResult> {
  const [minX, minY, maxX, maxY] = params.bbox;
  const base = params.layerUrl.replace(/\/query\/?$/i, "").replace(/\/$/, "");
  const url = new URL(`${base}/query`);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("geometry", `${minX},${minY},${maxX},${maxY}`);
  url.searchParams.set("geometryType", "esriGeometryEnvelope");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outFields", "*");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("f", "geojson");
  url.searchParams.set(
    "resultRecordCount",
    String(Math.min(params.maxFeatures ?? 120, 500)),
  );

  try {
    const response = await withTimeout(
      fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
        headers: ARCGIS_HEADERS,
      }),
      ARCGIS_TIMEOUT_MS,
    );

    if (!response.ok) {
      return {
        ok: false,
        features: [],
        error: `ArcGIS HTTP ${response.status}`,
      };
    }

    const json = (await response.json()) as FeatureCollection & {
      error?: { message?: string };
    };
    if (json.error?.message) {
      return {
        ok: false,
        features: [],
        error: json.error.message,
      };
    }

    const fc = parseFeatureCollection(json);
    if (!fc?.features.length) {
      return {
        ok: false,
        features: [],
        noFeaturesInExtent: true,
        error: "sem feições no recorte",
      };
    }

    return {
      ok: true,
      features: fc.features as Feature[],
      baseUrl: base,
      typeName: base.split("/").slice(-2).join("/"),
    };
  } catch (error) {
    return {
      ok: false,
      features: [],
      error: error instanceof Error ? error.message : "falha de rede ArcGIS",
    };
  }
}
