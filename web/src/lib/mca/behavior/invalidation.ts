/**
 * Grafo de invalidação v2 (stateful orchestrator v1).
 * Quando uma layer upstream muda, downstream fica stale/invalidated.
 */
import { invalidatesFromBehaviorRegistry } from "./load-behavior-registry";

export const MCA_INVALIDATION_GRAPH: Record<string, string[]> = {
  HYD_CORREGO: ["AMB_APP_BUFFER", "AMB_APP", "AMB_RL_GLEBA"],
  HYD_VEREDA: ["AMB_APP_BUFFER", "AMB_APP"],
  HYD_RIBEIRAO: ["AMB_APP_BUFFER", "AMB_APP"],
  HYD_GROTA: ["AMB_APP_BUFFER", "AMB_APP"],
  USO_LAVOURA: ["MCA_Conflict_Merger"],
  USO_PIVO: ["MCA_Conflict_Merger"],
  FUND_LIMITE: ["FUND_MATRICULA", "FUND_CONFRONTANTE", "USO_LAVOURA", "USO_PIVO", "USO_PASTO"],
  BASE_PERIMETRO: ["FUND_LIMITE", "AMB_RL_GLEBA"],
  AMB_APP_BUFFER: ["AMB_APP"],
};

export function getInvalidatedLayerKeys(changedKeys: string[]): Set<string> {
  const out = new Set<string>();
  const queue = [...changedKeys];

  for (const key of changedKeys) {
    for (const d of invalidatesFromBehaviorRegistry(key)) {
      if (!queue.includes(d)) queue.push(d);
    }
  }

  while (queue.length) {
    const key = queue.shift()!;
    if (out.has(key)) continue;
    out.add(key);
    for (const downstream of MCA_INVALIDATION_GRAPH[key] ?? []) {
      if (!out.has(downstream)) queue.push(downstream);
    }
  }
  return out;
}

export function agentIdsForLayerKeys(
  layerKeys: string[],
  producesMap: Record<string, string>,
): string[] {
  const targets = new Set(layerKeys);
  return Object.entries(producesMap)
    .filter(([, layerKey]) => targets.has(layerKey))
    .map(([agentId]) => agentId);
}
