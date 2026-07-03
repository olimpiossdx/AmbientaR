/**
 * Critério locacional (DN 217 — pesos 0 / médio / alto): inferência conservadora
 * a partir do resultado de sobreposição geoespacial (mesmo pipeline da Análise Ambiental).
 */

export type GeospatialOverlayForLocational = {
  bioma?: string;
  sobreposicaoUC?: {
    ocorreu?: boolean;
    nomeUC?: string;
    distanciaKm?: number;
  };
  factualData?: Array<{
    camada?: string;
    resultado?: string;
  }>;
};

const keywordWeights: Array<{ pattern: RegExp; weight: number; label: string }> = [
  { pattern: /sobreposi(c|ç)(a|ã)o.*uc|dentro.*uc|uc\s+federa|uc\s+estadu/i, weight: 3, label: "UC / sobreposição" },
  { pattern: /embargo|infra(c|ç)(a|ã)o|irregular|pend(e|ê)ncia\s+ambiental/i, weight: 3, label: "Embargo ou irregularidade" },
  { pattern: /caverna|carste|karst|ramsar|area\s+umida|área\s+úmida/i, weight: 2, label: "Sensibilidade (cavernas/Ramsar)" },
  { pattern: /app|preserva(c|ç)(a|ã)o\s+permanente|margem|corpo\s+d'?água/i, weight: 1, label: "APP / hidrografia" },
  { pattern: /mata\s+atl(â|a)ntica/i, weight: 1, label: "Bioma Mata Atlântica" },
];

export function inferCriterioLocacionalFromOverlay(
  overlay: GeospatialOverlayForLocational | null | undefined,
): { criterio: "0" | "1" | "2"; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const uc = overlay?.sobreposicaoUC;
  if (uc?.ocorreu) {
    score += 4;
    reasons.push("Sobreposição ou proximidade relevante com Unidade de Conservação indicada na análise.");
  } else if (typeof uc?.distanciaKm === "number" && uc.distanciaKm < 10) {
    score += 2;
    reasons.push(`Distância reduzida até UC ou elemento sensível (~${uc.distanciaKm} km).`);
  }

  const corpus =
    (overlay?.factualData ?? [])
      .map((f) => `${f.camada ?? ""} ${f.resultado ?? ""}`)
      .join(" ") + ` ${overlay?.bioma ?? ""}`;

  for (const { pattern, weight, label } of keywordWeights) {
    if (pattern.test(corpus)) {
      score += weight;
      reasons.push(`Indício textual: ${label}.`);
    }
  }

  if (reasons.length === 0) {
    reasons.push("Sem alertas fortes nas camadas consultadas (inferência conservadora).");
  }

  let criterio: "0" | "1" | "2" = "0";
  if (score >= 4) criterio = "2";
  else if (score >= 2) criterio = "1";

  return { criterio, reasons };
}
