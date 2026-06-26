import { createHash } from "node:crypto";
import type { FeatureCollection } from "geojson";

export function geojsonChecksum(fc: FeatureCollection | undefined): string {
  if (!fc?.features?.length) return "";
  const payload = JSON.stringify(fc);
  return `sha256:${createHash("sha256").update(payload).digest("hex").slice(0, 16)}`;
}
