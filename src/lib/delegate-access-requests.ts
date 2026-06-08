import { addDoc, collection, type Firestore } from "firebase/firestore";
import type { AccessRequest, AccessRequestType } from "@/lib/types";
import { normalizeDocumentDigits } from "@/lib/document-lookup";
import { getAccessRequestType } from "@/lib/consultor-assignments";

export async function createAccessRequestsForDelegate(
  firestore: Firestore,
  params: {
    requesterUserId: string;
    email: string;
    name: string;
    role: AccessRequestType;
    documents: string[];
    existingDigits?: Set<string>;
  },
): Promise<number> {
  const existingSet = params.existingDigits ?? new Set<string>();
  const requestType = params.role;
  let created = 0;

  for (const cpfOuCnpj of params.documents) {
    const normalized = normalizeDocumentDigits(cpfOuCnpj);
    if (normalized.length < 11 || existingSet.has(normalized)) continue;
    existingSet.add(normalized);
    try {
      await addDoc(collection(firestore, "access_requests"), {
        requestedByUserId: params.requesterUserId,
        requestedByEmail: params.email,
        requestedByName: params.name,
        cpfOfInterested: normalized,
        targetDocument: normalized,
        requestType,
        status: "pending",
        createdAt: new Date().toISOString(),
      } as Omit<AccessRequest, "id">);
      created += 1;
    } catch (e) {
      console.warn("Erro ao criar pedido de acesso para", normalized, e);
    }
  }
  return created;
}

/** Pedidos do próprio representante ou consultor (exclui tipo de outro perfil). */
export function filterAccessRequestsForDelegate(
  requests: AccessRequest[] | null | undefined,
  role: "representative" | "consultor_representante",
): AccessRequest[] {
  if (!requests?.length) return [];
  return requests.filter((r) => getAccessRequestType(r) === role);
}

export function collectRequestedDocumentDigits(
  requests: Pick<AccessRequest, "cpfOfInterested" | "status">[],
): Set<string> {
  const set = new Set<string>();
  for (const r of requests) {
    if (r.status !== "pending" && r.status !== "approved") continue;
    const d = normalizeDocumentDigits(r.cpfOfInterested);
    if (d.length >= 11) set.add(d);
  }
  return set;
}
