import type { EntityType } from "@/lib/types";
import { normalizeDocumentDigits } from "@/lib/document-lookup";

export type TitularType = "pessoa_fisica" | "pessoa_juridica" | "produtor_rural";

export function isValidTitularDocument(raw: string | undefined | null): boolean {
  const digits = normalizeDocumentDigits(raw);
  return digits.length === 11 || digits.length === 14;
}

export function resolveTitularType(raw: string | undefined | null): TitularType | null {
  const digits = normalizeDocumentDigits(raw);
  if (digits.length === 11) return "pessoa_fisica";
  if (digits.length === 14) return "pessoa_juridica";
  return null;
}

export function resolveEntityTypeFromTitular(raw: string | undefined | null): EntityType {
  const type = resolveTitularType(raw);
  if (type === "pessoa_juridica") return "Pessoa Jurídica";
  return "Pessoa Física";
}

export function buildTitularFields(raw: string | undefined | null) {
  const titularDocument = normalizeDocumentDigits(raw);
  const titularType = resolveTitularType(titularDocument);

  return {
    titularDocument: titularDocument || "",
    titularType,
    cpfCnpj: titularDocument || "",
    entityType: resolveEntityTypeFromTitular(titularDocument),
  };
}
