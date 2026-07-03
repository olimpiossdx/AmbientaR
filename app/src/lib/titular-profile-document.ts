import {
  buildCpfCnpjIdentityFields,
  isValidCpfCnpj,
  normalizeCpfCnpj,
} from "@/lib/cpf-cnpj";
import type { TitularType } from "@/lib/cpf-cnpj";
import type { AppUser, EntityType, UserRole } from "@/lib/types";

/** Perfis titulares do portal cujo vínculo a empreendedor usa CPF ou CNPJ. */
export function isTitularPortalRole(role: UserRole | undefined): boolean {
  return role === "client" || role === "cliente_autonomo";
}

/** Documento de vínculo salvo no perfil (titularDocument → cpf → cnpjs[0]). */
export function resolveTitularDocumentFromProfile(
  user:
    | Pick<AppUser, "titularDocument" | "cpf" | "cnpjs" | "userCpf">
    | null
    | undefined,
): string {
  if (!user) return "";

  const fromTitular = normalizeCpfCnpj(user.titularDocument);
  if (fromTitular.length === 11 || fromTitular.length === 14) {
    return fromTitular;
  }

  const fromCpf = normalizeCpfCnpj(user.cpf);
  if (fromCpf.length === 11 || fromCpf.length === 14) return fromCpf;

  const fromCnpj = normalizeCpfCnpj(user.cnpjs?.[0]);
  if (fromCnpj.length === 14) return fromCnpj;

  return "";
}

export type TitularProfileDocumentFields = {
  titularDocument: string;
  titularType: TitularType | null;
  entityType: EntityType;
  cpf: string;
  cnpjs: string[];
};

/** Campos de perfil Firestore a partir de um CPF/CNPJ de vínculo (mesma rota do Cadastre-se). */
export function buildTitularProfileDocumentFields(
  raw: string | undefined | null,
): TitularProfileDocumentFields | null {
  const digits = normalizeCpfCnpj(raw);
  if (!isValidCpfCnpj(digits)) return null;

  const identity = buildCpfCnpjIdentityFields(digits);
  return {
    titularDocument: identity.titularDocument,
    titularType: identity.titularType,
    entityType: identity.entityType,
    cpf: identity.isCpf ? digits : "",
    cnpjs: identity.isCnpj ? [digits] : [],
  };
}

/** Separa lista unificada de documentos em CPFs e CNPJs (representantes/consultores). */
export function splitAccessDocuments(documents: string[]): {
  cpfs: string[];
  cnpjs: string[];
} {
  const cpfs: string[] = [];
  const cnpjs: string[] = [];

  for (const raw of documents) {
    const digits = normalizeCpfCnpj(raw);
    if (!isValidCpfCnpj(digits)) continue;
    if (digits.length === 11) cpfs.push(digits);
    else if (digits.length === 14) cnpjs.push(digits);
  }

  return { cpfs, cnpjs };
}

/** Valida documento de vínculo titular (11 ou 14 dígitos válidos). */
export function isValidTitularLinkDocument(
  raw: string | undefined | null,
): boolean {
  return isValidCpfCnpj(raw);
}
