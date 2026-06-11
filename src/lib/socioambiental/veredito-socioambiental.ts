import type {
  ResultadoCriterio,
  VereditoSocioambientalGlobal,
} from "@/lib/types/analise-socioambiental";

export function computeResumoCriterios(criterios: ResultadoCriterio[]): {
  apto: number;
  alerta: number;
  inapto: number;
  naoAnalisado: number;
} {
  const resumo = { apto: 0, alerta: 0, inapto: 0, naoAnalisado: 0 };
  for (const c of criterios) {
    if (c.resultado === "Apto") resumo.apto += 1;
    else if (c.resultado === "Alerta") resumo.alerta += 1;
    else if (c.resultado === "Inapto") resumo.inapto += 1;
    else resumo.naoAnalisado += 1;
  }
  return resumo;
}

export function computeVereditoGlobal(
  criterios: ResultadoCriterio[],
): VereditoSocioambientalGlobal {
  const resumo = computeResumoCriterios(criterios);
  if (resumo.inapto > 0) return "com_restricoes";
  if (resumo.naoAnalisado > 0 && resumo.apto + resumo.alerta === 0) {
    return "analise_incompleta";
  }
  if (resumo.alerta > 0) return "em_conformidade_com_alertas";
  if (resumo.naoAnalisado > 0 && resumo.apto > 0) {
    return "em_conformidade_com_alertas";
  }
  return "em_conformidade";
}

export const VEREDITO_LABELS: Record<VereditoSocioambientalGlobal, string> = {
  em_conformidade: "Em conformidade",
  em_conformidade_com_alertas: "Em conformidade com alertas",
  com_restricoes: "Com restrições",
  analise_incompleta: "Análise incompleta",
};
