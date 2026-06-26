/** Perfis visuais Pimenta por prefixo de layer (v2). */

const STYLE_BY_PREFIX: Record<string, string> = {
  USO_: "pimenta_uso",
  HYD_: "pimenta_hydro",
  AMB_: "pimenta_ambiental",
  INFRA_: "pimenta_infra",
  FUND_: "pimenta_fund",
  BASE_: "pimenta_perimeter",
  CTX_: "pimenta_context",
};

const Z_ORDER = ["BASE_", "FUND_", "USO_", "HYD_", "AMB_", "INFRA_", "CTX_"];

export function styleProfileFor(layerKey: string): string {
  const hit = Object.keys(STYLE_BY_PREFIX).find((p) => layerKey.startsWith(p));
  return hit ? STYLE_BY_PREFIX[hit] : "pimenta_default";
}

export function zIndexFor(layerKey: string): number {
  const i = Z_ORDER.findIndex((p) => layerKey.startsWith(p));
  return i >= 0 ? i * 10 : 99;
}

export const DRAW_ORDER = ["USO_", "HYD_", "AMB_", "INFRA_", "CTX_", "FUND_", "BASE_"];

export function sortLayerKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const ia = DRAW_ORDER.findIndex((p) => a.startsWith(p));
    const ib = DRAW_ORDER.findIndex((p) => b.startsWith(p));
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
}
