import {
  buildProjectRoiSnapshot,
  type ProjectRoiSnapshot,
} from '@/lib/project-roi-aggregator';
import { resolveProjectRoiThresholds } from '@/lib/project-roi-thresholds';
import type { ProjectRoiSemaforoThresholds } from '@/lib/project-roi-thresholds';
import type {
  Expense,
  Invoice,
  ProjectRoiCase,
  Revenue,
} from '@/lib/types';

export type ProjectRoiAlertItem = {
  caseId: string;
  title: string;
  semaforo: ProjectRoiSnapshot['semaforo'];
  resultado: number;
  margemPct: number | null;
  recebido: number;
};

export function roiCaseDisplayTitle(c: ProjectRoiCase): string {
  return (
    c.apelido ||
    c.empreendimentoTexto ||
    c.sourceProposalNumber ||
    c.id.slice(0, 8)
  );
}

export function listProjectRoiAlerts(
  cases: ProjectRoiCase[],
  revenues: Revenue[],
  expenses: Expense[],
  invoices: Invoice[],
  thresholds?: Partial<ProjectRoiSemaforoThresholds> | null,
): ProjectRoiAlertItem[] {
  const t = resolveProjectRoiThresholds(thresholds);
  const active = cases.filter(
    (c) =>
      c.statusGovernanca === 'ativo' ||
      c.statusGovernanca === 'informal',
  );

  const alerts: ProjectRoiAlertItem[] = [];

  for (const c of active) {
    const snap = buildProjectRoiSnapshot(c, revenues, expenses, invoices, {
      semaforoThresholds: t,
    });
    const isPerdendo = snap.semaforo === 'perdendo';
    const budgetStress =
      snap.orcamento > 0 &&
      snap.pctOrcamentoConsumido != null &&
      snap.pctRecebido != null &&
      snap.pctOrcamentoConsumido > t.alertOrcamentoGastoPct &&
      snap.pctRecebido < t.alertRecebidoPct;

    if (isPerdendo || budgetStress) {
      alerts.push({
        caseId: c.id,
        title: roiCaseDisplayTitle(c),
        semaforo: snap.semaforo,
        resultado: snap.resultado,
        margemPct: snap.margemPct,
        recebido: snap.recebido,
      });
    }
  }

  alerts.sort((a, b) => a.resultado - b.resultado);
  return alerts;
}
