'use client';

import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import type { License, Project, WaterPermit, EnvironmentalIntervention } from '@/lib/types';
import type { UserRole } from '@/lib/types';

export type CreateNotificationPayload = {
  title: string;
  description: string;
  link?: string;
  sourceType?: string;
  sourceId?: string;
  /** Perfil/origem do alerta para exibição no sino (ex: Gestão Ambiental, Financeiro). */
  actorRole?: UserRole | string;
};

/**
 * Cria uma notificação para um usuário (subcoleção users/{userId}/notifications).
 * Usado para alertas de condicionantes, relatórios, vistorias, etc.
 */
export async function createNotificationForUser(
  firestore: Firestore,
  userId: string,
  payload: CreateNotificationPayload
): Promise<void> {
  const notificationsRef = collection(firestore, `users/${userId}/notifications`);
  await addDoc(notificationsRef, {
    userId,
    title: payload.title,
    description: payload.description,
    link: payload.link ?? null,
    isRead: false,
    createdAt: serverTimestamp(),
    sourceType: payload.sourceType ?? null,
    sourceId: payload.sourceId ?? null,
    actorRole: payload.actorRole ?? null,
  });
}

/**
 * Resolve o userId do cliente/empreendedor a partir da referência de uma condicionante
 * (licença -> projeto -> userId; outorga/intervenção -> empreendedor -> userId).
 */
export async function getUserIdFromCondicionanteReference(
  firestore: Firestore,
  referenceType: 'licenca' | 'outorga' | 'intervencao',
  referenceId: string
): Promise<string | null> {
  if (referenceType === 'licenca') {
    const licenseSnap = await getDoc(doc(firestore, 'licenses', referenceId));
    const license = licenseSnap.data() as License | undefined;
    if (!license?.projectId) return null;
    const projectSnap = await getDoc(doc(firestore, 'projects', license.projectId));
    const project = projectSnap.data() as Project | undefined;
    return project?.userId ?? null;
  }
  if (referenceType === 'outorga') {
    const outorgaSnap = await getDoc(doc(firestore, 'outorgas', referenceId));
    const outorga = outorgaSnap.data() as WaterPermit | undefined;
    if (!outorga?.empreendedorId) return null;
    const empSnap = await getDoc(doc(firestore, 'empreendedores', outorga.empreendedorId));
    const emp = empSnap.data() as { userId?: string } | undefined;
    return emp?.userId ?? null;
  }
  if (referenceType === 'intervencao') {
    const intervSnap = await getDoc(doc(firestore, 'intervencoes', referenceId));
    const interv = intervSnap.data() as EnvironmentalIntervention | undefined;
    if (!interv?.empreendedorId) return null;
    const empSnap = await getDoc(doc(firestore, 'empreendedores', interv.empreendedorId));
    const emp = empSnap.data() as { userId?: string } | undefined;
    return emp?.userId ?? null;
  }
  return null;
}
