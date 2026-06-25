import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { AccessRequestType } from "@/lib/types";
import { normalizeDocumentDigits } from "@/lib/document-lookup";
import { getAccessRequestType } from "@/lib/consultor-assignments";
import {
  createConsultorAssignment,
  fetchActiveAssignmentsForConsultor,
} from "@/lib/consultor-assignments";

/** Evita criar assignment duplicado consultor ↔ titular. */
export async function ensureConsultorAssignmentOnce(
  firestore: Firestore,
  data: {
    consultorUid: string;
    titularUid: string;
    clientId?: string;
    empreendedorIds?: string[];
    assignedByUid: string;
  },
): Promise<void> {
  const active = await fetchActiveAssignmentsForConsultor(
    firestore,
    data.consultorUid,
  );
  const already = active.some((a) => a.titularUid === data.titularUid);
  if (already) return;

  await createConsultorAssignment(firestore, {
    consultorUid: data.consultorUid,
    titularUid: data.titularUid,
    clientId: data.clientId,
    empreendedorIds: data.empreendedorIds ?? [],
    assignedByUid: data.assignedByUid,
  });
}

/** Titular aprovou access_request → fecha convites pendentes equivalentes. */
export async function syncDelegateInvitesAfterAccessApproved(
  firestore: Firestore,
  params: {
    titularUid: string;
    professionalUid: string;
    titularDocument: string;
    role: AccessRequestType;
    resolvedByName?: string;
  },
): Promise<void> {
  const docDigits = normalizeDocumentDigits(params.titularDocument);
  if (docDigits.length < 11) return;

  const snap = await getDocs(
    query(
      collection(firestore, "delegate_invites"),
      where("createdByUserId", "==", params.titularUid),
    ),
  );

  const now = new Date().toISOString();
  for (const inviteDoc of snap.docs) {
    const data = inviteDoc.data() as {
      status?: string;
      titularDocument?: string;
      targetUserId?: string;
      role?: string;
    };
    if (data.status === "accepted" || data.status === "expired") continue;
    if (normalizeDocumentDigits(data.titularDocument ?? "") !== docDigits) {
      continue;
    }
    if (data.targetUserId && data.targetUserId !== params.professionalUid) {
      continue;
    }
    if (data.role && data.role !== params.role) continue;

    await updateDoc(doc(firestore, "delegate_invites", inviteDoc.id), {
      status: "accepted",
      acceptedAt: now,
      acceptedByUserId: params.professionalUid,
      targetUserId: params.professionalUid,
      ...(params.resolvedByName
        ? { targetUserName: params.resolvedByName }
        : {}),
    });
  }
}

/** Consultor aceitou convite → aprova pedidos access_requests equivalentes. */
export async function syncAccessRequestsAfterInviteAccepted(
  firestore: Firestore,
  params: {
    titularUid: string;
    professionalUid: string;
    titularDocument: string;
    role: AccessRequestType;
    professionalName?: string;
  },
): Promise<void> {
  const docDigits = normalizeDocumentDigits(params.titularDocument);
  if (docDigits.length < 11) return;

  const snap = await getDocs(
    query(
      collection(firestore, "access_requests"),
      where("requestedByUserId", "==", params.professionalUid),
      where("status", "==", "pending"),
    ),
  );

  const now = new Date().toISOString();
  for (const reqDoc of snap.docs) {
    const data = reqDoc.data() as {
      cpfOfInterested?: string;
      requestType?: string;
    };
    if (normalizeDocumentDigits(data.cpfOfInterested ?? "") !== docDigits) {
      continue;
    }
    if (getAccessRequestType(data) !== params.role) continue;

    await updateDoc(doc(firestore, "access_requests", reqDoc.id), {
      status: "approved",
      resolvedAt: now,
      resolvedByUserId: params.titularUid,
    });
  }
}

/** Só vincula userId ao cliente/empreendedor se estiver vazio ou já for do titular. */
export function canClaimEntityUserId(
  existingUserId: string | undefined | null,
  titularUid: string,
): boolean {
  const existing = existingUserId?.trim() ?? "";
  if (!existing) return true;
  return existing === titularUid;
}
