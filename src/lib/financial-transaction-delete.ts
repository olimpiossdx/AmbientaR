'use client';

import { doc, updateDoc } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { logUserAction } from '@/lib/audit-log';
import type { Expense, Revenue } from '@/lib/types';

export const DELETE_JUSTIFICATION_MIN_LEN = 10;

export function validateDeleteJustification(text: string): string | null {
  const t = text.trim();
  if (t.length < DELETE_JUSTIFICATION_MIN_LEN) {
    return `Informe ao menos ${DELETE_JUSTIFICATION_MIN_LEN} caracteres na justificativa.`;
  }
  return null;
}

/** Soft-delete de lançamento (Projetos & ROI). Registo permanece no Firestore + auditLogs. */
export async function softDeleteFinancialTransaction(
  firestore: Firestore,
  auth: Auth,
  item: Revenue | Expense,
  kind: 'revenue' | 'expense',
  justification: string,
): Promise<void> {
  const validationError = validateDeleteJustification(justification);
  if (validationError) throw new Error(validationError);

  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado.');

  const collectionName = kind === 'revenue' ? 'revenues' : 'expenses';
  const now = new Date().toISOString();

  await updateDoc(doc(firestore, collectionName, item.id), {
    deletedAt: now,
    deletedByUid: uid,
    deleteJustification: justification.trim(),
  });

  await logUserAction(firestore, auth, 'financial_transaction_deleted', {
    transactionId: item.id,
    kind,
    amount: item.amount,
    description: item.description,
    projectRoiCaseId: item.projectRoiCaseId || '',
    justification: justification.trim(),
    scope: 'projetos_roi',
  });
}

/** Usado ao excluir caso ROI (sem Auth no serviço). */
export async function softDeleteFinancialTransactionById(
  firestore: Firestore,
  itemId: string,
  kind: 'revenue' | 'expense',
  justification: string,
  deletedByUid: string,
): Promise<void> {
  const collectionName = kind === 'revenue' ? 'revenues' : 'expenses';
  const now = new Date().toISOString();
  await updateDoc(doc(firestore, collectionName, itemId), {
    deletedAt: now,
    deletedByUid,
    deleteJustification: justification.trim(),
  });
}
