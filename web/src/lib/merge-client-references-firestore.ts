import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { CLIENT_ID_REFERENCE_QUERIES } from "@/lib/client-duplicate-merge";

const BATCH_LIMIT = 400;

async function repointQuery(
  firestore: Firestore,
  collectionName: string,
  field: string,
  fromId: string,
  toId: string,
): Promise<number> {
  const snap = await getDocs(
    query(
      collection(firestore, collectionName),
      where(field, "==", fromId),
    ),
  );
  if (snap.empty) return 0;

  let updated = 0;
  for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
    const chunk = snap.docs.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(firestore);
    for (const docSnap of chunk) {
      batch.update(docSnap.ref, { [field]: toId });
      updated += 1;
    }
    await batch.commit();
  }
  return updated;
}

async function repointLinkedClientUsers(
  firestore: Firestore,
  fromId: string,
  toId: string,
): Promise<number> {
  const snap = await getDocs(
    query(
      collection(firestore, "users"),
      where("linkedClientId", "==", fromId),
    ),
  );
  if (snap.empty) return 0;

  let updated = 0;
  for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
    const chunk = snap.docs.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(firestore);
    for (const docSnap of chunk) {
      batch.update(docSnap.ref, { linkedClientId: toId });
      updated += 1;
    }
    await batch.commit();
  }
  return updated;
}

/** Atualiza referências `clientId` (e `linkedClientId`) de um ID para outro. */
export async function repointClientIdReferences(
  firestore: Firestore,
  fromId: string,
  toId: string,
): Promise<{ documentsUpdated: number }> {
  if (fromId === toId) return { documentsUpdated: 0 };

  let documentsUpdated = 0;

  for (const { collection: collectionName, field } of CLIENT_ID_REFERENCE_QUERIES) {
    documentsUpdated += await repointQuery(
      firestore,
      collectionName,
      field,
      fromId,
      toId,
    );
  }

  documentsUpdated += await repointLinkedClientUsers(firestore, fromId, toId);

  return { documentsUpdated };
}

export async function deleteClientDocuments(
  firestore: Firestore,
  clientIds: string[],
): Promise<void> {
  for (let i = 0; i < clientIds.length; i += BATCH_LIMIT) {
    const chunk = clientIds.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(firestore);
    for (const id of chunk) {
      batch.delete(doc(firestore, "clients", id));
    }
    await batch.commit();
  }
}
