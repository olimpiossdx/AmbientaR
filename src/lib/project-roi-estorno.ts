'use client';

import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Expense, Revenue } from '@/lib/types';

export async function createTransactionEstorno(
  firestore: Firestore,
  original: Revenue | Expense,
  kind: 'revenue' | 'expense',
): Promise<string> {
  const collectionName = kind === 'revenue' ? 'revenues' : 'expenses';
  const base: Record<string, unknown> = {
    description: `Estorno: ${original.description}`,
    amount: original.amount,
    date: new Date().toISOString(),
    fileUrl: '',
    isEstorno: true,
    estornoDeId: original.id,
    projectRoiCaseId: original.projectRoiCaseId || '',
    contractId: (original as Revenue).contractId || (original as Expense).contractId || '',
    projectId: original.projectId || '',
    centroCusto: original.centroCusto || '',
    requestId: original.requestId || '',
  };

  if (kind === 'revenue') {
    const r = original as Revenue;
    if (r.clientId) base.clientId = r.clientId;
  } else {
    const e = original as Expense;
    if (e.category) base.category = e.category;
    if (e.supplierId) base.supplierId = e.supplierId;
    if (e.impostoValor) base.impostoValor = e.impostoValor;
  }

  const ref = await addDoc(collection(firestore, collectionName), base);
  await updateDoc(doc(firestore, collectionName, original.id), {
    estornadoPorId: ref.id,
  });
  return ref.id;
}

export function isTransactionEstornada(
  item: Revenue | Expense,
  revenues: Revenue[],
  expenses: Expense[],
): boolean {
  return (
    Boolean(item.estornadoPorId) ||
    revenues.some((r) => r.estornoDeId === item.id) ||
    expenses.some((e) => e.estornoDeId === item.id)
  );
}
