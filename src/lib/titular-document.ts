import type { EntityType } from "@/lib/types";
import {
  buildCpfCnpjIdentityFields,
  isValidCpfCnpj,
  normalizeCpfCnpj,
  resolveTitularType as resolveTitularTypeFromDoc,
} from "@/lib/cpf-cnpj";

export type TitularType = "pessoa_fisica" | "pessoa_juridica" | "produtor_rural";

export function isValidTitularDocument(raw: string | undefined | null): boolean {
  return isValidCpfCnpj(raw);
}

export function resolveTitularType(
  raw: string | undefined | null,
): TitularType | null {
  const type = resolveTitularTypeFromDoc(raw);
  return type;
}

export function resolveEntityTypeFromTitular(
  raw: string | undefined | null,
): EntityType {
  return buildCpfCnpjIdentityFields(raw).entityType;
}

export function buildTitularFields(raw: string | undefined | null) {
  const identity = buildCpfCnpjIdentityFields(raw);
  const titularDocument = normalizeCpfCnpj(raw);

  return {
    titularDocument: titularDocument || "",
    titularType: identity.titularType,
    cpfCnpj: titularDocument || "",
    entityType: identity.entityType,
  };
}
