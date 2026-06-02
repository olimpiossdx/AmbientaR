'use client';

import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Expense, Revenue } from '@/lib/types';

import { isTransactionNeutralizedByEstorno } from '@/lib/financial-transaction-scope';

/** Estorno contábil: lançamento de sinal oposto (receita → despesa, despesa → receita). */
export async function createTransactionEstorno(
  firestore: Firestore,
  original: Revenue | Expense,
  kind: 'revenue' | 'expense',
): Promise<string> {
  const estornoKind: 'revenue' | 'expense' =
    kind === 'revenue' ? 'expense' : 'revenue';
  const collectionName =
    estornoKind === 'revenue' ? 'revenues' : 'expenses';
  const originalCollection =
    kind === 'revenue' ? 'revenues' : 'expenses';

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

  if (estornoKind === 'revenue') {
    const r = original as Revenue;
    if (r.clientId) base.clientId = r.clientId;
  } else {
    const e = original as Expense;
    if (e.category) base.category = e.category;
    if (e.supplierId) base.supplierId = e.supplierId;
    if (e.impostoValor) base.impostoValor = e.impostoValor;
  }

  const ref = await addDoc(collection(firestore, collectionName), base);
  await updateDoc(doc(firestore, originalCollection, original.id), {
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
    isTransactionNeutralizedByEstorno(item.id, revenues, expenses)
  );
}

export { isTransactionNeutralizedByEstorno };
