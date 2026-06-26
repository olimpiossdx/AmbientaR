/** Cache espacial v3 — chaves por checksum (prepara PostGIS / skip de agentes). */

export function spatialCacheKey(opts: {
  agentId: string;
  layerKey: string;
  checksum: string;
  ruleVersion?: string;
}): string {
  const rule = opts.ruleVersion ?? "v1";
  return `${opts.agentId}:${opts.layerKey}:${opts.checksum}:${rule}`;
}

export function shouldReuseCachedLayer(
  cachedChecksum: string | undefined,
  nextChecksum: string,
): boolean {
  return Boolean(cachedChecksum && cachedChecksum === nextChecksum);
}

export function cacheHitRatio(total: number, hits: number): number {
  if (total <= 0) return 0;
  return hits / total;
}
