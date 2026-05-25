import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { COLLECTION_INDIVIDUOS, COLLECTION_PARCELAS } from './constants';

const BATCH_LIMIT = 450;

/** Remove campanha e parcelas/árvores vinculadas. */
export async function deleteCampanha(firestore: Firestore, inventarioId: string): Promise<void> {
  const [parcelasSnap, individuosSnap] = await Promise.all([
    getDocs(
      query(collection(firestore, COLLECTION_PARCELAS), where('inventarioId', '==', inventarioId)),
    ),
    getDocs(
      query(collection(firestore, COLLECTION_INDIVIDUOS), where('inventarioId', '==', inventarioId)),
    ),
  ]);

  const refs = [
    ...individuosSnap.docs.map((d) => d.ref),
    ...parcelasSnap.docs.map((d) => d.ref),
    doc(firestore, 'inventarios', inventarioId),
  ];

  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(firestore);
    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}
