/**
 * Escopo de lançamentos: caixa operacional da empresa vs Projetos & ROI (gerencial).
 * Fase isolada: tudo gerencial/ROI fica fora do caixa/DRE global até integração explícita.
 */

import type { Expense, Revenue } from '@/lib/types';

function amountOf(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function isSoftDeleted(item: { deletedAt?: string }): boolean {
  return Boolean(item.deletedAt?.trim());
}

/** Lançamento criado/vinculado a um caso Projetos & ROI — não entra no caixa da empresa. */
export function isProjectRoiOnlyTransaction(item: {
  projectRoiCaseId?: string;
}): boolean {
  return Boolean(item.projectRoiCaseId?.trim());
}

function findTransactionById(
  id: string,
  revenues: Revenue[],
  expenses: Expense[],
): Revenue | Expense | undefined {
  return (
    revenues.find((r) => r.id === id) ?? expenses.find((e) => e.id === id)
  );
}

/** Estorno gerado no fluxo Projetos & ROI (ou de original ROI). */
export function isRoiGerencialEstorno(
  item: Revenue | Expense,
  revenues: Revenue[],
  expenses: Expense[],
): boolean {
  if (!item.isEstorno) return false;
  if (isProjectRoiOnlyTransaction(item)) return true;
  if (!item.estornoDeId) return false;
  const original = findTransactionById(item.estornoDeId, revenues, expenses);
  if (!original) return true;
  if (isProjectRoiOnlyTransaction(original)) return true;
  if (isSoftDeleted(original)) return true;
  return false;
}

/**
 * Lançamento que não deve entrar no caixa operacional / DRE global.
 * Não altera o submenu Caixa (/cash-flow) — só filtra agregações globais.
 */
export function isExcludedFromCompanyCaixa(
  item: Revenue | Expense,
  revenues: Revenue[],
  expenses: Expense[],
  existingRoiCaseIds?: ReadonlySet<string>,
): boolean {
  if (isSoftDeleted(item)) return true;
  if (item.isEstorno) return true;
  if (isProjectRoiOnlyTransaction(item)) {
    const caseId = item.projectRoiCaseId?.trim();
    if (caseId && existingRoiCaseIds && !existingRoiCaseIds.has(caseId)) {
      return true;
    }
    return true;
  }
  if (isRoiGerencialEstorno(item, revenues, expenses)) return true;
  return false;
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
export function filterCompanyCaixaRevenues(
  revenues: Revenue[],
  expenses: Expense[] = [],
  existingRoiCaseIds?: ReadonlySet<string>,
): Revenue[] {
  return revenues.filter(
    (r) =>
      !isExcludedFromCompanyCaixa(r, revenues, expenses, existingRoiCaseIds),
  );
}

/** Despesas que entram no caixa / DRE / painel financeiro global. */
export function filterCompanyCaixaExpenses(
  expenses: Expense[],
  revenues: Revenue[] = [],
  existingRoiCaseIds?: ReadonlySet<string>,
): Expense[] {
  return expenses.filter(
    (e) =>
      !isExcludedFromCompanyCaixa(e, revenues, expenses, existingRoiCaseIds),
  );
}

/**
 * Valor líquido da receita no caixa da empresa.
 * Estornos gerenciais ROI e soft-deleted = 0; estorno operacional legado = 0 na agregação.
 */
export function revenueAmountForCompanyCaixa(
  item: Revenue,
  revenues: Revenue[],
  expenses: Expense[],
  existingRoiCaseIds?: ReadonlySet<string>,
): number {
  if (isExcludedFromCompanyCaixa(item, revenues, expenses, existingRoiCaseIds)) {
    return 0;
  }
  if (isTransactionNeutralizedByEstorno(item.id, revenues, expenses)) return 0;
  return amountOf(item.amount);
}

/** Valor líquido da despesa no caixa da empresa. */
export function expenseAmountForCompanyCaixa(
  item: Expense,
  revenues: Revenue[],
  expenses: Expense[],
  existingRoiCaseIds?: ReadonlySet<string>,
): number {
  if (isExcludedFromCompanyCaixa(item, revenues, expenses, existingRoiCaseIds)) {
    return 0;
  }
  if (isTransactionNeutralizedByEstorno(item.id, revenues, expenses)) return 0;
  return amountOf(item.amount);
}

export function sumCompanyCaixaRevenues(
  revenues: Revenue[],
  expenses: Expense[],
  existingRoiCaseIds?: ReadonlySet<string>,
): number {
  return revenues.reduce(
    (acc, r) =>
      acc + revenueAmountForCompanyCaixa(r, revenues, expenses, existingRoiCaseIds),
    0,
  );
}

export function sumCompanyCaixaExpenses(
  expenses: Expense[],
  revenues: Revenue[] = [],
  existingRoiCaseIds?: ReadonlySet<string>,
): number {
  return expenses.reduce(
    (acc, e) =>
      acc + expenseAmountForCompanyCaixa(e, revenues, expenses, existingRoiCaseIds),
    0,
  );
}
