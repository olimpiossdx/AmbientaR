import type { Empreendedor } from "@/lib/types";
import { normalizeDocumentDigits } from "@/lib/document-lookup";
import { buildClientsByDocumentIndex } from "@/lib/sync-empreendedor-to-client";
import {
  buildMergePreviewRows,
  completenessScoreForFields,
  mergeStringFieldsIntoPayload,
  pickIdByCompleteness,
  type MergePreviewRow,
  unionStringArrays,
} from "@/lib/record-merge-utils";

export type EmpreendedorRecord = Partial<Empreendedor> & { id: string };

export type EmpreendedorDuplicateGroup = {
  documentDigits: string;
  empreendedorIds: string[];
  displayDocument: string;
};

/** Coleções com referência direta a `empreendedorId`. */
export const EMPREENDEDOR_ID_REFERENCE_QUERIES: ReadonlyArray<{
  collection: string;
  field: string;
}> = [
  { collection: "projects", field: "empreendedorId" },
  { collection: "licenses", field: "empreendedorId" },
  { collection: "tacs", field: "empreendedorId" },
  { collection: "outorgas", field: "empreendedorId" },
  { collection: "intervencoes", field: "empreendedorId" },
  { collection: "faunaStudies", field: "empreendedorId" },
  { collection: "requests", field: "empreendedorId" },
  { collection: "inspections", field: "empreendedorId" },
  { collection: "consultas", field: "empreendedorId" },
  { collection: "laudos", field: "empreendedorId" },
  { collection: "usosInsignificantes", field: "empreendedorId" },
];

const SCORE_FIELDS = [
  "name",
  "email",
  "phone",
  "address",
  "municipio",
  "cpfCnpj",
  "ctfIbama",
  "userId",
  "sourceClientId",
];

const MERGE_STRING_FIELDS: (keyof Empreendedor)[] = [
  "name",
  "email",
  "phone",
  "address",
  "numero",
  "bairro",
  "municipio",
  "uf",
  "cep",
  "cpfCnpj",
  "fax",
  "correspondenceLogradouro",
  "correspondenceNumero",
  "correspondenceBairro",
  "correspondenceMunicipio",
  "correspondenceUf",
  "correspondenceCep",
  "userId",
  "sourceClientId",
  "dataNascimento",
  "ctfIbama",
];

export const EMPREENDEDOR_MERGE_PREVIEW_FIELDS: ReadonlyArray<{
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
  { field: "sourceClientId", label: "Cliente de origem" },
];

export function findDuplicateEmpreendedorGroups(
  empreendedores: EmpreendedorRecord[],
): EmpreendedorDuplicateGroup[] {
  const index = buildClientsByDocumentIndex(empreendedores);
  const byId = new Map(empreendedores.map((e) => [e.id, e]));
  const groups: EmpreendedorDuplicateGroup[] = [];

  for (const [documentDigits, empreendedorIds] of index) {
    if (empreendedorIds.length < 2) continue;
    const sample = byId.get(empreendedorIds[0]);
    groups.push({
      documentDigits,
      empreendedorIds: [...empreendedorIds],
      displayDocument: sample?.cpfCnpj?.trim() || documentDigits,
    });
  }

  groups.sort((a, b) =>
    a.displayDocument.localeCompare(b.displayDocument, "pt-BR"),
  );
  return groups;
}

/** Mantém o cadastro com portal (`userId`), depois `sourceClientId`, depois mais completo. */
export function pickCanonicalEmpreendedorId(
  empreendedorIds: string[],
  byId: Map<string, EmpreendedorRecord>,
): string {
  const withUser = empreendedorIds.filter((id) => {
    const e = byId.get(id);
    return Boolean(e?.userId?.trim());
  });
  if (withUser.length === 1) return withUser[0];
  if (withUser.length > 1) {
    return pickIdByCompleteness(withUser, byId, SCORE_FIELDS);
  }

  const withSource = empreendedorIds.filter((id) => {
    const e = byId.get(id);
    return Boolean(e?.sourceClientId?.trim());
  });
  if (withSource.length === 1) return withSource[0];
  if (withSource.length > 1) {
    return pickIdByCompleteness(withSource, byId, SCORE_FIELDS);
  }

  return pickIdByCompleteness(empreendedorIds, byId, SCORE_FIELDS);
}

export function mergeEmpreendedorFields(
  canonical: EmpreendedorRecord,
  duplicates: EmpreendedorRecord[],
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
  merged.projectIds = unionStringArrays(canonical, duplicates, "projectIds");

  const entityTypes = new Set<string>();
  const pushEntity = (raw: unknown) => {
    if (Array.isArray(raw)) {
      raw.forEach((v) => {
        if (typeof v === "string" && v.trim()) entityTypes.add(v);
      });
    } else if (typeof raw === "string" && raw.trim()) {
      entityTypes.add(raw);
    }
  };
  pushEntity(canonical.entityType);
  for (const dup of duplicates) pushEntity(dup.entityType);
  if (entityTypes.size === 1) {
    merged.entityType = [...entityTypes][0];
  } else if (entityTypes.size > 1) {
    merged.entityType = [...entityTypes];
  }

  delete merged.id;
  return merged;
}

export type MergeEmpreendedorGroupPlan = {
  canonicalId: string;
  duplicateIds: string[];
  mergedPayload: Record<string, unknown>;
  previewRows: MergePreviewRow[];
};

export function buildEmpreendedorMergePlanForGroup(
  group: EmpreendedorDuplicateGroup,
  byId: Map<string, EmpreendedorRecord>,
): MergeEmpreendedorGroupPlan | null {
  if (group.empreendedorIds.length < 2) return null;

  const canonicalId = pickCanonicalEmpreendedorId(
    group.empreendedorIds,
    byId,
  );
  const duplicateIds = group.empreendedorIds.filter((id) => id !== canonicalId);
  const canonical = byId.get(canonicalId);
  if (!canonical) return null;

  const duplicates = duplicateIds
    .map((id) => byId.get(id))
    .filter((e): e is EmpreendedorRecord => Boolean(e));

  const mergedPayload = mergeEmpreendedorFields(canonical, duplicates);
  const previewRows = buildMergePreviewRows(
    canonical,
    duplicates,
    EMPREENDEDOR_MERGE_PREVIEW_FIELDS,
    mergedPayload,
  );

  return {
    canonicalId,
    duplicateIds,
    mergedPayload,
    previewRows,
  };
}

/** Pontuação exportada para testes / UI. */
export function empreendedorCompletenessScore(record: EmpreendedorRecord): number {
  return completenessScoreForFields(record, SCORE_FIELDS, {
    userId: 20,
    sourceClientId: 8,
    email: 4,
    phone: 4,
  });
}
