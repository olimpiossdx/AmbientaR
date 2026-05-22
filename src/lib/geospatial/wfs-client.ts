import type { Feature, FeatureCollection } from "geojson";

const WFS_TIMEOUT_MS = 45_000;
const MAX_FEATURES = 500;

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
  url.searchParams.set("maxFeatures", String(MAX_FEATURES));
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
};

export async function fetchWfsFeaturesInBbox(params: {
  baseUrls: string[];
  typeNames: string[];
  bbox: [number, number, number, number];
}): Promise<WfsFetchResult> {
  const errors: string[] = [];

  for (const baseUrl of params.baseUrls) {
    for (const typeName of params.typeNames) {
      const url = buildGetFeatureUrl({ baseUrl, typeName, bbox: params.bbox });
      try {
        const response = await withTimeout(
          fetch(url, {
            method: "GET",
            cache: "no-store",
            headers: { Accept: "application/json" },
          }),
          WFS_TIMEOUT_MS,
        );

        if (!response.ok) {
          errors.push(`${typeName}@${baseUrl}: HTTP ${response.status}`);
          continue;
        }

        const text = await response.text();
        if (text.trim().startsWith("<") || text.includes("ExceptionReport")) {
          errors.push(`${typeName}: resposta XML/erro OGC`);
          continue;
        }

        const fc = parseFeatureCollection(text);
        if (!fc) {
          errors.push(`${typeName}: JSON inválido`);
          continue;
        }

        if (fc.features.length === 0) {
          errors.push(`${typeName}: sem feições no recorte`);
          continue;
        }

        return {
          ok: true,
          features: fc.features,
          typeName,
          baseUrl,
        };
      } catch (e) {
        errors.push(
          `${typeName}: ${e instanceof Error ? e.message : "falha de rede"}`,
        );
      }
    }
  }

  return {
    ok: false,
    features: [],
    error: errors.slice(0, 3).join("; ") || "WFS indisponível",
  };
}
