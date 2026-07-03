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
  if (!titularDocuments.size && !ownedEntities?.length) return [];

  return requests.filter((r) =>
    accessRequestMatchesTitularDocuments(r, titularDocuments, ownedEntities),
  );
}

/** Pedidos visíveis só quando o titular tem CPF/CNPJ no perfil ou empreendimento vinculado. */
export function filterAccessRequestsForTitularPortal(
  requests: AccessRequest[] | null | undefined,
  titularDocuments: Set<string>,
  ownedEntities?: Pick<Client | Empreendedor, "cpfCnpj">[] | null,
): AccessRequest[] {
  const entities = ownedEntities ?? [];
  const docs = titularDocuments ?? new Set<string>();
  const hasClaim =
    docs.size > 0 ||
    entities.some(
      (e) => normalizeDocumentDigits(e.cpfCnpj ?? "").length >= 11,
    );
  if (!hasClaim) return [];
  return filterAccessRequestsForTitular(requests, docs, entities);
}

/** Evita duplicatas na UI quando há vários pedidos do mesmo solicitante para o mesmo CPF/CNPJ. */
export function dedupeAccessRequestsByRequesterAndDocument(
  requests: AccessRequest[],
): AccessRequest[] {
  const byKey = new Map<string, AccessRequest>();

  for (const req of requests) {
    const docDigits = normalizeDocumentDigits(req.cpfOfInterested ?? "");
    const requesterKey =
      (req.requestedByEmail ?? "").trim().toLowerCase() ||
      req.requestedByUserId ||
      "";
    if (!requesterKey || docDigits.length < 11) continue;
    const key = `${requesterKey}:${docDigits}`;
    const existing = byKey.get(key);
    if (
      !existing ||
      String(req.createdAt ?? "") > String(existing.createdAt ?? "")
    ) {
      byKey.set(key, req);
    }
  }

  return [...byKey.values()];
}
