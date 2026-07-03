import type { Feature, FeatureCollection, Polygon, Position } from "geojson";

const INCRA_TIMEOUT_MS = 90_000;

function buildGml2GetFeatureUrl(params: {
  baseUrl: string;
  typeName: string;
  bbox: [number, number, number, number];
  maxFeatures: number;
}): string {
  const [minX, minY, maxX, maxY] = params.bbox;
  const url = new URL(params.baseUrl);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.1.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typeName", params.typeName);
  url.searchParams.set("outputFormat", "GML2");
  url.searchParams.set("srsName", "EPSG:4326");
  url.searchParams.set("bbox", `${minX},${minY},${maxX},${maxY},EPSG:4326`);
  url.searchParams.set("maxFeatures", String(params.maxFeatures));
  return url.toString();
}

function parsePosList(text: string): Position[] {
  const nums = text
    .trim()
    .split(/[\s,]+/)
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n));
  const positions: Position[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    positions.push([nums[i], nums[i + 1]]);
  }
  return positions;
}

function closeRing(ring: Position[]): Position[] {
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function extractGmlPolygons(xml: string): Polygon[] {
  const polygons: Polygon[] = [];
  const posListRe = /<gml:posList[^>]*>([\s\S]*?)<\/gml:posList>/gi;
  let match: RegExpExecArray | null;
  while ((match = posListRe.exec(xml)) !== null) {
    const ring = closeRing(parsePosList(match[1]));
    if (ring.length >= 4) {
      polygons.push({ type: "Polygon", coordinates: [ring] });
    }
  }

  const coordRe = /<gml:coordinates[^>]*>([\s\S]*?)<\/gml:coordinates>/gi;
  while ((match = coordRe.exec(xml)) !== null) {
    const pairs = match[1].trim().split(/\s+/);
    const ring: Position[] = [];
    for (const pair of pairs) {
      const [x, y] = pair.split(",").map(Number);
      if (Number.isFinite(x) && Number.isFinite(y)) ring.push([x, y]);
    }
    const closed = closeRing(ring);
    if (closed.length >= 4) {
      polygons.push({ type: "Polygon", coordinates: [closed] });
    }
  }

  return polygons;
}

function gmlToFeatureCollection(xml: string): FeatureCollection | null {
  if (!xml.includes("gml:") && !xml.includes("featureMember")) return null;
  const polygons = extractGmlPolygons(xml);
  if (!polygons.length) return null;
  return {
    type: "FeatureCollection",
    features: polygons.map((geometry, i) => ({
      type: "Feature",
      properties: { gmlIndex: i },
      geometry,
    })),
  };
}

export type IncraWfsFetchResult = {
  ok: boolean;
  features: Feature[];
  typeName?: string;
  error?: string;
  noFeaturesInExtent?: boolean;
};

export async function fetchIncraGmlFeaturesInBbox(params: {
  baseUrl: string;
  typeNames: string[];
  bbox: [number, number, number, number];
  maxFeatures?: number;
}): Promise<IncraWfsFetchResult> {
  const maxFeatures = params.maxFeatures ?? 80;
  let lastError = "sem feições no recorte";

  for (const typeName of params.typeNames) {
    const url = buildGml2GetFeatureUrl({
      baseUrl: params.baseUrl,
      typeName,
      bbox: params.bbox,
      maxFeatures,
    });

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), INCRA_TIMEOUT_MS);
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "application/gml+xml, text/xml, */*",
          "User-Agent": "AmbientaR/1.0 (consultoria ambiental MG; INCRA GML)",
        },
      });
      clearTimeout(timer);

      if (!response.ok) {
        lastError = `HTTP ${response.status} (${typeName})`;
        continue;
      }

      const text = await response.text();
      if (text.includes("ExceptionReport")) {
        lastError = `erro OGC (${typeName})`;
        continue;
      }

      const fc = gmlToFeatureCollection(text);
      if (!fc?.features.length) {
        lastError = `${typeName}: sem feições no recorte`;
        continue;
      }

      return { ok: true, features: fc.features, typeName };
    } catch (e) {
      lastError =
        e instanceof Error ? e.message : "falha de rede INCRA";
    }
  }

  return {
    ok: false,
    features: [],
    error: lastError,
    noFeaturesInExtent: /sem fei/i.test(lastError),
  };
}
