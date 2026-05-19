import { addDoc, collection, type Firestore } from 'firebase/firestore';
import type {
  Expense,
  FinancialAllocation,
  FinancialMovement,
  FinancialMovementKind,
  Invoice,
  Revenue,
} from '@/lib/types';
import { datePart } from '@/lib/financial-centers';

export type TimelineRow = {
  id: string;
  date: string;
  kind: FinancialMovementKind | 'legacy';
  direction: 'in' | 'out';
  amount: number;
  description: string;
  centerId?: string;
  sourceCollection?: string;
  sourceId?: string;
  assetSaleId?: string;
  fromMovementCollection?: boolean;
};

export async function appendFinancialMovement(
  firestore: Firestore,
  data: Omit<FinancialMovement, 'id'>,
): Promise<string> {
  const ref = await addDoc(collection(firestore, 'financial_movements'), data);
  return ref.id;
}

export function movementFromRevenue(
  revenue: Revenue,
  createdBy: string,
): Omit<FinancialMovement, 'id'> {
  return {
    date: datePart(revenue.date) || revenue.date.slice(0, 10),
    kind: 'cash_in',
    direction: 'in',
    amount: Number(revenue.amount) || 0,
    description: revenue.description || 'Receita de caixa',
    sourceCollection: 'revenues',
    sourceId: revenue.id,
    createdAt: new Date().toISOString(),
    createdBy,
  };
}

export function movementFromExpense(
  expense: Expense,
  createdBy: string,
): Omit<FinancialMovement, 'id'> {
  return {
    date: datePart(expense.date) || expense.date.slice(0, 10),
    kind: 'cash_out',
    direction: 'out',
    amount: Number(expense.amount) || 0,
    description: expense.description || 'Despesa de caixa',
    sourceCollection: 'expenses',
    sourceId: expense.id,
    createdAt: new Date().toISOString(),
    createdBy,
  };
}

export function buildCompanyTimeline(input: {
  movements: FinancialMovement[];
  revenues: Revenue[];
  expenses: Expense[];
  invoices: Invoice[];
  allocations: FinancialAllocation[];
}): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const seen = new Set<string>();

  for (const m of input.movements) {
    rows.push({
      id: m.id,
      date: datePart(m.date) || m.date,
      kind: m.kind,
      direction: m.direction,
      amount: Number(m.amount) || 0,
      description: m.description,
      centerId: m.centerId,
      sourceCollection: m.sourceCollection,
      sourceId: m.sourceId,
      assetSaleId: m.assetSaleId,
      fromMovementCollection: true,
    });
    if (m.sourceCollection && m.sourceId) {
      seen.add(`${m.sourceCollection}:${m.sourceId}:${m.kind}`);
    }
  }

  for (const r of input.revenues) {
    const key = `revenues:${r.id}:cash_in`;
    if (seen.has(key)) continue;
    rows.push({
      id: `revenue-${r.id}`,
      date: datePart(r.date) || r.date,
      kind: 'cash_in',
      direction: 'in',
      amount: Number(r.amount) || 0,
      description: r.description || 'Receita',
      sourceCollection: 'revenues',
      sourceId: r.id,
      centerId: input.allocations.find(
        (a) => a.sourceType === 'revenue' && a.sourceId === r.id,
      )?.centerId,
    });
  }

  for (const e of input.expenses) {
    const key = `expenses:${e.id}:cash_out`;
    if (seen.has(key)) continue;
    rows.push({
      id: `expense-${e.id}`,
      date: datePart(e.date) || e.date,
      kind: 'cash_out',
      direction: 'out',
      amount: Number(e.amount) || 0,
      description: e.description || 'Despesa',
      sourceCollection: 'expenses',
      sourceId: e.id,
      centerId: input.allocations.find(
        (a) => a.sourceType === 'expense' && a.sourceId === e.id,
      )?.centerId,
    });
  }

  for (const inv of input.invoices) {
    if (inv.status !== 'Paid') continue;
    const key = `invoices:${inv.id}:invoice_paid`;
    if (seen.has(key)) continue;
    rows.push({
      id: `invoice-${inv.id}`,
      date: datePart(inv.invoiceDate) || inv.invoiceDate,
      kind: 'invoice_paid',
      direction: 'in',
      amount: Number(inv.amount) || 0,
      description: `Fatura ${inv.invoiceNumber || inv.id}`,
      sourceCollection: 'invoices',
      sourceId: inv.id,
      centerId: input.allocations.find(
        (a) => a.sourceType === 'invoice' && a.sourceId === inv.id,
      )?.centerId,
    });
  }

  rows.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return rows;
}

export async function createAllocationWithMovement(
  firestore: Firestore,
  allocation: Omit<FinancialAllocation, 'id'>,
  movementDescription: string,
): Promise<{ allocationId: string; movementId: string }> {
  const allocRef = await addDoc(collection(firestore, 'financial_allocations'), allocation);
  const movementId = await appendFinancialMovement(firestore, {
    date: allocation.date,
    kind: 'allocation',
    direction: allocation.direction === 'credit' ? 'in' : 'out',
    amount: allocation.amount,
    description: movementDescription,
    centerId: allocation.centerId,
    sourceCollection:
      allocation.sourceType === 'barter_credit'
        ? 'financial_allocations'
        : allocation.sourceType === 'invoice'
          ? 'invoices'
          : allocation.sourceType === 'revenue'
            ? 'revenues'
            : 'expenses',
    sourceId: allocation.sourceId,
    createdAt: allocation.createdAt,
    createdBy: allocation.createdBy,
  });
  return { allocationId: allocRef.id, movementId };
}
