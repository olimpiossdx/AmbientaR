import type { Firestore } from "firebase-admin/firestore";
import { maskCnpj, maskCpf } from "@/lib/masks";
import type { Client, Empreendedor } from "@/lib/types";

export function normalizeDocumentDigits(raw: string | undefined | null): string {
  return (raw ?? "").replace(/\D/g, "").trim();
}

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

export async function lookupClientAndEmpreendedorByDocumentAdmin(
  db: Firestore,
  rawDocument: string,
): Promise<ClientEmpreendedorLookupMatch> {
  const variants = buildCpfCnpjVariants(rawDocument).slice(0, 10);
  if (variants.length === 0) {
    return { client: null, empreendedor: null };
  }

  const target = normalizeDocumentDigits(rawDocument);

  const [clientsSnap, empreendedoresSnap] = await Promise.all([
    db.collection("clients").where("cpfCnpj", "in", variants).limit(5).get(),
    db
      .collection("empreendedores")
      .where("cpfCnpj", "in", variants)
      .limit(5)
      .get(),
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
