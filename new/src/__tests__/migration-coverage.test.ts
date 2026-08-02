import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
 assertImplementedFeaturesHaveConcreteRoutes,
 buildMigrationCoverage,
 discoverRouteDefinitions,
 parseInventoryRoutes,
} from "../modules/migration-plan/migration-coverage";
import { migrationBaseline, parseFeatureCatalog } from "../modules/migration-plan/migration-plan-data";

const projectRoot = resolve(import.meta.dirname, "../..");
const inventoryMarkdown = readFileSync(resolve(projectRoot, "docs/INVENTARIO-COMPLETO-TELAS-ROTAS.md"), "utf8");
const catalog = parseFeatureCatalog(readFileSync(resolve(projectRoot, "docs/CATALOGO-MENUS-FUNCIONALIDADES-API.md"), "utf8"));

function currentRouteSources() {
 const modulesRoot = resolve(projectRoot, "src/modules");
 const sources: Record<string, string> = {
  "src/router.tsx": readFileSync(resolve(projectRoot, "src/router.tsx"), "utf8"),
 };
 for (const entry of readdirSync(modulesRoot, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".routes.tsx")) continue;
  const path = resolve(entry.parentPath, entry.name);
  sources[path] = readFileSync(path, "utf8");
 }
 return sources;
}

describe("gate automatizado do inventário de migração", () => {
 it("lê todas as 285 variações e os 267 padrões reais do Markdown", () => {
  const routes = parseInventoryRoutes(inventoryMarkdown);
  assert.equal(routes.length, migrationBaseline.totalRouteVariations);
  assert.equal(new Set(routes.map((route) => route.pattern)).size, migrationBaseline.routePatterns);
  assert.equal(routes.filter((route) => route.area === "public").length, migrationBaseline.publicRoutes);
 });

 it("separa catch-all de rotas concretas", () => {
  const routes = discoverRouteDefinitions({
   "feature.routes.tsx": `createRoute({ getParentRoute: () => authenticatedRoute, path: "/users" });\ncreateRoute({ getParentRoute: () => authenticatedRoute, path: "$" });`,
  });
  assert.deepEqual(routes.map(({ pattern, kind }) => ({ pattern, kind })), [
   { pattern: "/app/users", kind: "concrete" },
   { pattern: "/app/$", kind: "catch_all" },
  ]);
 });

 it("não usa o catch-all legado para inflar a cobertura atual", () => {
  const coverage = buildMigrationCoverage(inventoryMarkdown, catalog, currentRouteSources());
  assert.equal(coverage.catchAllRoutes.length, 1);
  assert.ok(coverage.inventoryPatternsImplemented < coverage.inventoryPatternsTotal);
  assert.equal(coverage.featureRoutes["FUN-CAD-001"].hasConcreteRoute, true);
  assert.equal(coverage.featureRoutes["FUN-FIN-002"].hasConcreteRoute, false);
 });

 it("falha quando uma FUN é marcada concluída sem todas as rotas concretas", () => {
  const coverage = buildMigrationCoverage(inventoryMarkdown, catalog, currentRouteSources());
  assert.throws(
   () => assertImplementedFeaturesHaveConcreteRoutes(catalog, {
    "FUN-FIN-002": { status: "done", completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], evidence: "PR-999" },
   }, coverage),
   /FUN-FIN-002/,
  );
 });
});
