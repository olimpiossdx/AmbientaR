'use client';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Contract, ProjectRoiCase } from '@/lib/types';
import {
  caseFromContract,
  contractQualifiesForFormalCase,
} from '@/lib/project-roi-aggregator';
import { findCaseByContractId } from '@/lib/project-roi-case-queries';

export { findCaseByContractId };

export async function syncFormalCasesFromContracts(
  firestore: Firestore,
  contracts: Contract[],
  uid?: string,
): Promise<{ created: number; updated: number }> {
  const now = new Date().toISOString();
  let created = 0;
  let updated = 0;

  for (const contract of contracts) {
    if (!contractQualifiesForFormalCase(contract)) continue;

    const existing = await findCaseByContractId(firestore, contract.id);
    const payload = caseFromContract(contract, now);

    if (existing) {
      if (existing.statusGovernanca === 'encerrado') continue;
      await updateDoc(doc(firestore, 'project_roi_cases', existing.id), {
        ...payload,
        projectId: existing.projectId ?? payload.projectId,
        empreendedorId: existing.empreendedorId ?? payload.empreendedorId,
        apelido: existing.apelido || payload.apelido,
        updatedAt: now,
        updatedByUid: uid,
      });
      updated += 1;
    } else {
      await addDoc(collection(firestore, 'project_roi_cases'), {
        ...payload,
        createdByUid: uid,
        updatedByUid: uid,
      });
      created += 1;
    }
  }

  return { created, updated };
}

export type CreateManualCaseInput = {
  apelido: string;
  orcamentoValor?: number;
  projectId?: string;
  empreendedorId?: string;
  clientId?: string;
  empreendimentoTexto?: string;
  observacoes?: string;
  horasEstimadas?: number;
};

export async function createManualRoiCase(
  firestore: Firestore,
  input: CreateManualCaseInput,
  uid?: string,
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(firestore, 'project_roi_cases'), {
    origin: 'manual',
    statusGovernanca: 'informal',
    apelido: input.apelido.trim(),
    orcamentoValor: input.orcamentoValor,
    projectId: input.projectId || undefined,
    empreendedorId: input.empreendedorId || undefined,
    clientId: input.clientId || undefined,
    empreendimentoTexto: input.empreendimentoTexto?.trim() || undefined,
    observacoes: input.observacoes?.trim() || undefined,
    horasEstimadas: input.horasEstimadas,
    createdAt: now,
    updatedAt: now,
    createdByUid: uid,
    updatedByUid: uid,
  } satisfies Omit<ProjectRoiCase, 'id'>);
  return ref.id;
}

export async function encerrarRoiCase(
  firestore: Firestore,
  caseId: string,
  uid?: string,
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(firestore, 'project_roi_cases', caseId), {
    statusGovernanca: 'encerrado',
    encerradoAt: now,
    updatedAt: now,
    updatedByUid: uid,
  });
}

export async function reabrirRoiCase(
  firestore: Firestore,
  roiCase: ProjectRoiCase,
  uid?: string,
): Promise<void> {
  const now = new Date().toISOString();
  const status =
    roiCase.origin === 'manual' ? 'informal' : ('ativo' as const);
  await updateDoc(doc(firestore, 'project_roi_cases', roiCase.id), {
    statusGovernanca: status,
    encerradoAt: null,
    updatedAt: now,
    updatedByUid: uid,
  });
}

/** Promove caso manual para formal quando contrato assinado é vinculado. */
export async function linkManualCaseToContract(
  firestore: Firestore,
  caseId: string,
  contract: Contract,
  uid?: string,
): Promise<void> {
  const existing = await findCaseByContractId(firestore, contract.id);
  if (existing && existing.id !== caseId) {
    throw new Error('Já existe um caso de ROI para este contrato.');
  }
  const now = new Date().toISOString();
  const payload = caseFromContract(contract, now);
  const currentSnap = await getDoc(doc(firestore, 'project_roi_cases', caseId));
  const current = currentSnap.exists()
    ? ({ id: caseId, ...currentSnap.data() } as ProjectRoiCase)
    : undefined;

  await updateDoc(doc(firestore, 'project_roi_cases', caseId), {
    ...payload,
    origin: 'formal',
    statusGovernanca: 'ativo',
    apelido: current?.apelido || payload.apelido,
    projectId: current?.projectId ?? payload.projectId,
    empreendedorId: current?.empreendedorId ?? payload.empreendedorId,
    observacoes: current?.observacoes,
    horasEstimadas: current?.horasEstimadas,
    aliquotaImpostoPct: current?.aliquotaImpostoPct,
    impostoEstimadoValor: current?.impostoEstimadoValor,
    parcelasPrevistas: current?.parcelasPrevistas,
    updatedAt: now,
    updatedByUid: uid,
  });
}
