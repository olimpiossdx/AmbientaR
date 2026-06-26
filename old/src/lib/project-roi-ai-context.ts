'use client';

import { useMemo } from 'react';
import { useCollection, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Expense, Invoice, ProjectRoiCase, Revenue } from '@/lib/types';
import type { ProjectRoiCompanySettings } from '@/lib/project-roi-thresholds';
import { buildProjectRoiSnapshot } from '@/lib/project-roi-aggregator';
import { roiCaseDisplayTitle } from '@/lib/project-roi-alerts';

/** Resumo compacto dos casos ROI para contexto do Assistente Financeiro (IA). */
export function useProjectRoiAiContext(enabled: boolean): string {
  const { firestore, user } = useFirebase();

  const casesQ = useMemoFirebase(
    () => (enabled && firestore && user ? collection(firestore, 'project_roi_cases') : null),
    [enabled, firestore, user],
  );
  const revenuesQ = useMemoFirebase(
    () => (enabled && firestore && user ? collection(firestore, 'revenues') : null),
    [enabled, firestore, user],
  );
  const expensesQ = useMemoFirebase(
    () => (enabled && firestore && user ? collection(firestore, 'expenses') : null),
    [enabled, firestore, user],
  );
  const invoicesQ = useMemoFirebase(
    () => (enabled && firestore && user ? collection(firestore, 'invoices') : null),
    [enabled, firestore, user],
  );
  const settingsRef = useMemoFirebase(
    () => (enabled && firestore ? doc(firestore, 'companySettings', 'projectRoi') : null),
    [enabled, firestore],
  );

  const { data: cases } = useCollection<ProjectRoiCase>(casesQ);
  const { data: revenues } = useCollection<Revenue>(revenuesQ);
  const { data: expenses } = useCollection<Expense>(expensesQ);
  const { data: invoices } = useCollection<Invoice>(invoicesQ);
  const { data: settings } = useDoc<ProjectRoiCompanySettings>(settingsRef);

  return useMemo(() => {
    if (!enabled || !cases?.length || !revenues || !expenses || !invoices) {
      return '';
    }
    const active = cases.filter(
      (c) =>
        c.statusGovernanca === 'ativo' || c.statusGovernanca === 'informal',
    );
    if (!active.length) return '';

    const lines = active.slice(0, 20).map((c) => {
      const snap = buildProjectRoiSnapshot(c, revenues, expenses, invoices, {
        semaforoThresholds: settings?.semaforo,
      });
      const title = roiCaseDisplayTitle(c);
      return `- ${title}: recebido R$ ${snap.recebido.toFixed(2)}, pago R$ ${snap.pago.toFixed(2)}, resultado R$ ${snap.resultado.toFixed(2)}, semáforo ${snap.semaforo}, margem ${snap.margemPct != null ? snap.margemPct.toFixed(1) + '%' : 'n/d'}`;
    });

    return [
      'Dados gerenciais Projetos & ROI (visão por caso, não substitui DRE Contábil):',
      ...lines,
    ].join('\n');
  }, [enabled, cases, revenues, expenses, invoices, settings?.semaforo]);
}
