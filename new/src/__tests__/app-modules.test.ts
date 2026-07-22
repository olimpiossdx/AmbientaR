import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AnyRoute } from "@tanstack/react-router";
import {
 defineAppModules,
 getModuleNavigation,
 getModuleRouteTrees,
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
});
