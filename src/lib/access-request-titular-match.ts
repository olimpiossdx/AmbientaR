import { normalizeDocumentDigits } from "@/lib/document-lookup";
import type { AccessRequest, Client, Empreendedor } from "@/lib/types";
import { addTitularDocumentToSet } from "@/lib/titular-document-set";

export function accessRequestMatchesTitularDocuments(
  request: Pick<AccessRequest, "cpfOfInterested">,
  titularDocuments: Set<string>,
  ownedEntities?: Pick<Client | Empreendedor, "cpfCnpj">[],
): boolean {
  const raw = request.cpfOfInterested || "";
  const digits = normalizeDocumentDigits(raw);
  if (digits.length < 11) return false;

  const requestVariants = new Set<string>();
  addTitularDocumentToSet(requestVariants, raw);
  for (const value of requestVariants) {
    if (titularDocuments.has(value)) return true;
  }

  if (ownedEntities?.length) {
    return ownedEntities.some(
      (entity) => normalizeDocumentDigits(entity.cpfCnpj) === digits,
    );
  }

  return false;
}

export function filterAccessRequestsForTitular(
  requests: AccessRequest[] | null | undefined,
  titularDocuments: Set<string>,
  ownedEntities?: Pick<Client | Empreendedor, "cpfCnpj">[],
): AccessRequest[] {
  if (!requests?.length) return [];
  if (titularDocuments.size === 0 && !ownedEntities?.length) return [];

  return requests.filter((r) =>
    accessRequestMatchesTitularDocuments(r, titularDocuments, ownedEntities),
  );
}
