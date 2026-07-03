import type { AccessRequest, AppUser } from "@/lib/types";
import { normalizeDocumentDigits } from "@/lib/document-lookup";
import { formatCpfCnpjDisplay } from "@/lib/masks";

function getRepLinkageKeys(rep: Pick<AppUser, "id" | "uid">): string[] {
  const keys = new Set<string>();
  if (rep.id) keys.add(rep.id);
  if (rep.uid) keys.add(rep.uid);
  return Array.from(keys);
}

/** CPF/CNPJ (só dígitos) solicitados por representante — pedidos + perfil. */
export function buildRepresentativeRequestedDocumentsMap(
  accessRequests: Pick<
    AccessRequest,
    "requestedByUserId" | "cpfOfInterested" | "status"
  >[],
  representatives?: Pick<AppUser, "id" | "uid" | "cnpjs">[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  const add = (repKey: string, digits: string) => {
    if (digits.length < 11) return;
    if (!map.has(repKey)) map.set(repKey, new Set());
    map.get(repKey)!.add(digits);
  };

  for (const req of accessRequests) {
    if (req.status !== "pending" && req.status !== "approved") continue;
    const digits = normalizeDocumentDigits(req.cpfOfInterested);
    if (!req.requestedByUserId) continue;
    add(req.requestedByUserId, digits);
  }

  for (const rep of representatives ?? []) {
    for (const key of getRepLinkageKeys(rep)) {
      for (const cnpj of rep.cnpjs ?? []) {
        add(key, normalizeDocumentDigits(cnpj));
      }
    }
  }

  return map;
}

export function getRepresentativeRequestedDocumentDigits(
  rep: Pick<AppUser, "id" | "uid" | "cnpjs">,
  requestsByRepId: Map<string, Set<string>>,
): string[] {
  const merged = new Set<string>();
  for (const key of getRepLinkageKeys(rep)) {
    requestsByRepId.get(key)?.forEach((d) => merged.add(d));
  }
  for (const cnpj of rep.cnpjs ?? []) {
    const d = normalizeDocumentDigits(cnpj);
    if (d.length >= 11) merged.add(d);
  }
  return Array.from(merged).sort();
}

export function formatRepresentativeRequestedDocumentsLabel(
  digitsList: string[],
  maxVisible = 3,
): string {
  if (digitsList.length === 0) return "";
  const formatted = digitsList.map((d) => formatCpfCnpjDisplay(d));
  if (formatted.length <= maxVisible) return formatted.join(", ");
  const visible = formatted.slice(0, maxVisible).join(", ");
  const rest = formatted.length - maxVisible;
  return `${visible} e mais ${rest}`;
}

export function representativeRequestedDocumentsMatches(
  digitsList: string[],
  empreendedorCpfCnpj: string,
): boolean {
  const target = normalizeDocumentDigits(empreendedorCpfCnpj);
  if (target.length < 11) return false;
  return digitsList.includes(target);
}
