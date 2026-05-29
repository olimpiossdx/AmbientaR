import type { Feature, FeatureCollection } from "geojson";

const WFS_TIMEOUT_MS = 45_000;
const MAX_FEATURES = 500;

const WFS_HEADERS: HeadersInit = {
  Accept: "application/json, application/geo+json;q=0.9, */*;q=0.1",
  "User-Agent": "AmbientaR/1.0 (consultoria ambiental MG; WFS cliente)",
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Tempo limite WFS excedido.")), ms);
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

function buildGetFeatureUrl(params: {
  baseUrl: string;
  typeName: string;
  bbox: [number, number, number, number];
  maxFeatures?: number;
}): string {
  const [minX, minY, maxX, maxY] = params.bbox;
  const url = new URL(params.baseUrl);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.1.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typeName", params.typeName);
  url.searchParams.set("outputFormat", "application/json");
  url.searchParams.set("srsName", "EPSG:4326");
  url.searchParams.set("bbox", `${minX},${minY},${maxX},${maxY},EPSG:4326`);
  url.searchParams.set("maxFeatures", String(params.maxFeatures ?? MAX_FEATURES));
  return url.toString();
}

function parseFeatureCollection(text: string): FeatureCollection | null {
  try {
    const json = JSON.parse(text) as FeatureCollection;
    if (json?.type === "FeatureCollection" && Array.isArray(json.features)) {
      return json;
    }
    if (
      json &&
      typeof json === "object" &&
      "type" in json &&
      (json as { type: string }).type === "Feature"
    ) {
      return {
        type: "FeatureCollection",
        features: [json as unknown as Feature],
      };
    }
  } catch {
    return null;
  }
  return null;
}

export type WfsFetchResult = {
  ok: boolean;
  features: Feature[];
  typeName?: string;
  baseUrl?: string;
  error?: string;
  /** Todas as tentativas responderam, mas sem feições no bbox (serviço OK). */
  noFeaturesInExtent?: boolean;
};

function isNoFeaturesInExtentError(msg: string): boolean {
  return msg.includes("sem feições no recorte");
}

function isRetryableNetworkError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("fetch failed") ||
    m.includes("terminated") ||
    m.includes("tempo limite") ||
    m.includes("econnreset") ||
    m.includes("socket")
  );
}

async function fetchOneTypeName(params: {
  baseUrl: string;
  typeName: string;
  bbox: [number, number, number, number];
  maxFeatures: number;
}): Promise<{ ok: true; features: Feature[] } | { ok: false; error: string }> {
  const url = buildGetFeatureUrl({
    baseUrl: params.baseUrl,
    typeName: params.typeName,
    bbox: params.bbox,
    maxFeatures: params.maxFeatures,
  });

  const maxAttempts = 3;
  let lastError = "falha de rede";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await withTimeout(
        fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: WFS_HEADERS,
        }),
        WFS_TIMEOUT_MS,
      );

      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        if (response.status >= 500 && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
          continue;
        }
        return { ok: false, error: `${params.typeName}@${params.baseUrl}: ${lastError}` };
      }

      const text = await response.text();
      if (text.trim().startsWith("<") || text.includes("ExceptionReport")) {
        return { ok: false, error: `${params.typeName}: resposta XML/erro OGC` };
      }

      const fc = parseFeatureCollection(text);
      if (!fc) {
        return { ok: false, error: `${params.typeName}: JSON inválido` };
      }

      if (fc.features.length === 0) {
        return { ok: false, error: `${params.typeName}: sem feições no recorte` };
      }

      return { ok: true, features: fc.features };
    } catch (e) {
      lastError = e instanceof Error ? e.message : "falha de rede";
      if (isRetryableNetworkError(lastError) && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      return { ok: false, error: `${params.typeName}: ${lastError}` };
    }
  }

  return { ok: false, error: `${params.typeName}: ${lastError}` };
}

export async function fetchWfsFeaturesWithCql(params: {
  baseUrl: string;
  typeName: string;
  cqlFilter: string;
  maxFeatures?: number;
  version?: "1.0.0" | "1.1.0";
}): Promise<WfsFetchResult> {
  const url = new URL(params.baseUrl);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", params.version ?? "1.0.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typeName", params.typeName);
  url.searchParams.set("outputFormat", "application/json");
  url.searchParams.set("CQL_FILTER", params.cqlFilter);
  url.searchParams.set("maxFeatures", String(params.maxFeatures ?? MAX_FEATURES));

  const maxAttempts = 3;
  let lastError = "falha de rede";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await withTimeout(
        fetch(url.toString(), {
          method: "GET",
          cache: "no-store",
          headers: WFS_HEADERS,
        }),
        WFS_TIMEOUT_MS,
      );

      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        if (response.status >= 500 && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
          continue;
        }
        return {
          ok: false,
          features: [],
          error: `${params.typeName}@${params.baseUrl}: ${lastError}`,
        };
      }

      const text = await response.text();
      if (text.trim().startsWith("<") || text.includes("ExceptionReport")) {
        return {
          ok: false,
          features: [],
          error: `${params.typeName}: resposta XML/erro OGC`,
        };
      }

      const fc = parseFeatureCollection(text);
      if (!fc) {
        return {
          ok: false,
          features: [],
          error: `${params.typeName}: JSON inválido`,
        };
      }

      if (fc.features.length === 0) {
        return {
          ok: false,
          features: [],
          noFeaturesInExtent: true,
          error: `${params.typeName}: sem feições no filtro`,
        };
      }

      return {
        ok: true,
        features: fc.features,
        typeName: params.typeName,
        baseUrl: params.baseUrl,
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : "falha de rede";
      if (isRetryableNetworkError(lastError) && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      return {
        ok: false,
        features: [],
        error: `${params.typeName}: ${lastError}`,
      };
    }
  }

  return {
    ok: false,
    features: [],
    error: `${params.typeName}: ${lastError}`,
  };
}

export async function fetchWfsFeaturesInBbox(params: {
  baseUrls: string[];
  typeNames: string[];
  bbox: [number, number, number, number];
  maxFeatures?: number;
}): Promise<WfsFetchResult> {
  const errors: string[] = [];
  const maxFeatures = params.maxFeatures ?? MAX_FEATURES;

  for (const baseUrl of params.baseUrls) {
    for (const typeName of params.typeNames) {
      const result = await fetchOneTypeName({
        baseUrl,
        typeName,
        bbox: params.bbox,
        maxFeatures,
      });
      if (result.ok) {
        return {
          ok: true,
          features: result.features,
          typeName,
          baseUrl,
        };
      }
      errors.push(result.error);
    }
  }

  const noFeaturesInExtent =
    errors.length > 0 && errors.every((e) => isNoFeaturesInExtentError(e));

  return {
    ok: false,
    features: [],
    error: errors.slice(0, 3).join("; ") || "WFS indisponível",
    noFeaturesInExtent,
  };
}
