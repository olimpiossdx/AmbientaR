/** Limiares do semáforo gerencial — perfil da empresa (companySettings/projectRoi). */

export type ProjectRoiSemaforoThresholds = {
  margemVerdeMinPct: number;
  empateToleranceReais: number;
  empateTolerancePct: number;
  alertOrcamentoGastoPct: number;
  alertRecebidoPct: number;
};

export const DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS: ProjectRoiSemaforoThresholds =
  {
    margemVerdeMinPct: 15,
    empateToleranceReais: 50,
    empateTolerancePct: 0.01,
    alertOrcamentoGastoPct: 85,
    alertRecebidoPct: 70,
  };

export function resolveProjectRoiThresholds(
  partial?: Partial<ProjectRoiSemaforoThresholds> | null,
): ProjectRoiSemaforoThresholds {
  if (!partial) return { ...DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS };
  return {
    margemVerdeMinPct:
      partial.margemVerdeMinPct ??
      DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS.margemVerdeMinPct,
    empateToleranceReais:
      partial.empateToleranceReais ??
      DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS.empateToleranceReais,
    empateTolerancePct:
      partial.empateTolerancePct ??
      DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS.empateTolerancePct,
    alertOrcamentoGastoPct:
      partial.alertOrcamentoGastoPct ??
      DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS.alertOrcamentoGastoPct,
    alertRecebidoPct:
      partial.alertRecebidoPct ??
      DEFAULT_PROJECT_ROI_SEMAFORO_THRESHOLDS.alertRecebidoPct,
  };
}

export type ProjectRoiCompanySettings = {
  semaforo?: Partial<ProjectRoiSemaforoThresholds>;
  updatedAt?: string;
};
