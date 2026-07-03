import type { GeoJSON } from "geojson";
import {
  collectionLabel,
  INPE_STAC_BASE,
  resolutionMForCollection,
  resolvePreferredCollections,
} from "./inpe-collections";

export type InpeStacItem = {
  id: string;
  collection: string;
  datetime: string;
  date: string;
  cloudCover: number | null;
  resolutionM: number;
  label: string;
  assets: Record<string, { href?: string; type?: string }>;
};

export type InpeDayAvailability = {
  date: string;
  quality: "good" | "fair" | "none";
  resolutionM: number;
  label: string;
  cloudCover: number | null;
  candidateCount: number;
};

type StacFeature = {
  id: string;
  collection?: string;
  properties?: Record<string, unknown>;
  assets?: Record<string, { href?: string; type?: string }>;
};

function dayFromDatetime(dt: string): string {
  return dt.slice(0, 10);
}

function cloudFromProps(props: Record<string, unknown>): number | null {
  const v =
    props["eo:cloud_cover"] ??
    props.cloud_cover ??
    props["bdc:cloud_cover"];
  return typeof v === "number" ? v : null;
}

function qualityFromCloud(cloud: number | null): "good" | "fair" | "none" {
  if (cloud == null) return "fair";
  if (cloud <= 30) return "good";
  if (cloud <= 70) return "fair";
  return "none";
}

export async function searchInpeStac(params: {
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  collections: string[];
  datetime: string;
  limit?: number;
}): Promise<InpeStacItem[]> {
  const res = await fetch(`${INPE_STAC_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      collections: params.collections,
      datetime: params.datetime,
      intersects: params.aoi,
      limit: params.limit ?? 100,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`STAC INPE ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as { features?: StacFeature[] };
  return (json.features ?? []).map((f) => {
    const collection = f.collection ?? "unknown";
    const dt = String(f.properties?.datetime ?? "");
    return {
      id: f.id,
      collection,
      datetime: dt,
      date: dayFromDatetime(dt),
      cloudCover: cloudFromProps(f.properties ?? {}),
      resolutionM: resolutionMForCollection(collection),
      label: collectionLabel(collection),
      assets: f.assets ?? {},
    };
  });
}

export async function fetchInpeAvailabilityForYear(
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  year: number,
): Promise<InpeDayAvailability[]> {
  const collections = resolvePreferredCollections(year);
  if (collections.length === 0) return [];

  const datetime = `${year}-01-01T00:00:00Z/${year}-12-31T23:59:59Z`;
  let items: InpeStacItem[] = [];
  try {
    items = await searchInpeStac({ aoi, collections, datetime, limit: 250 });
  } catch {
    return [];
  }

  const byDay = new Map<string, InpeStacItem[]>();
  for (const item of items) {
    const list = byDay.get(item.date) ?? [];
    list.push(item);
    byDay.set(item.date, list);
  }

  const days: InpeDayAvailability[] = [];
  for (const [date, candidates] of byDay.entries()) {
    const best = [...candidates].sort((a, b) => {
      const ca = a.cloudCover ?? 999;
      const cb = b.cloudCover ?? 999;
      if (ca !== cb) return ca - cb;
      return a.resolutionM - b.resolutionM;
    })[0]!;
    days.push({
      date,
      quality: qualityFromCloud(best.cloudCover),
      resolutionM: best.resolutionM,
      label: best.label,
      cloudCover: best.cloudCover,
      candidateCount: candidates.length,
    });
  }

  return days.sort((a, b) => a.date.localeCompare(b.date));
}

export function pickBestItemForDate(items: InpeStacItem[], date: string): InpeStacItem | null {
  const dayItems = items.filter((i) => i.date === date);
  if (dayItems.length === 0) return null;
  return [...dayItems].sort((a, b) => {
    const ca = a.cloudCover ?? 999;
    const cb = b.cloudCover ?? 999;
    if (ca !== cb) return ca - cb;
    return a.resolutionM - b.resolutionM;
  })[0]!;
}

export async function findBestItemForDate(
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  date: string,
): Promise<InpeStacItem | null> {
  const year = Number(date.slice(0, 4));
  const collections = resolvePreferredCollections(year);
  const datetime = `${date}T00:00:00Z/${date}T23:59:59Z`;
  const items = await searchInpeStac({ aoi, collections, datetime, limit: 50 });
  return pickBestItemForDate(items, date);
}

const PREVIEW_ASSET_KEYS = [
  "thumbnail",
  "preview",
  "visual",
  "rendered_preview",
  "tci",
  "overview",
];

export function pickPreviewAssetHref(item: InpeStacItem): string | null {
  for (const key of PREVIEW_ASSET_KEYS) {
    const href = item.assets[key]?.href;
    if (href) return href;
  }
  for (const [key, asset] of Object.entries(item.assets)) {
    if (asset.href && /\.(png|jpe?g|webp)$/i.test(asset.href)) return asset.href;
    if (key.toLowerCase().includes("thumb") && asset.href) return asset.href;
  }
  return null;
}

export function pickGeotiffAssetHref(item: InpeStacItem): string | null {
  for (const [, asset] of Object.entries(item.assets)) {
    const href = asset.href;
    if (!href) continue;
    if (/\.tif(f)?$/i.test(href) || asset.type?.includes("tiff")) return href;
  }
  return null;
}
