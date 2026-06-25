/**
 * Resumo de pagamentos a prestadores/fornecedores por caso de ROI.
 */

import type { Expense, ExpenseCategory, ProjectRoiCase, Revenue, SupplierContract } from '@/lib/types';
import {
  transactionLinksToCase,
} from '@/lib/project-roi-aggregator';
import { isTransactionNeutralizedByEstorno } from '@/lib/financial-transaction-scope';

export const SUPPLIER_NONE_KEY = '__sem_fornecedor__';

export type SupplierPaymentLine = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: ExpenseCategory;
};

export type SupplierPaymentGroup = {
  supplierId: string;
  supplierName: string;
  paymentCount: number;
  totalPaid: number;
  pctOfCasePaid: number;
  lastPaymentDate: string | null;
  contractedValue: number | null;
  payments: SupplierPaymentLine[];
};

export type SupplierPaymentSummary = {
  totalPaid: number;
  groups: SupplierPaymentGroup[];
};

function amountOf(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function linkedExpensesForCase(
  expenses: Expense[],
  roiCase: ProjectRoiCase,
  revenues: Revenue[],
): Expense[] {
  return expenses.filter(
    (e) =>
      transactionLinksToCase(e, roiCase) &&
      !e.isEstorno &&
      !isTransactionNeutralizedByEstorno(e.id, revenues, expenses),
  );
}

export function buildSupplierPaymentSummary(
  expenses: Expense[],
  roiCase: ProjectRoiCase,
  supplierNameById: Map<string, string>,
  revenues: Revenue[],
  supplierContracts?: SupplierContract[],
): SupplierPaymentSummary {
  const linked = linkedExpensesForCase(expenses, roiCase, revenues);
  const totalPaid = linked.reduce((a, e) => a + amountOf(e.amount), 0);

  const contractValueBySupplier = new Map<string, number>();
  const contractNameBySupplier = new Map<string, string>();
  if (supplierContracts) {
    for (const sc of supplierContracts) {
      const sid = sc.prestador?.supplierId;
      if (!sid) continue;
      const linkedToCase =
        sc.projectRoiCaseId === roiCase.id ||
        (roiCase.contractId && sc.clientContractId === roiCase.contractId);
      if (!linkedToCase) continue;
      contractValueBySupplier.set(
        sid,
        (contractValueBySupplier.get(sid) ?? 0) + amountOf(sc.pagamento?.valorTotal),
      );
      if (sc.prestador.nome) {
        contractNameBySupplier.set(sid, sc.prestador.nome);
      }
    }
  }

  const bySupplier = new Map<string, SupplierPaymentLine[]>();
  for (const e of linked) {
    const key = e.supplierId?.trim() || SUPPLIER_NONE_KEY;
    const list = bySupplier.get(key) ?? [];
    list.push({
      id: e.id,
      date: e.date.slice(0, 10),
      description: e.description,
      amount: amountOf(e.amount),
      category: e.category,
    });
    bySupplier.set(key, list);
  }

  const groups: SupplierPaymentGroup[] = [...bySupplier.entries()]
    .map(([supplierId, payments]) => {
      const sorted = [...payments].sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
      );
      const groupTotal = sorted.reduce((a, p) => a + p.amount, 0);
      const name =
        supplierId === SUPPLIER_NONE_KEY
          ? 'Sem fornecedor vinculado'
          : supplierNameById.get(supplierId) ||
            contractNameBySupplier.get(supplierId) ||
            supplierId;
      return {
        supplierId,
        supplierName: name,
        paymentCount: sorted.length,
        totalPaid: groupTotal,
        pctOfCasePaid: totalPaid > 0 ? (groupTotal / totalPaid) * 100 : 0,
        lastPaymentDate:
          sorted.length > 0 ? sorted[sorted.length - 1]!.date : null,
        contractedValue:
          supplierId !== SUPPLIER_NONE_KEY
            ? contractValueBySupplier.get(supplierId) ?? null
            : null,
        payments: sorted,
      };
    })
    .sort((a, b) => b.totalPaid - a.totalPaid);

  return { totalPaid, groups };
}
