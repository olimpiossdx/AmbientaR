import type { Firestore } from "firebase/firestore";
import type { AppUser, UserRole } from "@/lib/types";
import {
  isClientePortalRole,
  isRepresentativeLikePortalRole,
} from "@/lib/role-guards";
import { fetchEmpreendedorIdsForClientGestao } from "@/lib/requests-portal-empreendedor-ids";
import { fetchEmpreendedorIdsForRepresentative } from "@/lib/representative-empreendedor-ids";
import { fetchEmpreendedorIdsForConsultor } from "@/lib/consultor-empreendedor-ids";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";
import { buildCpfCnpjVariants } from "@/lib/document-lookup";

/** Papéis que filtram listas por empreendedores visíveis (não veem coleção inteira). */
export function isEmpreendedorScopedPortalRole(
  role: UserRole | undefined | null,
): boolean {
  return isClientePortalRole(role) || isRepresentativeLikePortalRole(role);
}

/** Resolve IDs de empreendedores para titular, representante ou consultor-representante. */
export async function fetchEmpreendedorIdsForPortalScope(
  firestore: Firestore,
  user: AppUser,
): Promise<string[]> {
  if (user.role === "client") {
    return fetchEmpreendedorIdsForClientGestao(firestore, user);
  }
  if (isRepresentativeLikePortalRole(user.role)) {
    if (user.role === "representative") {
      return fetchEmpreendedorIdsForRepresentative(firestore, user);
    }
    return fetchEmpreendedorIdsForConsultor(firestore, user);
  }
  if (user.role === "cliente_autonomo") {
    const uid = resolvePortalAuthUid(user);
    if (!uid) return ["invalid-placeholder"];
    const empreendedoresRef = collection(firestore, "empreendedores");
    const byUserId = query(empreendedoresRef, where("userId", "==", uid));
    const byOwnerUserId = query(
      empreendedoresRef,
      where("ownerUserId", "==", uid),
    );
    const [snapU, snapOwner, ownDocSnap] = await Promise.all([
      getDocs(byUserId),
      getDocs(byOwnerUserId),
      getDoc(doc(firestore, "empreendedores", uid)),
    ]);
    const ids = new Set<string>([
      ...snapU.docs.map((d) => d.id),
      ...snapOwner.docs.map((d) => d.id),
    ]);
    if (ownDocSnap.exists()) ids.add(uid);
    return ids.size > 0 ? Array.from(ids) : ["invalid-placeholder"];
  }
  return [];
}

/** IDs de clientes visíveis para representante ou consultor-representante. */
export async function fetchClientIdsForPortalPartner(
  firestore: Firestore,
  user: AppUser,
): Promise<string[]> {
  const uid = resolvePortalAuthUid(user);
  if (!uid || !isRepresentativeLikePortalRole(user.role)) return [];

  const clientsRef = collection(firestore, "clients");
  const approvedField =
    user.role === "consultor_representante"
      ? "approvedConsultorIds"
      : "approvedUserIds";

  const snapListed = await getDocs(
    query(clientsRef, where(approvedField, "array-contains", uid)),
  );
  if (snapListed.docs.length > 0) return snapListed.docs.map((d) => d.id);

  const accessRequestsRef = collection(firestore, "access_requests");
  const snapReq = await getDocs(
    query(
      accessRequestsRef,
      where("status", "==", "approved"),
      where("requestedByUserId", "==", uid),
    ),
  );
  const relevantRequests =
    user.role === "consultor_representante"
      ? snapReq.docs.filter(
          (d) =>
            (d.data() as { requestType?: string }).requestType ===
            "consultor_representante",
        )
      : snapReq.docs;

  if (relevantRequests.length === 0) return [];

  const cpfs = new Set<string>();
  for (const d of relevantRequests) {
    const data = d.data() as {
      cpfOfInterested?: string;
      targetDocument?: string;
    };
    const cpf = String(data.targetDocument || data.cpfOfInterested || "").trim();
    const digits = cpf.replace(/\D/g, "");
    if (digits.length >= 11) {
      for (const variant of buildCpfCnpjVariants(cpf)) {
        cpfs.add(variant);
      }
    }
  }
  const cpfList = Array.from(cpfs).slice(0, 10);
  if (cpfList.length === 0) return [];

  const snapClients = await getDocs(
    query(clientsRef, where("cpfCnpj", "in", cpfList)),
  );
  if (user.role === "consultor_representante") {
    return snapClients.docs
      .filter((d) => {
        const data = d.data() as { approvedConsultorIds?: string[] };
        return data.approvedConsultorIds?.includes(uid);
      })
      .map((d) => d.id);
  }
  return snapClients.docs.map((d) => d.id);
}
