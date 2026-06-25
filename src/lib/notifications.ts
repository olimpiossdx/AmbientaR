'use client';

import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { License, Project, WaterPermit, EnvironmentalIntervention } from '@/lib/types';
import type { UserRole } from '@/lib/types';
import {
  getRecipientUserIdsForEmpreendedor,
  getRecipientUserIdsForProject,
  getRecipientUserIdsForClient,
  getRecipientUserIdsByRecipientName,
  getRecipientUserIdsFromCondicionanteReference,
} from '@/lib/notification-recipients';

export type CreateNotificationPayload = {
  title: string;
  description: string;
  link?: string;
  sourceType?: string;
  sourceId?: string;
  /** Perfil/origem do alerta para exibição no sino (ex: Gestão Ambiental, Financeiro). */
  actorRole?: UserRole | string;
};

export type CreateNotificationOptions = {
  /** Dispara FCM via API (padrão: true). */
  push?: boolean;
};

async function triggerServerPushForUsers(
  userIds: string[],
  payload: CreateNotificationPayload,
): Promise<void> {
  if (typeof window === 'undefined' || userIds.length === 0) return;
  try {
    const auth = getAuth();
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;
    await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userIds,
        title: payload.title,
        description: payload.description,
        link: payload.link,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
      }),
    });
  } catch (e) {
    console.warn('[Notificações] push FCM:', e);
  }
}

async function createCrossUserNotificationViaApi(
  targetUserId: string,
  payload: CreateNotificationPayload & { sourceType: string; sourceId: string },
  options?: { ensureUnread?: boolean },
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const auth = getAuth();
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return false;

    const res = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetUserId,
        title: payload.title,
        description: payload.description,
        link: payload.link,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        actorRole: payload.actorRole,
        ensureUnread: options?.ensureUnread ?? false,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      console.warn('[Notificações] API cross-user:', data.error ?? res.status);
      return false;
    }

    const data = (await res.json()) as { created?: boolean };
    return data.created !== false;
  } catch (e) {
    console.warn('[Notificações] API cross-user:', e);
    return false;
  }
}

function isCrossUserNotification(targetUserId: string): boolean {
  if (typeof window === 'undefined') return false;
  const currentUid = getAuth().currentUser?.uid;
  return Boolean(currentUid && currentUid !== targetUserId);
}

/**
 * Cria uma notificação para um usuário (subcoleção users/{userId}/notifications).
 */
export async function createNotificationForUser(
  firestore: Firestore,
  userId: string,
  payload: CreateNotificationPayload,
): Promise<void> {
  if (!userId?.trim()) return;
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

/** Cria notificação e dispara push FCM (quando em browser autenticado). */
export async function createNotificationWithPush(
  firestore: Firestore,
  userId: string,
  payload: CreateNotificationPayload,
  options?: CreateNotificationOptions,
): Promise<void> {
  if (
    isCrossUserNotification(userId) &&
    payload.sourceType &&
    payload.sourceId
  ) {
    await createCrossUserNotificationViaApi(
      userId,
      payload as CreateNotificationPayload & {
        sourceType: string;
        sourceId: string;
      },
    );
    return;
  }

  await createNotificationForUser(firestore, userId, payload);
  if (options?.push !== false) {
    void triggerServerPushForUsers([userId], payload);
  }
}

/** Cria só se não existir não lida com o mesmo sourceType + sourceId. */
export async function ensureUnreadNotification(
  firestore: Firestore,
  userId: string,
  payload: CreateNotificationPayload & { sourceType: string; sourceId: string },
  options?: CreateNotificationOptions,
): Promise<boolean> {
  if (!userId?.trim()) return false;

  if (isCrossUserNotification(userId)) {
    return createCrossUserNotificationViaApi(userId, payload, {
      ensureUnread: true,
    });
  }

  const notificationsRef = collection(firestore, `users/${userId}/notifications`);
  const existing = await getDocs(
    query(
      notificationsRef,
      where('sourceType', '==', payload.sourceType),
      where('sourceId', '==', payload.sourceId),
    ),
  );
  const hasUnread = existing.docs.some((d) => d.data().isRead === false);
  if (hasUnread) return false;

  await createNotificationWithPush(firestore, userId, payload, options);
  return true;
}

/** Marca como lidas notificações por sourceType (e sourceId opcional). */
export async function markNotificationsReadBySource(
  firestore: Firestore,
  userId: string,
  sourceType: string,
  sourceId?: string,
): Promise<void> {
  if (!userId?.trim() || !sourceType?.trim()) return;

  const notificationsRef = collection(firestore, `users/${userId}/notifications`);
  const constraints = [where('sourceType', '==', sourceType)] as Parameters<
    typeof query
  >[1][];
  if (sourceId?.trim()) {
    constraints.push(where('sourceId', '==', sourceId));
  }

  const snap = await getDocs(query(notificationsRef, ...constraints));
  const unread = snap.docs.filter((d) => d.data().isRead === false);
  if (unread.length === 0) return;

  const batch = writeBatch(firestore);
  unread.forEach((d) => batch.update(d.ref, { isRead: true }));
  await batch.commit();
}

/** Vários destinatários (portal cliente / representantes / consultores). */
export async function notifyPortalUsers(
  firestore: Firestore,
  userIds: Iterable<string>,
  payload: CreateNotificationPayload,
  options?: { excludeUserId?: string; push?: boolean },
): Promise<void> {
  const unique = [...new Set(userIds)].filter(
    (id) => id?.trim() && id !== options?.excludeUserId,
  );
  await Promise.all(
    unique.map((uid) => createNotificationForUser(firestore, uid, payload)),
  );
  if (options?.push !== false) {
    void triggerServerPushForUsers(unique, payload);
  }
}

export async function notifyEmpreendedorPortalUsers(
  firestore: Firestore,
  empreendedorId: string | undefined | null,
  payload: CreateNotificationPayload,
  options?: { excludeUserId?: string },
): Promise<void> {
  const ids = await getRecipientUserIdsForEmpreendedor(firestore, empreendedorId);
  await notifyPortalUsers(firestore, ids, payload, options);
}

export async function notifyProjectPortalUsers(
  firestore: Firestore,
  projectId: string | undefined | null,
  payload: CreateNotificationPayload,
  options?: { excludeUserId?: string },
): Promise<void> {
  const ids = await getRecipientUserIdsForProject(firestore, projectId);
  await notifyPortalUsers(firestore, ids, payload, options);
}

export async function notifyClientDocPortalUsers(
  firestore: Firestore,
  clientId: string | undefined | null,
  payload: CreateNotificationPayload,
  options?: { excludeUserId?: string },
): Promise<void> {
  const ids = await getRecipientUserIdsForClient(firestore, clientId);
  await notifyPortalUsers(firestore, ids, payload, options);
}

export async function notifyOficioRecipientPortalUsers(
  firestore: Firestore,
  recipientName: string | undefined | null,
  payload: CreateNotificationPayload,
  options?: { excludeUserId?: string },
): Promise<void> {
  const ids = await getRecipientUserIdsByRecipientName(firestore, recipientName);
  await notifyPortalUsers(firestore, ids, payload, options);
}

export {
  getRecipientUserIdsForEmpreendedor,
  getRecipientUserIdsForProject,
  getRecipientUserIdsForClient,
  getRecipientUserIdsByRecipientName,
  getRecipientUserIdsFromCondicionanteReference,
};

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
