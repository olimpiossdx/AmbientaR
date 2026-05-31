import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { AppUser } from "@/lib/types";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";

/**
 * IDs de empreendedores acessíveis ao consultor-representante:
 * 1) `approvedConsultorIds` contém o UID do consultor;
 * 2) fallback: pedidos em `access_requests` aprovados com requestType consultor + match de `cpfCnpj`.
 */
export async function fetchEmpreendedorIdsForConsultor(
  firestore: Firestore,
  user: AppUser,
): Promise<string[]> {
  const consultorUid = resolvePortalAuthUid(user);
  if (!consultorUid) return ["invalid-placeholder"];
  const empreendedoresRef = collection(firestore, "empreendedores");

  const snapListed = await getDocs(
    query(
      empreendedoresRef,
      where("approvedConsultorIds", "array-contains", consultorUid),
    ),
  );
  const ids = new Set(snapListed.docs.map((d) => d.id));
  if (ids.size > 0) return Array.from(ids);

  const accessRequestsRef = collection(firestore, "access_requests");
  const snapReq = await getDocs(
    query(
      accessRequestsRef,
      where("status", "==", "approved"),
      where("requestedByUserId", "==", consultorUid),
    ),
  );
  const consultorRequests = snapReq.docs.filter((d) => {
    const data = d.data() as { requestType?: string };
    return data.requestType === "consultor_representante";
  });
  if (consultorRequests.length === 0) return ["invalid-placeholder"];

  const cpfs = new Set<string>();
  for (const d of consultorRequests) {
    const cpf = String(
      (d.data() as { cpfOfInterested?: string }).cpfOfInterested || "",
    ).trim();
    const digits = cpf.replace(/\D/g, "");
    if (digits.length >= 11) {
      cpfs.add(cpf);
      cpfs.add(digits);
    }
  }
  const cpfList = Array.from(cpfs).slice(0, 10);
  if (cpfList.length === 0) return ["invalid-placeholder"];

  const snapEmp = await getDocs(
    query(empreendedoresRef, where("cpfCnpj", "in", cpfList)),
  );
  const approvedOnly = snapEmp.docs.filter((docSnap) => {
    const data = docSnap.data() as { approvedConsultorIds?: string[] };
    return data.approvedConsultorIds?.includes(consultorUid);
  });
  const out = approvedOnly.map((d) => d.id);
  return out.length > 0 ? out : ["invalid-placeholder"];
}
