'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { AppUser, Contract } from '@/lib/types';
import { contractPendingSignature } from '@/lib/project-roi-aggregator';
import { notifyPortalUsers } from '@/lib/notifications';

const REMINDER_COLLECTION = 'project_roi_governance_reminders';
const REMINDER_DAYS = 7;

function daysSince(isoDate: string): number {
  const part = isoDate.slice(0, 10);
  const t = new Date(part).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 86400000);
}

export function listContractsPendingSignature(
  contracts: Contract[],
): Contract[] {
  return contracts.filter(contractPendingSignature);
}

async function getFinancialTeamAuthUids(
  firestore: Firestore,
): Promise<string[]> {
  const snap = await getDocs(collection(firestore, 'users'));
  const uids: string[] = [];
  snap.forEach((d) => {
    const u = d.data() as AppUser;
    if (
      (u.role === 'admin' || u.role === 'financial') &&
      u.status !== 'inactive' &&
      u.uid?.trim()
    ) {
      uids.push(u.uid.trim());
    }
  });
  return [...new Set(uids)];
}

/**
 * Fase 2 (Q8-B): após REMINDER_DAYS dias, notifica admin/financeiro (uma vez por contrato).
 */
export async function runContractSignatureReminders(
  firestore: Firestore,
  contracts: Contract[],
): Promise<number> {
  const pending = listContractsPendingSignature(contracts);
  if (pending.length === 0) return 0;

  const teamUids = await getFinancialTeamAuthUids(firestore);
  if (teamUids.length === 0) return 0;

  let sent = 0;
  for (const contract of pending) {
    const refDate = contract.dataContrato || '';
    if (!refDate || daysSince(refDate) < REMINDER_DAYS) continue;

    const reminderRef = doc(firestore, REMINDER_COLLECTION, contract.id);
    const existing = await getDoc(reminderRef);
    if (existing.exists()) continue;

    const label =
      contract.sourceProposalNumber ||
      contract.contratante?.nome ||
      contract.id;

    await notifyPortalUsers(firestore, teamUids, {
      title: 'Contrato aguardando assinatura',
      description: `O contrato ${label} está aprovado há mais de ${REMINDER_DAYS} dias sem PDF assinado. Envie o documento em Contratos.`,
      link: '/contracts',
      sourceType: 'project_roi_governance',
      sourceId: contract.id,
      actorRole: 'financial',
    });

    await setDoc(reminderRef, {
      contractId: contract.id,
      remindedAt: new Date().toISOString(),
    });
    sent += 1;
  }

  return sent;
}

export async function findActiveCaseForContract(
  firestore: Firestore,
  contractId: string,
): Promise<string | null> {
  const snap = await getDocs(
    query(
      collection(firestore, 'project_roi_cases'),
      where('contractId', '==', contractId),
    ),
  );
  const active = snap.docs.find((d) => d.data().statusGovernanca === 'ativo');
  return active?.id ?? null;
}
