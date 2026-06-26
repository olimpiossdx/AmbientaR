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
 * IDs de empreendedores acessíveis ao representante:
 * 1) `approvedUserIds` contém o UID do utilizador;
 * 2) fallback: pedidos em `access_requests` aprovados + match de `cpfCnpj`
 *    (mesma lógica da página Empreendedores).
 */
export async function fetchEmpreendedorIdsForRepresentative(
  firestore: Firestore,
  user: AppUser,
): Promise<string[]> {
  const repUid = resolvePortalAuthUid(user);
  if (!repUid) return ["invalid-placeholder"];
  const empreendedoresRef = collection(firestore, "empreendedores");

  const snapListed = await getDocs(
    query(
      empreendedoresRef,
      where("approvedUserIds", "array-contains", repUid),
    ),
  );
  const ids = new Set(snapListed.docs.map((d) => d.id));
  if (ids.size > 0) return Array.from(ids);

  const accessRequestsRef = collection(firestore, "access_requests");
  const snapReq = await getDocs(
    query(
      accessRequestsRef,
      where("status", "==", "approved"),
      where("requestedByUserId", "==", repUid),
    ),
  );
  if (snapReq.docs.length === 0) return ["invalid-placeholder"];

  const cpfs = new Set<string>();
  for (const d of snapReq.docs) {
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
  const out = snapEmp.docs.map((d) => d.id);
  return out.length > 0 ? out : ["invalid-placeholder"];
}
