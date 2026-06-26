import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { ConsultorAssignment } from "@/lib/types";

export async function createConsultorAssignment(
  firestore: Firestore,
  data: Omit<
    ConsultorAssignment,
    "id" | "assignedAt" | "status"
  > & { status?: ConsultorAssignment["status"] },
): Promise<string> {
  const ref = await addDoc(collection(firestore, "consultor_assignments"), {
    ...data,
    status: data.status ?? "active",
    assignedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchActiveAssignmentsForConsultor(
  firestore: Firestore,
  consultorUid: string,
): Promise<ConsultorAssignment[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "consultor_assignments"),
      where("consultorUid", "==", consultorUid),
      where("status", "==", "active"),
    ),
  );
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as ConsultorAssignment,
  );
}

export async function fetchAssignmentsForTitular(
  firestore: Firestore,
  titularUid: string,
): Promise<ConsultorAssignment[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "consultor_assignments"),
      where("titularUid", "==", titularUid),
    ),
  );
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as ConsultorAssignment,
  );
}

export async function transferConsultorAssignment(
  firestore: Firestore,
  params: {
    assignmentId: string;
    fromConsultorUid: string;
    toConsultorUid: string;
    transferredByUid: string;
    handoffNotes?: string;
  },
): Promise<void> {
  const assignmentRef = doc(firestore, "consultor_assignments", params.assignmentId);
  await updateDoc(assignmentRef, {
    status: "transferred",
    transferredToUid: params.toConsultorUid,
    transferredAt: serverTimestamp(),
    handoffNotes: params.handoffNotes ?? "",
  });
}

export function getAccessRequestType(
  request: { requestType?: string } | null | undefined,
): "representative" | "consultor_representante" {
  return request?.requestType === "consultor_representante"
    ? "consultor_representante"
    : "representative";
}
