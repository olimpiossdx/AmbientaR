import type { FadChangeAnalysisType } from "./types";

export const FAD_ANALYSIS_DISCLAIMER =
  "Análise auxiliar baseada em imagens de satélite. Não substitui vistoria em campo, " +
  "parecer técnico habilitado nem classificação oficial (PRODES, MapBiomas, SICAR, IDE-Sisema).";

export const CHANGE_TYPE_LABELS: Record<FadChangeAnalysisType, string> = {
  vegetation_loss: "Possível perda de vegetação",
  vegetation_gain: "Possível ganho de vegetação",
  bare_soil_exposure: "Possível solo exposto",
};

export const CHANGE_TYPE_COLORS: Record<FadChangeAnalysisType, string> = {
  vegetation_loss: "#dc2626",
  vegetation_gain: "#16a34a",
  bare_soil_exposure: "#ca8a04",
};
