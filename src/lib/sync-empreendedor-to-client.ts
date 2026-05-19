import type { Client, Empreendedor, EntityType } from "@/lib/types";
import { normalizeDocumentDigits } from "@/lib/document-lookup";

export type EmpreendedorForClientSync = Partial<Empreendedor> & { id: string };

export type ClientFirestorePayload = {
  name: string;
  cpfCnpj: string;
  entityType: EntityType;
  phone: string;
  email: string;
  dataNascimento: string;
  ctfIbama: string;
  address: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  userId: string;
  approvedUserIds: string[];
};

function resolveEntityType(
  entityType: Empreendedor["entityType"],
): EntityType {
  if (Array.isArray(entityType)) {
    if (entityType.includes("Pessoa Jurídica")) return "Pessoa Jurídica";
    if (entityType.includes("Produtor Rural")) return "Produtor Rural";
    return "Pessoa Física";
  }
  if (
    entityType === "Pessoa Jurídica" ||
    entityType === "Produtor Rural" ||
    entityType === "Pessoa Física"
  ) {
    return entityType;
  }
  return "Pessoa Física";
}

/** Monta payload de `clients` a partir de um empreendedor (alinhado ao formulário de empreendedor). */
export function buildClientPayloadFromEmpreendedor(
  emp: EmpreendedorForClientSync,
): ClientFirestorePayload {
  const cpfCnpjDigits = normalizeDocumentDigits(emp.cpfCnpj);
  let dataNascimento = "";
  if (emp.dataNascimento) {
    const raw = String(emp.dataNascimento);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      dataNascimento = new Date(`${raw}T00:00:00`).toISOString();
    } else {
      dataNascimento = raw;
    }
  }

  return {
    name: emp.name || "",
    cpfCnpj: cpfCnpjDigits,
    entityType: resolveEntityType(emp.entityType),
    phone: emp.phone || "",
    email: emp.email || "",
    dataNascimento,
    ctfIbama: emp.ctfIbama || "",
    address: emp.address || "",
    numero: emp.numero || "",
    bairro: emp.bairro || "",
    municipio: emp.municipio || "",
    uf: emp.uf || "",
    cep: emp.cep || "",
    userId: emp.userId || "",
    approvedUserIds: Array.isArray(emp.approvedUserIds)
      ? emp.approvedUserIds
      : [],
  };
}

/** Índice CPF/CNPJ (só dígitos) → IDs de registros com esse documento. */
export function buildClientsByDocumentIndex(
  clients: Array<{ id: string; cpfCnpj?: string | null }>,
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const client of clients) {
    const digits = normalizeDocumentDigits(client.cpfCnpj);
    if (!digits) continue;
    const list = index.get(digits) ?? [];
    list.push(client.id);
    index.set(digits, list);
  }
  return index;
}

function pickClientIdFromDocumentMatches(
  candidateIds: string[],
  emp: EmpreendedorForClientSync,
  clientsById: Map<string, Partial<Client> & { id: string }>,
): string | null {
  if (candidateIds.length === 0) return null;
  if (candidateIds.length === 1) return candidateIds[0];

  if (emp.sourceClientId && candidateIds.includes(emp.sourceClientId)) {
    return emp.sourceClientId;
  }
  if (candidateIds.includes(emp.id)) {
    return emp.id;
  }

  const withSourceLink = candidateIds.find((id) => {
    const c = clientsById.get(id);
    return c && normalizeDocumentDigits(c.cpfCnpj) === normalizeDocumentDigits(emp.cpfCnpj);
  });
  return withSourceLink ?? candidateIds[0];
}

/**
 * Resolve o ID do documento em `clients` a atualizar para um empreendedor,
 * evitando duplicar cadastro quando já existe cliente com o mesmo CPF/CNPJ.
 */
export function resolveClientIdForEmpreendedor(
  emp: EmpreendedorForClientSync,
  clientsById: Map<string, Partial<Client> & { id: string }>,
  documentIndex: Map<string, string[]>,
): string {
  if (emp.sourceClientId && clientsById.has(emp.sourceClientId)) {
    return emp.sourceClientId;
  }

  const digits = normalizeDocumentDigits(emp.cpfCnpj);
  if (digits) {
    const matches = documentIndex.get(digits);
    if (matches?.length) {
      const picked = pickClientIdFromDocumentMatches(matches, emp, clientsById);
      if (picked) return picked;
    }
  }

  if (clientsById.has(emp.id)) {
    return emp.id;
  }

  return emp.id;
}

export type SyncEmpreendedorStats = {
  total: number;
  linkedExisting: number;
  newAtEmpreendedorId: number;
};

export function computeSyncEmpreendedorStats(
  emp: EmpreendedorForClientSync,
  targetClientId: string,
  initialClientIds: Set<string>,
): Pick<SyncEmpreendedorStats, "linkedExisting" | "newAtEmpreendedorId"> {
  const linkedExisting = targetClientId !== emp.id ? 1 : 0;
  const newAtEmpreendedorId =
    targetClientId === emp.id && !initialClientIds.has(emp.id) ? 1 : 0;
  return { linkedExisting, newAtEmpreendedorId };
}
