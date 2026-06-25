/**
 * Verifica exclusão de lançamentos ROI do caixa operacional.
 * Uso: npx tsx scripts/financial-transaction-scope-verify.ts
 */
import {
  expenseAmountForCompanyCaixa,
  isExcludedFromCompanyCaixa,
  revenueAmountForCompanyCaixa,
} from '../src/lib/financial-transaction-scope';
import { buildRecentCompanyCaixaTransactions } from '../src/lib/financial-dashboard-stats';
import type { Expense, Revenue } from '../src/lib/types';

function assert(name: string, ok: boolean): void {
  if (!ok) {
    console.error(`FAIL · ${name}`);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS · ${name}`);
}

const revenues: Revenue[] = [
  {
    id: 'r1',
    date: '2026-05-01',
    amount: 100_000,
    description: 'Receita caixa',
    clientId: 'c1',
  },
  {
    id: 'r-roi',
    date: '2026-05-02',
    amount: 50_000,
    description: 'Receita ROI',
    projectRoiCaseId: 'case-1',
  },
  {
    id: 'r-est',
    date: '2026-05-31',
    amount: 50_000,
    description: 'Estorno: Receita ROI',
    isEstorno: true,
    estornoDeId: 'r-roi',
  },
  {
    id: 'r-del',
    date: '2026-06-01',
    amount: 10_000,
    description: 'Excluída ROI',
    projectRoiCaseId: 'case-1',
    deletedAt: '2026-06-02T00:00:00.000Z',
  },
];

const expenses: Expense[] = [
  {
    id: 'e1',
    date: '2026-05-15',
    amount: 5_000,
    description: 'Despesa caixa',
  },
  {
    id: 'e-roi',
    date: '2026-05-20',
    amount: 2_000,
    description: 'Despesa ROI',
    projectRoiCaseId: 'case-1',
  },
];

const caseIds = new Set(['case-1']);

function main() {
  console.log('=== financial-transaction-scope verify ===\n');

  assert(
    'receita caixa entra no total',
    revenueAmountForCompanyCaixa(revenues[0], revenues, expenses) === 100_000,
  );
  assert(
    'receita ROI excluída',
    revenueAmountForCompanyCaixa(revenues[1], revenues, expenses) === 0,
  );
  assert(
    'estorno gerencial ROI excluído',
    revenueAmountForCompanyCaixa(revenues[2], revenues, expenses) === 0,
  );
  assert(
    'soft-delete excluído',
    isExcludedFromCompanyCaixa(revenues[3], revenues, expenses),
  );
  assert(
    'estorno não soma negativo',
    expenseAmountForCompanyCaixa(
      {
        id: 'e-est',
        date: '2026-05-31',
        amount: 50_000,
        description: 'Estorno',
        isEstorno: true,
        estornoDeId: 'missing',
      },
      revenues,
      expenses,
    ) === 0,
  );

  const recent = buildRecentCompanyCaixaTransactions(revenues, expenses, {
    limit: 10,
    existingRoiCaseIds: caseIds,
  });
  assert(
    'transações recentes excluem ROI',
    recent.every((t) => !t.projectRoiCaseId?.trim()),
  );
  assert(
    'transações recentes incluem só caixa operacional',
    recent.some((t) => t.id === 'r1') &&
      recent.some((t) => t.id === 'e1') &&
      !recent.some((t) => t.id === 'r-roi' || t.id === 'e-roi'),
  );
  assert(
    'transações recentes ordenadas por data (mais recente primeiro)',
    recent[0]?.id === 'e1',
  );
}

main();
