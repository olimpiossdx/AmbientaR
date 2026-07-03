import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { ProjectRoiTimeEntry } from '@/lib/types';

export async function listTimeEntries(
  firestore: Firestore,
  caseId: string,
): Promise<ProjectRoiTimeEntry[]> {
  const snap = await getDocs(
    collection(firestore, 'project_roi_cases', caseId, 'time_entries'),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ProjectRoiTimeEntry, 'id'>) }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export async function syncHorasRegistradasCache(
  firestore: Firestore,
  caseId: string,
  uid?: string,
): Promise<number> {
  const entries = await listTimeEntries(firestore, caseId);
  const total = entries.reduce((a, e) => a + (Number(e.hours) || 0), 0);
  await updateDoc(doc(firestore, 'project_roi_cases', caseId), {
    horasRegistradas: total > 0 ? total : null,
    updatedAt: new Date().toISOString(),
    updatedByUid: uid,
  });
  return total;
}

export async function addTimeEntry(
  firestore: Firestore,
  caseId: string,
  entry: Omit<ProjectRoiTimeEntry, 'id' | 'createdAt'>,
  uid?: string,
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(
    collection(firestore, 'project_roi_cases', caseId, 'time_entries'),
    { ...entry, createdAt: now },
  );
  await syncHorasRegistradasCache(firestore, caseId, uid);
  return ref.id;
}

export async function deleteTimeEntry(
  firestore: Firestore,
  caseId: string,
  entryId: string,
  uid?: string,
): Promise<void> {
  await deleteDoc(
    doc(firestore, 'project_roi_cases', caseId, 'time_entries', entryId),
  );
  await syncHorasRegistradasCache(firestore, caseId, uid);
}
