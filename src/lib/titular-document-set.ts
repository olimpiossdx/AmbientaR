import { buildCpfCnpjVariants, normalizeDocumentDigits } from "@/lib/document-lookup";

import type { AppUser, Client, Empreendedor } from "@/lib/types";



type TitularEntity = Pick<Client | Empreendedor, "id" | "cpfCnpj">;



/**

 * Empreendimentos/clientes usados para casar pedidos em `access_requests`.

 * Apenas vínculos explícitos (`linkedClientId` / `linkedEmpreendedorId`).

 * Não usa todos os registros com `userId` do titular (evita CNPJ de terceiros).

 */

export function buildTitularOwnedEntitiesForAccessMatch(input: {

  myClients?: Client[] | null;

  myEmpreendedores?: Empreendedor[] | null;

  linkedClient?: Client | null;

  linkedEmpreendedor?: Empreendedor | null;

  linkedClientId?: string | null;

  linkedEmpreendedorId?: string | null;

}): TitularEntity[] {

  const merged = new Map<string, TitularEntity>();

  const add = (entity: TitularEntity | null | undefined) => {

    if (!entity?.id) return;

    merged.set(entity.id, entity);

  };



  const linkedIds = new Set(

    [input.linkedClientId, input.linkedEmpreendedorId].filter(

      (id): id is string => Boolean(id),

    ),

  );

  if (linkedIds.size === 0) return [];



  for (const entity of input.myClients ?? []) {

    if (entity.id && linkedIds.has(entity.id)) add(entity);

  }

  for (const entity of input.myEmpreendedores ?? []) {

    if (entity.id && linkedIds.has(entity.id)) add(entity);

  }



  if (input.linkedClientId && input.linkedClient?.id === input.linkedClientId) {

    add(input.linkedClient);

  }

  if (

    input.linkedEmpreendedorId &&

    input.linkedEmpreendedor?.id === input.linkedEmpreendedorId

  ) {

    add(input.linkedEmpreendedor);

  }



  return Array.from(merged.values());

}



export function titularHasClaimedDocuments(

  titularDocuments: Set<string>,

  ownedEntities: TitularEntity[],

): boolean {

  if (titularDocuments.size > 0) return true;

  return ownedEntities.some(

    (e) => normalizeDocumentDigits(e.cpfCnpj ?? "").length >= 11,

  );

}



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

  profile?: Pick<AppUser, "cpf" | "userCpf" | "cnpjs" | "titularDocument"> | null;

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

    addTitularDocumentToSet(set, profile.titularDocument);

    profile.cnpjs?.forEach((cnpj) => addTitularDocumentToSet(set, cnpj));

  }



  input.extraDocuments?.forEach((doc) => addTitularDocumentToSet(set, doc));



  return set;

}



/**

 * Documentos para consentimento de acesso: perfil do titular + CNPJ/CPF de

 * empreendimentos explicitamente vinculados (sem poluir com `userId` órfão).

 */

export function buildTitularAccessMatchDocumentSet(input: {

  profile?: Pick<AppUser, "cpf" | "userCpf" | "cnpjs" | "titularDocument"> | null;

  ownedEntities?: Pick<Client | Empreendedor, "cpfCnpj">[] | null;

}): Set<string> {

  return buildTitularCpfCnpjSet({

    profile: input.profile ?? undefined,

    extraDocuments: (input.ownedEntities ?? []).map((e) => e.cpfCnpj),

  });

}


