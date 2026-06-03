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
import { normalizeDocumentDigits } from "@/lib/document-lookup";
import { fetchEmpreendedorIdsForRepresentative } from "@/lib/representative-empreendedor-ids";
import { fetchEmpreendedorIdsForConsultor } from "@/lib/consultor-empreendedor-ids";

/** IDs de empreendedores ligados ao titular Cliente Gestão (mesma regra da lista de Licenciamento). */
export async function fetchEmpreendedorIdsForClientGestao(
  firestore: Firestore,
  user: AppUser,
): Promise<string[]> {
  const empreendedoresRef = collection(firestore, "empreendedores");
  const uid = resolvePortalAuthUid(user);
  if (!uid) return ["invalid-placeholder"];

  const ids = new Set<string>();
  const variantSet = new Set<string>();

  const addVariants = (raw: string | undefined) => {
    if (!raw?.trim()) return;
    variantSet.add(raw.trim());
    const d = normalizeDocumentDigits(raw);
    if (d.length >= 11) variantSet.add(d);
  };

  addVariants(user.cpf);
  addVariants(user.userCpf);
  (user.cnpjs || []).forEach(addVariants);

  if (user.linkedClientId) {
    const clientSnap = await getDoc(
      doc(firestore, "clients", user.linkedClientId),
    );
    if (clientSnap.exists()) {
      const data = clientSnap.data();
      addVariants(data.cpfCnpj);
      const bySource = query(
        empreendedoresRef,
        where("sourceClientId", "==", user.linkedClientId),
      );
      const sourceSnap = await getDocs(bySource);
      sourceSnap.docs.forEach((d) => ids.add(d.id));
    }
  }

  const byUserId = query(empreendedoresRef, where("userId", "==", uid));
  const variantList = Array.from(variantSet).slice(0, 10);
  const byCpf =
    variantList.length > 0
      ? query(empreendedoresRef, where("cpfCnpj", "in", variantList))
      : null;
  const [snapU, snapCpf] = await Promise.all([
    getDocs(byUserId),
    byCpf ? getDocs(byCpf) : Promise.resolve({ docs: [] as { id: string }[] }),
  ]);
  snapU.docs.forEach((d) => ids.add(d.id));
  snapCpf.docs.forEach((d) => ids.add(d.id));

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
