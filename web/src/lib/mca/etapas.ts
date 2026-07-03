import type { McaEtapaStatus } from "./types";

export const MCA_ETAPA_COUNT = 15;

export const MCA_ETAPA_LABELS: Record<number, string> = {
  1: "Especificação",
  2: "Infraestrutura",
  3: "Registry + DAG",
  4: "UI e projetos",
  5: "Perímetro + CRS",
  6: "DWG / CAD",
  7: "Fundiário",
  8: "Hidro + satélite",
  9: "Uso e ocupação",
  10: "APP + RL",
  11: "Infraestrutura mapa",
  12: "Layout cartográfico",
  13: "PDF técnico",
  14: "IA / segmentação",
  15: "CAD + release",
};

export function defaultEtapaStatus(currentEtapa: number): Record<string, McaEtapaStatus> {
  const out: Record<string, McaEtapaStatus> = {};
  for (let i = 1; i <= MCA_ETAPA_COUNT; i++) {
    const key = String(i).padStart(2, "0");
    if (i < currentEtapa) out[key] = "pass";
    else if (i === currentEtapa) out[key] = "active";
    else out[key] = "locked";
  }
  return out;
}

export function canRunEtapa(etapaStatus: Record<string, McaEtapaStatus>, etapa: number): boolean {
  if (etapa <= 1) return true;
  const prev = String(etapa - 1).padStart(2, "0");
  return etapaStatus[prev] === "pass" || etapaStatus[prev] === "active";
}
