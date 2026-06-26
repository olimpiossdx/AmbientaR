import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { ProjectRoiCase } from '@/lib/types';

export async function findCaseByContractId(
  firestore: Firestore,
  contractId: string,
): Promise<ProjectRoiCase | null> {
  const snap = await getDocs(
    query(
      collection(firestore, 'project_roi_cases'),
      where('contractId', '==', contractId),
    ),
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<ProjectRoiCase, 'id'>) };
}
