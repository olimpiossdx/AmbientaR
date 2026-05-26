import type { Client, Empreendedor } from "@/lib/types";
import { normalizeDocumentDigits } from "@/lib/document-lookup";
import { buildClientsByDocumentIndex } from "@/lib/sync-empreendedor-to-client";
import {
  buildMergePreviewRows,
  mergeStringFieldsIntoPayload,
  pickIdByCompleteness,
  type MergePreviewRow,
  unionStringArrays,
} from "@/lib/record-merge-utils";

export type ClientRecord = Partial<Client> & { id: string };

export type ClientDuplicateGroup = {
  documentDigits: string;
  clientIds: string[];
  displayDocument: string;
};

/** Coleções/caminhos com referência direta a `clientId` (consulta `where`). */
export const CLIENT_ID_REFERENCE_QUERIES: ReadonlyArray<{
  collection: string;
  field: string;
}> = [
  { collection: "invoices", field: "clientId" },
  { collection: "revenues", field: "clientId" },
  { collection: "commercialProposals", field: "clientId" },
  { collection: "opportunities", field: "clientId" },
  { collection: "appointments", field: "clientId" },
  { collection: "analisesSocioambientais", field: "clientId" },
  { collection: "contracts", field: "clientId" },
  { collection: "contracts", field: "contratante.clientId" },
  { collection: "georef_projects", field: "clientId" },
  { collection: "eiaRimas", field: "requerente.clientId" },
  { collection: "lasRas", field: "requerente.clientId" },
  { collection: "reanalises", field: "requerente.clientId" },
];

export function findDuplicateClientGroups(
  clients: ClientRecord[],
): ClientDuplicateGroup[] {
  const index = buildClientsByDocumentIndex(clients);
  const clientsById = new Map(clients.map((c) => [c.id, c]));
  const groups: ClientDuplicateGroup[] = [];

  for (const [documentDigits, clientIds] of index) {
    if (clientIds.length < 2) continue;
    const sample = clientsById.get(clientIds[0]);
    groups.push({
      documentDigits,
      clientIds: [...clientIds],
      displayDocument:
        sample?.cpfCnpj?.trim() || documentDigits,
    });
  }

  groups.sort((a, b) =>
    a.displayDocument.localeCompare(b.displayDocument, "pt-BR"),
  );
  return groups;
}

const CLIENT_SCORE_FIELDS = [
  "name",
  "email",
  "phone",
  "address",
  "cpfCnpj",
  "ctfIbama",
  "userId",
];

export const CLIENT_MERGE_PREVIEW_FIELDS: ReadonlyArray<{
  field: string;
  label: string;
}> = [
  { field: "name", label: "Nome" },
  { field: "cpfCnpj", label: "CPF/CNPJ" },
  { field: "email", label: "E-mail" },
  { field: "phone", label: "Telefone" },
  { field: "address", label: "Endereço" },
  { field: "municipio", label: "Município" },
  { field: "userId", label: "Usuário vinculado" },
  { field: "ctfIbama", label: "CTF IBAMA" },
];

function pickMostCompleteClientId(
  candidateIds: string[],
  clientsById: Map<string, ClientRecord>,
): string {
  return pickIdByCompleteness(
    candidateIds,
    clientsById,
    CLIENT_SCORE_FIELDS,
    { userId: 20, email: 4, phone: 4, ctfIbama: 1 },
  );
}

/**
 * Escolhe o cliente a manter: prioriza `sourceClientId` do empreendedor,
 * depois cadastro que não é ID de empreendedor (fantasma de sync), depois mais completo.
 */
export function pickCanonicalClientId(
  clientIds: string[],
  clientsById: Map<string, ClientRecord>,
  empreendedores: Array<Partial<Empreendedor> & { id: string }>,
): string {
  const idSet = new Set(clientIds);
  const sourceCounts = new Map<string, number>();

  const groupDigits = normalizeDocumentDigits(
    clientsById.get(clientIds[0])?.cpfCnpj,
  );

  for (const emp of empreendedores) {
    const digits = normalizeDocumentDigits(emp.cpfCnpj);
    if (groupDigits && digits !== groupDigits) continue;
    const sourceId = emp.sourceClientId;
    if (sourceId && idSet.has(sourceId)) {
      sourceCounts.set(sourceId, (sourceCounts.get(sourceId) || 0) + 1);
    }
  }

  if (sourceCounts.size > 0) {
    return [...sourceCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  const empreendedorIds = new Set(empreendedores.map((e) => e.id));
  const nonEmpreendedorDocIds = clientIds.filter((id) => !empreendedorIds.has(id));
  if (nonEmpreendedorDocIds.length > 0) {
    return pickMostCompleteClientId(nonEmpreendedorDocIds, clientsById);
  }

  return pickMostCompleteClientId(clientIds, clientsById);
}

const MERGE_STRING_FIELDS: (keyof Client)[] = [
  "name",
  "cpfCnpj",
  "entityType",
  "phone",
  "email",
  "identidade",
  "emissor",
  "nacionalidade",
  "estadoCivil",
  "dataNascimento",
  "ctfIbama",
  "address",
  "numero",
  "bairro",
  "municipio",
  "uf",
  "cep",
  "userId",
  "analiseSocioambientalId",
];

/** Mescla campos dos duplicados no cadastro canônico (preenche vazios; se ambos preenchidos, prefere mais recente). */
export function mergeClientFields(
  canonical: ClientRecord,
  duplicates: ClientRecord[],
): Record<string, unknown> {
  const merged = mergeStringFieldsIntoPayload(
    canonical,
    duplicates,
    MERGE_STRING_FIELDS as string[],
  );

  merged.cpfCnpj = normalizeDocumentDigits(
    String(merged.cpfCnpj || canonical.cpfCnpj),
  );
  merged.approvedUserIds = unionStringArrays(
    canonical,
    duplicates,
    "approvedUserIds",
  );
  delete merged.id;
  return merged;
}

export type MergeClientGroupPlan = {
  canonicalId: string;
  duplicateIds: string[];
  mergedPayload: Record<string, unknown>;
  previewRows: MergePreviewRow[];
};

export function buildMergePlanForGroup(
  group: ClientDuplicateGroup,
  clientsById: Map<string, ClientRecord>,
  empreendedores: Array<Partial<Empreendedor> & { id: string }>,
): MergeClientGroupPlan | null {
  if (group.clientIds.length < 2) return null;

  const canonicalId = pickCanonicalClientId(
    group.clientIds,
    clientsById,
    empreendedores,
  );
  const duplicateIds = group.clientIds.filter((id) => id !== canonicalId);
  const canonical = clientsById.get(canonicalId);
  if (!canonical) return null;

  const duplicates = duplicateIds
    .map((id) => clientsById.get(id))
    .filter((c): c is ClientRecord => Boolean(c));

  const mergedPayload = mergeClientFields(canonical, duplicates);
  const previewRows = buildMergePreviewRows(
    canonical,
    duplicates,
    CLIENT_MERGE_PREVIEW_FIELDS,
    mergedPayload,
  );

  return {
    canonicalId,
    duplicateIds,
    mergedPayload,
    previewRows,
  };
}
