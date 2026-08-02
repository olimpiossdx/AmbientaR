import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AnyRoute } from "@tanstack/react-router";
import {
 defineAppModules,
 getModuleNavigation,
 getModuleRouteTrees,
 mergeNavigationItems,
} from "../app/define-app-modules";

describe("registro estático de módulos", () => {
 it("deriva rotas e navegação do mesmo registro", () => {
  const firstRoute = { id: "first" } as unknown as AnyRoute;
  const secondRoute = { id: "second" } as unknown as AnyRoute;
  const modules = defineAppModules(
   {
    id: "first",
    routeTree: firstRoute,
    navigation: [{ label: "Primeiro", order: 20 }],
   },
   {
    id: "second",
    routeTree: secondRoute,
    navigation: [{ label: "Segundo", order: 10 }],
   },
  );

  assert.deepEqual(getModuleRouteTrees(modules), [firstRoute, secondRoute]);
  assert.deepEqual(
   getModuleNavigation(modules).map((item) => item.label),
   ["Segundo", "Primeiro"],
  );
 });

 it("mescla contribuições de módulos para o mesmo agrupador", () => {
  const items = mergeNavigationItems([
   {
    id: "cadastro",
    label: "Cadastro",
    claim: { claimType: "modulo.cadastro", claimValue: "acessar" },
    children: [{
     to: "/app/users",
     legacyHref: "/users",
     label: "Usuários",
    }],
   },
   {
    id: "cadastro",
    label: "Cadastro",
    children: [
     {
      to: "/app/users",
      legacyHref: "/users",
      label: "Usuários",
      claim: { claimType: "recurso.usuario", claimValue: "visualizar" },
     },
     {
      to: "/app/empreendedores",
      legacyHref: "/empreendedores",
      label: "Empreendedores",
     },
    ],
   },
  ]);

  assert.equal(items.length, 1);
  assert.deepEqual(items[0]?.children?.map((item) => item.label), [
   "Usuários",
   "Empreendedores",
  ]);
  assert.deepEqual(items[0]?.children?.[0]?.claim, {
   claimType: "recurso.usuario",
   claimValue: "visualizar",
  });
 });

});
