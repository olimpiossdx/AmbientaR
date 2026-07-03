/**
 * Verificação rápida (sem runner de testes) para matching de pedidos de acesso.
 * Executar: npx tsx scripts/verify-access-request-titular-match.ts
 */
import {
  accessRequestMatchesTitularDocuments,
  filterAccessRequestsForTitularPortal,
} from "../src/lib/access-request-titular-match";
import {
  buildTitularCpfCnpjSet,
  buildTitularOwnedEntitiesForAccessMatch,
} from "../src/lib/titular-document-set";
import type { AccessRequest, Client } from "../src/lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const myClients: Client[] = [
  {
    id: "client-1",
    name: "Gestão Celio",
    cpfCnpj: "52375307615",
    userId: "titular-uid",
  },
];

const owned = buildTitularOwnedEntitiesForAccessMatch({
  myClients,
  linkedClientId: null,
  linkedEmpreendedorId: null,
});

assert(owned.length === 1, "owned entities deve incluir myClients sem linkedClientId");

const docSet = buildTitularCpfCnpjSet({ myClients });
assert(docSet.has("52375307615"), "docSet deve conter CPF de myClients");

const request: AccessRequest = {
  id: "req-1",
  requestedByUserId: "consultor-uid",
  requestedByEmail: "denio@example.com",
  requestedByName: "Denio",
  cpfOfInterested: "52375307615",
  requestType: "consultor_representante",
  status: "pending",
  createdAt: new Date().toISOString(),
};

const visible = filterAccessRequestsForTitularPortal([request], docSet, owned);
assert(visible.length === 1, "titular deve ver pedido com CPF de myClients");

const noProfileMatch = accessRequestMatchesTitularDocuments(
  request,
  new Set<string>(),
  owned,
);
assert(noProfileMatch, "match via ownedEntities sem perfil");

console.log("verify-access-request-titular-match: OK");
