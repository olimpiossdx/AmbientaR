/**
 * Escopo de lançamentos: caixa operacional da empresa vs Projetos & ROI (gerencial).
 * Fase isolada: tudo com projectRoiCaseId fica fora do caixa/DRE global até integração explícita.
 */

import type { Expense, Revenue } from '@/lib/types';

function amountOf(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Lançamento criado/vinculado a um caso Projetos & ROI — não entra no caixa da empresa. */
export function isProjectRoiOnlyTransaction(item: {
  projectRoiCaseId?: string;
}): boolean {
  return Boolean(item.projectRoiCaseId?.trim());
}

export function isTransactionNeutralizedByEstorno(
  docId: string,
  revenues: Revenue[],
  expenses: Expense[],
): boolean {
  return (
    revenues.some((r) => r.estornoDeId === docId) ||
    expenses.some((e) => e.estornoDeId === docId)
  );
}

/** Receitas que entram no caixa / DRE / painel financeiro global. */
export function filterCompanyCaixaRevenues(revenues: Revenue[]): Revenue[] {
  return revenues.filter((r) => !isProjectRoiOnlyTransaction(r));
}

/** Despesas que entram no caixa / DRE / painel financeiro global. */
export function filterCompanyCaixaExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((e) => !isProjectRoiOnlyTransaction(e));
}

/**
 * Valor líquido da receita no caixa da empresa (estorno legado mesmo tipo = negativo;
 * original estornado = 0; ROI = 0).
 */
export function revenueAmountForCompanyCaixa(
  item: Revenue,
  revenues: Revenue[],
  expenses: Expense[],
): number {
  if (isProjectRoiOnlyTransaction(item)) return 0;
  if (isTransactionNeutralizedByEstorno(item.id, revenues, expenses)) return 0;
  const amt = amountOf(item.amount);
  if (item.isEstorno) return -amt;
  return amt;
}

/** Valor líquido da despesa no caixa da empresa. */
export function expenseAmountForCompanyCaixa(
  item: Expense,
  revenues: Revenue[],
  expenses: Expense[],
): number {
  if (isProjectRoiOnlyTransaction(item)) return 0;
  if (isTransactionNeutralizedByEstorno(item.id, revenues, expenses)) return 0;
  const amt = amountOf(item.amount);
  if (item.isEstorno) return -amt;
  return amt;
}

export function sumCompanyCaixaRevenues(
  revenues: Revenue[],
  expenses: Expense[],
): number {
  return revenues.reduce(
    (acc, r) => acc + revenueAmountForCompanyCaixa(r, revenues, expenses),
    0,
  );
}

export function sumCompanyCaixaExpenses(
  revenues: Revenue[],
  expenses: Expense[],
): number {
  return expenses.reduce(
    (acc, e) => acc + expenseAmountForCompanyCaixa(e, revenues, expenses),
    0,
  );
}
