/** Política de tiles v3 — projetos grandes (>500 ha). */

export const MCA_TILE_THRESHOLD_HA = 500;

export type McaTileMode = "inline" | "tiled";

export function resolveTileMode(areaHa: number | undefined): McaTileMode {
  if (areaHa == null || !Number.isFinite(areaHa)) return "inline";
  return areaHa > MCA_TILE_THRESHOLD_HA ? "tiled" : "inline";
}

export function requiresTiledMode(areaHa: number | undefined): boolean {
  return resolveTileMode(areaHa) === "tiled";
}
