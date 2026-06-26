'use client';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { AiaLinkedArtifacts } from '@/lib/types';

export async function syncPiaLinksToRequest(
  firestore: Firestore,
  requestId: string,
  links: Partial<Pick<AiaLinkedArtifacts, 'piaId' | 'inventoryId'>>,
): Promise<void> {
  if (!requestId?.trim()) return;
  const reqRef = doc(firestore, 'requests', requestId.trim());
  const snap = await getDoc(reqRef);
  if (!snap.exists()) return;
  const prev = (snap.data().linkedArtifacts ?? {}) as AiaLinkedArtifacts;
  await updateDoc(reqRef, {
    linkedArtifacts: {
      ...prev,
      ...(links.piaId ? { piaId: links.piaId } : {}),
      ...(links.inventoryId ? { inventoryId: links.inventoryId } : {}),
    },
  });
}
