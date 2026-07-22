import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AuthorizationService } from "../app/authorization/authorization-service";
import { filterNavigationByClaims } from "../app/navigation/navigation-filter";
import { getNavigationRequirementsForPath } from "../modules/navigation/navigation-registry";

describe("filtro recursivo de navegação", () => {
 it("aplica claims de pais e remove grupos vazios", () => {
  const allowed = new Set(["modulo.cadastros:acessar", "recurso.usuario:visualizar"]);
  const authorization: AuthorizationService = {
   hasClaim: (type, value) => allowed.has(`${type.toLowerCase()}:${value.toLowerCase()}`),
   satisfies: (claim) => !claim || allowed.has(
    `${claim.claimType.toLowerCase()}:${claim.claimValue.toLowerCase()}`,
   ),
  };

  const result = filterNavigationByClaims([
   {
    label: "Cadastros",
    claim: { claimType: "MODULO.CADASTROS", claimValue: "ACESSAR" },
    children: [
     {
      label: "Usuários",
      claim: { claimType: "recurso.usuario", claimValue: "visualizar" },
     },
     {
      label: "Clientes",
      claim: { claimType: "recurso.cliente", claimValue: "visualizar" },
     },
    ],
   },
  ], authorization);

  assert.equal(result.length, 1);
  assert.deepEqual(result[0]?.children?.map((item) => item.label), ["Usuários"]);
 });

 it("expõe a mesma claim inline para proteção da URL legada", () => {
  assert.deepEqual(getNavigationRequirementsForPath("/app/users"), [
   { claimType: "recurso.usuario", claimValue: "visualizar" },
  ]);
 });
});
