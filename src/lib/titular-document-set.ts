import { buildCpfCnpjVariants, normalizeDocumentDigits } from "@/lib/document-lookup";
import type { AppUser, Client, Empreendedor } from "@/lib/types";

export function addTitularDocumentToSet(
  set: Set<string>,
  raw: string | undefined | null,
): void {
  if (!raw) return;
  const trimmed = String(raw).trim();
  if (!trimmed) return;
  const digits = normalizeDocumentDigits(trimmed);
  if (digits.length < 11) return;
  for (const variant of buildCpfCnpjVariants(trimmed)) {
    set.add(variant);
  }
  set.add(digits);
  set.add(trimmed);
}

export type TitularDocumentSetInput = {
  profile?: Pick<AppUser, "cpf" | "userCpf" | "cnpjs"> | null;
  myClients?: Pick<Client, "cpfCnpj">[] | null;
  myEmpreendedores?: Pick<Empreendedor, "cpfCnpj">[] | null;
  clientById?: Pick<Client, "cpfCnpj"> | null;
  empreendedorById?: Pick<Empreendedor, "cpfCnpj"> | null;
  extraDocuments?: (string | undefined | null)[];
};

/** CPF/CNPJ que o titular pode usar para casar pedidos em `access_requests`. */
export function buildTitularCpfCnpjSet(input: TitularDocumentSetInput): Set<string> {
  const set = new Set<string>();

  input.myClients?.forEach((c) => addTitularDocumentToSet(set, c.cpfCnpj));
  input.myEmpreendedores?.forEach((e) => addTitularDocumentToSet(set, e.cpfCnpj));
  if (input.clientById?.cpfCnpj) addTitularDocumentToSet(set, input.clientById.cpfCnpj);
  if (input.empreendedorById?.cpfCnpj) {
    addTitularDocumentToSet(set, input.empreendedorById.cpfCnpj);
  }

  const profile = input.profile;
  if (profile) {
    addTitularDocumentToSet(set, profile.cpf);
    addTitularDocumentToSet(set, profile.userCpf);
    profile.cnpjs?.forEach((cnpj) => addTitularDocumentToSet(set, cnpj));
  }

  input.extraDocuments?.forEach((doc) => addTitularDocumentToSet(set, doc));

  return set;
}
