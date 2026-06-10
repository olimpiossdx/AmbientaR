import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { AppUser } from "@/lib/types";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";
import {
  buildUserProfileDocumentVariants,
  normalizeDocumentDigits,
} from "@/lib/document-lookup";
import { fetchEmpreendedorIdsForRepresentative } from "@/lib/representative-empreendedor-ids";
import { fetchEmpreendedorIdsForConsultor } from "@/lib/consultor-empreendedor-ids";

type EmpreendedorScopeRow = {
  cpfCnpj?: string;
  sourceClientId?: string;
};

/** Empreendedor pertence ao titular — não basta `userId` (evita CPF/CNPJ de terceiros). */
export function empreendedorMatchesClientGestaoScope(
  id: string,
  data: EmpreendedorScopeRow,
  scope: {
    documentDigits: Set<string>;
    linkedClientId?: string | null;
    linkedEmpreendedorId?: string | null;
  },
): boolean {
  if (scope.linkedEmpreendedorId && id === scope.linkedEmpreendedorId) {
    return true;
  }
  if (scope.linkedClientId && data.sourceClientId === scope.linkedClientId) {
    return true;
  }
  const empDigits = normalizeDocumentDigits(data.cpfCnpj ?? "");
  return empDigits.length >= 11 && scope.documentDigits.has(empDigits);
}

/** IDs de empreendedores ligados ao titular Cliente Gestão (mesma regra da lista de Licenciamento). */
export async function fetchEmpreendedorIdsForClientGestao(
  firestore: Firestore,
  user: AppUser,
): Promise<string[]> {
  const empreendedoresRef = collection(firestore, "empreendedores");
  const uid = resolvePortalAuthUid(user);
  if (!uid) return ["invalid-placeholder"];

  let linkedClientCpf: string | undefined;
  if (user.linkedClientId) {
    const clientSnap = await getDoc(
      doc(firestore, "clients", user.linkedClientId),
    );
    if (clientSnap.exists()) {
      linkedClientCpf = (clientSnap.data() as { cpfCnpj?: string }).cpfCnpj;
    }
  }

  const variantList = buildUserProfileDocumentVariants(
    user.cpf,
    user.userCpf,
    user.titularDocument,
    user.cnpjs,
    linkedClientCpf,
  );
  const documentDigits = new Set(
    variantList
      .map((v) => normalizeDocumentDigits(v))
      .filter((d) => d.length >= 11),
  );

  const scope = {
    documentDigits,
    linkedClientId: user.linkedClientId ?? null,
    linkedEmpreendedorId: user.linkedEmpreendedorId ?? null,
  };

  const ids = new Set<string>();
  const consider = (id: string, data: EmpreendedorScopeRow) => {
    if (empreendedorMatchesClientGestaoScope(id, data, scope)) {
      ids.add(id);
    }
  };

  if (user.linkedEmpreendedorId) {
    const linkedEmpSnap = await getDoc(
      doc(firestore, "empreendedores", user.linkedEmpreendedorId),
    );
    if (linkedEmpSnap.exists()) {
      consider(linkedEmpSnap.id, linkedEmpSnap.data() as EmpreendedorScopeRow);
    }
  }

  const fetchJobs: Promise<void>[] = [];

  if (user.linkedClientId) {
    fetchJobs.push(
      getDocs(
        query(
          empreendedoresRef,
          where("sourceClientId", "==", user.linkedClientId),
        ),
      ).then((snap) => {
        snap.docs.forEach((d) =>
          consider(d.id, d.data() as EmpreendedorScopeRow),
        );
      }),
    );
  }

  if (variantList.length > 0) {
    fetchJobs.push(
      getDocs(
        query(
          empreendedoresRef,
          where("cpfCnpj", "in", variantList.slice(0, 10)),
        ),
      ).then((snap) => {
        snap.docs.forEach((d) =>
          consider(d.id, d.data() as EmpreendedorScopeRow),
        );
      }),
    );
  }

  fetchJobs.push(
    getDocs(query(empreendedoresRef, where("userId", "==", uid))).then(
      (snap) => {
        snap.docs.forEach((d) =>
          consider(d.id, d.data() as EmpreendedorScopeRow),
        );
      },
    ),
  );

  await Promise.all(fetchJobs);

  return ids.size > 0 ? Array.from(ids) : ["invalid-placeholder"];
}

/** Escopo de trâmites para Cliente Gestão ou Representante (consulta). */
export async function fetchEmpreendedorIdsForProcessosPortal(
  firestore: Firestore,
  user: AppUser,
): Promise<string[]> {
  if (user.role === "client") {
    return fetchEmpreendedorIdsForClientGestao(firestore, user);
  }
  if (user.role === "representative") {
    return fetchEmpreendedorIdsForRepresentative(firestore, user);
  }
  if (user.role === "consultor_representante") {
    return fetchEmpreendedorIdsForConsultor(firestore, user);
  }
  return [];
}
