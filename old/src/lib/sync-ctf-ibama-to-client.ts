import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { Empreendedor } from "@/lib/types";
import { normalizeDocumentDigits } from "@/lib/document-lookup";
import type { CtfIbamaSyncFields } from "@/lib/ctf-ibama-utils";

async function resolveClientIdsForEmpreendedor(
  firestore: Firestore,
  empreendedor: Pick<Empreendedor, "id" | "cpfCnpj" | "sourceClientId">,
): Promise<string[]> {
  const ids = new Set<string>();

  if (empreendedor.sourceClientId) {
    const snap = await getDoc(
      doc(firestore, "clients", empreendedor.sourceClientId),
    );
    if (snap.exists()) ids.add(empreendedor.sourceClientId);
  }

  const ownSnap = await getDoc(doc(firestore, "clients", empreendedor.id));
  if (ownSnap.exists()) ids.add(empreendedor.id);

  const digits = normalizeDocumentDigits(empreendedor.cpfCnpj);
  if (digits) {
    const variants = [...new Set([digits, empreendedor.cpfCnpj?.trim() || ""])].filter(
      Boolean,
    );
    if (variants.length > 0) {
      const snap = await getDocs(
        query(collection(firestore, "clients"), where("cpfCnpj", "in", variants.slice(0, 10))),
      );
      snap.docs.forEach((d) => ids.add(d.id));
    }
  }

  return [...ids];
}

/** Espelha campos CTF/IBAMA do empreendedor no cadastro financeiro do cliente, quando existir. */
export async function syncCtfIbamaToLinkedClients(
  firestore: Firestore,
  empreendedor: Pick<Empreendedor, "id" | "cpfCnpj" | "sourceClientId">,
  fields: CtfIbamaSyncFields,
): Promise<void> {
  if (Object.keys(fields).length === 0) return;

  const clientIds = await resolveClientIdsForEmpreendedor(firestore, empreendedor);
  await Promise.all(
    clientIds.map((clientId) =>
      updateDoc(doc(firestore, "clients", clientId), fields).catch((err) => {
        console.warn(`[CTF/IBAMA] sync cliente ${clientId}:`, err);
      }),
    ),
  );
}
