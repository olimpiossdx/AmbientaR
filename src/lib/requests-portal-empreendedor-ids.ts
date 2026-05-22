import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { AppUser } from "@/lib/types";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";
import { fetchEmpreendedorIdsForRepresentative } from "@/lib/representative-empreendedor-ids";

/** IDs de empreendedores ligados ao titular Cliente Gestão (mesma regra da lista de Licenciamento). */
export async function fetchEmpreendedorIdsForClientGestao(
  firestore: Firestore,
  user: AppUser,
): Promise<string[]> {
  const empreendedoresRef = collection(firestore, "empreendedores");
  const uid = resolvePortalAuthUid(user);
  if (!uid) return ["invalid-placeholder"];
  const byUserId = query(empreendedoresRef, where("userId", "==", uid));
  const variants = [user.cpf || user.userCpf, ...(user.cnpjs || [])].filter(
    Boolean,
  ) as string[];
  const normalized = new Set<string>();
  variants.forEach((v) => {
    normalized.add(v);
    const d = v.replace(/\D/g, "");
    if (d.length >= 11) normalized.add(d);
  });
  const variantList = Array.from(normalized).slice(0, 10);
  const byCpf =
    variantList.length > 0
      ? query(empreendedoresRef, where("cpfCnpj", "in", variantList))
      : null;
  const [snapU, snapCpf] = await Promise.all([
    getDocs(byUserId),
    byCpf ? getDocs(byCpf) : Promise.resolve({ docs: [] as { id: string }[] }),
  ]);
  const ids = new Set<string>([
    ...snapU.docs.map((d) => d.id),
    ...snapCpf.docs.map((d) => d.id),
  ]);
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
  return [];
}
