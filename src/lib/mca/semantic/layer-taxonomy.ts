import type { McaSemanticLayer } from "../types-v2";

const TAXONOMY: Record<string, McaSemanticLayer["taxonomy"]> = {
  BASE_: "base",
  FUND_: "fund",
  HYD_: "hydro",
  USO_: "uso",
  AMB_: "ambiental",
  INFRA_: "infra",
  CTX_: "ctx",
};

const LEGAL: Partial<Record<string, string>> = {
  AMB_APP: "Lei 12.651/2012 — APP",
  AMB_RL_GLEBA: "Lei 12.651/2012 — Reserva Legal",
  AMB_DAIA: "DAIA corretiva",
};

export function taxonomyForLayerKey(layerKey: string): McaSemanticLayer["taxonomy"] {
  const prefix = Object.keys(TAXONOMY).find((p) => layerKey.startsWith(p));
  return prefix ? TAXONOMY[prefix] : "base";
}

export function buildSemanticLayer(
  layerKey: string,
  opts: { origin: string; derivedFrom?: string[]; sourceAgentId?: string },
): McaSemanticLayer {
  return {
    semanticId: layerKey,
    spatialRef: layerKey,
    class: layerKey.replace(/_/g, " "),
    taxonomy: taxonomyForLayerKey(layerKey),
    legalBasis: LEGAL[layerKey],
    origin: opts.origin,
    derivedFrom: opts.derivedFrom,
    reviewStatus: "draft",
  };
}

export function legendGroupForTaxonomy(t: McaSemanticLayer["taxonomy"]): string {
  const map: Record<McaSemanticLayer["taxonomy"], string> = {
    uso: "Uso e ocupação",
    ambiental: "APP e reservas legais",
    hydro: "Hidrografia",
    fund: "Fundiário",
    infra: "Infraestrutura",
    ctx: "Contexto",
    base: "Base",
  };
  return map[t];
}
