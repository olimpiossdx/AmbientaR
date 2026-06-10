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

/** Variantes de CPF/CNPJ (original + só dígitos) para match em `clients`, máx 10. */
export function titularClientDocumentVariants(
  cpf: string | undefined,
  cnpjs: string[] | undefined,
): string[] {
  const raw = [cpf, ...(cnpjs || [])].filter(Boolean) as string[];
  const set = new Set<string>();
  for (const v of raw) {
    set.add(v);
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 11) set.add(digits);
  }
  return Array.from(set).slice(0, 10);
}

/**
 * IDs de documentos `clients` ligados ao titular (Cliente Gestão ou Autônomo),
 * mesmo critério usado em Propostas Comerciais.
 */
export async function fetchClientIdsForTitularPortalUser(
  firestore: Firestore,
  user: AppUser,
): Promise<string[]> {
  const isSelfRegistered = !!(user as { package?: unknown }).package;
  const cRef = collection(firestore, "clients");
  const userCpf = user.cpf || user.userCpf;
  const userDocs = titularClientDocumentVariants(userCpf, user.cnpjs);

  const uid = resolvePortalAuthUid(user);
  if (user.role === "cliente_autonomo" && uid) {
    const byUserId = query(cRef, where("userId", "==", uid));
    const byOwnerUserId = query(cRef, where("ownerUserId", "==", uid));
    const [snapU, snapOwner, ownDocSnap] = await Promise.all([
      getDocs(byUserId),
      getDocs(byOwnerUserId),
      getDoc(doc(firestore, "clients", uid)),
    ]);
    const ids = new Set<string>([
      ...snapU.docs.map((d) => d.id),
      ...snapOwner.docs.map((d) => d.id),
    ]);
    if (ownDocSnap.exists()) ids.add(uid);
    return Array.from(ids);
  }
  if (isSelfRegistered && uid) {
    const q = query(cRef, where("userId", "==", uid));
    const qByDoc =
      userDocs.length > 0 ? query(cRef, where("cpfCnpj", "in", userDocs)) : null;
    const snaps = qByDoc
      ? await Promise.all([getDocs(q), getDocs(qByDoc)])
      : [await getDocs(q)];
    const ids = new Set<string>();
    snaps.forEach((snap) => snap.docs.forEach((d) => ids.add(d.id)));
    return Array.from(ids);
  }
  if (userDocs.length > 0) {
    const q = query(cRef, where("cpfCnpj", "in", userDocs));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.id);
  }
  return [];
}

/** Clientes cujo titular aprovou acesso ao representante. */
export async function fetchClientIdsForRepresentativeUser(
  firestore: Firestore,
  repUid: string,
): Promise<string[]> {
  const cRef = collection(firestore, "clients");
  const q = query(cRef, where("approvedUserIds", "array-contains", repUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}
