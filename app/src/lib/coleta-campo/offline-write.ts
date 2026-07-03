import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import { stripUndefinedDeep } from '@/lib/firestore-payload';
import { enqueueOutboxOperation } from '@/lib/offline/sync-engine';
import { getOfflineDb } from '@/lib/offline/db';

function newLocalId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function isOfflineNow(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

type ColetaPendingMeta = {
  id: string;
  collection: string;
  campanhaId?: string;
  updatedAt: number;
  syncStatus: 'pending' | 'synced';
};

async function markColetaPending(meta: ColetaPendingMeta): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = getOfflineDb();
    if (!db.coletaPending) return;
    await db.coletaPending.put(meta);
  } catch {
    /* tabela pode não existir em testes */
  }
}

export async function clearColetaPending(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = getOfflineDb();
    await db.coletaPending?.delete(id);
  } catch {
    /* ignore */
  }
}

/** Conta documentos de coleta com sync pendente (UI). */
export async function countColetaPending(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  try {
    const db = getOfflineDb();
    if (!db.coletaPending) return 0;
    return db.coletaPending.where('syncStatus').equals('pending').count();
  } catch {
    return 0;
  }
}

/**
 * Cria documento com ID fixo; enfileira se offline.
 */
export async function setColetaDoc(
  firestore: Firestore,
  collectionName: string,
  data: Record<string, unknown>,
  docId?: string,
): Promise<string> {
  const id = docId ?? newLocalId();
  const path = `${collectionName}/${id}`;
  const payload = stripUndefinedDeep({
    ...data,
    id,
    updatedAt: serverTimestamp(),
    sincronizado: false,
  });

  if (isOfflineNow()) {
    await enqueueOutboxOperation({
      id: `coleta-set-${path}`,
      kind: 'firestore.set',
      target: path,
      payloadJson: JSON.stringify({ ...data, id }),
    });
    await markColetaPending({
      id: path,
      collection: collectionName,
      campanhaId: typeof data.inventarioId === 'string' ? data.inventarioId : undefined,
      updatedAt: Date.now(),
      syncStatus: 'pending',
    });
    return id;
  }

  await setDoc(doc(firestore, collectionName, id), payload, { merge: true });
  return id;
}

/** addDoc com fallback offline (ID gerado no cliente). */
export async function addColetaDoc(
  firestore: Firestore,
  collectionName: string,
  data: Record<string, unknown>,
): Promise<string> {
  if (isOfflineNow()) {
    return setColetaDoc(firestore, collectionName, {
      ...data,
      createdAt: data.createdAt ?? Date.now(),
    });
  }

  const ref = await addDoc(
    collection(firestore, collectionName),
    stripUndefinedDeep({
      ...data,
      sincronizado: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  return ref.id;
}
