import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { maskCnpj, maskCpf, unmask } from "@/lib/masks";
import type { Client, Empreendedor } from "@/lib/types";

export function normalizeDocumentDigits(raw: string | undefined | null): string {
  return unmask(raw ?? "").trim();
}

/** Variantes de CPF/CNPJ para consultas `in` no Firestore (com e sem máscara). */
export function buildCpfCnpjVariants(raw: string): string[] {
  const digits = normalizeDocumentDigits(raw);
  if (!digits) return [];
  const variants = new Set<string>([raw.trim(), digits]);
  if (digits.length === 11) variants.add(maskCpf(digits));
  if (digits.length === 14) variants.add(maskCnpj(digits));
  return Array.from(variants).filter(Boolean);
}

export type ClientEmpreendedorLookupMatch = {
  client: (Partial<Client> & { id: string }) | null;
  empreendedor: (Partial<Empreendedor> & { id: string }) | null;
};

/**
 * Busca registros em `clients` e `empreendedores` pelo CPF/CNPJ (várias formatações).
 */
export async function lookupClientAndEmpreendedorByDocument(
  firestore: Firestore,
  rawDocument: string,
): Promise<ClientEmpreendedorLookupMatch> {
  const variants = buildCpfCnpjVariants(rawDocument).slice(0, 10);
  if (variants.length === 0) {
    return { client: null, empreendedor: null };
  }

  const target = normalizeDocumentDigits(rawDocument);
  const [clientsSnap, empreendedoresSnap] = await Promise.all([
    getDocs(
      query(collection(firestore, "clients"), where("cpfCnpj", "in", variants)),
    ),
    getDocs(
      query(
        collection(firestore, "empreendedores"),
        where("cpfCnpj", "in", variants),
      ),
    ),
  ]);

  const clients = clientsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Partial<Client>),
  }));
  const empreendedores = empreendedoresSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Partial<Empreendedor>),
  }));

  const byDocMatch = (item: { cpfCnpj?: string }) =>
    normalizeDocumentDigits(item.cpfCnpj) === target;

  return {
    client: clients.find(byDocMatch) ?? clients[0] ?? null,
    empreendedor: empreendedores.find(byDocMatch) ?? empreendedores[0] ?? null,
  };
}
