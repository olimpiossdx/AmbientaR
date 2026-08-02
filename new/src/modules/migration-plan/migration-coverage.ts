import type { ExecutionProgress, MigrationFeature } from "./migration-plan-data";

export type InventoryRoute = {
 url: string;
 pattern: string;
 area: "public" | "authenticated";
};

export type DiscoveredRoute = {
 pattern: string;
 source: string;
 kind: "concrete" | "catch_all";
};

export type FeatureRouteCoverage = {
 featureId: string;
 expected: string[];
 implemented: string[];
 missing: string[];
 hasConcreteRoute: boolean;
};

export type MigrationCoverage = {
 inventory: InventoryRoute[];
 concreteRoutes: DiscoveredRoute[];
 catchAllRoutes: DiscoveredRoute[];
 featureRoutes: Record<string, FeatureRouteCoverage>;
 inventoryVariationsImplemented: number;
 inventoryPatternsImplemented: number;
 inventoryPatternsTotal: number;
 catalogRoutesMapped: number;
};

const PUBLIC_PATHS = new Set(["/login", "/register", "/forgot-password", "/politica-privacidade", "/offline"]);

export function routePattern(url: string): string {
 const [path] = url.trim().split("?", 1);
 const normalized = path.length > 1 ? path.replace(/\/$/, "") : path;
 if (/^\/app\/studies\/compensacao-ambiental\/(?:especies|snuc|mata-atlantica|mineraria|app)$/.test(normalized)) {
  return "/app/studies/compensacao-ambiental/$tipo";
 }
 return normalized;
}

export function isCatchAllPath(path: string): boolean {
 const normalized = path.replace(/^\//, "");
 return normalized === "$" || normalized === "*" || normalized.startsWith("*splat");
}

export function parseInventoryRoutes(markdown: string): InventoryRoute[] {
 let area: InventoryRoute["area"] | undefined;
 const routes: InventoryRoute[] = [];

 for (const line of markdown.split("\n")) {
  if (/^## 4\./.test(line)) area = "public";
  if (/^## 5\./.test(line)) area = "authenticated";
  if (/^## 6\./.test(line)) area = undefined;
  const match = area ? line.match(/^- `([^`]+)`\s*$/) : undefined;
  if (match && area) routes.push({ url: match[1], pattern: routePattern(match[1]), area });
 }

 return routes;
}

function expandCatalogRoutes(routes: string): string[] {
 const tokens = [...routes.matchAll(/(?:^|[\s,;])((?:\/)[^\s,;]+)/g)]
  .map((match) => match[1].replace(/[.)]+$/, ""));
 const firstAbsolute = tokens[0];
 if (!firstAbsolute) return [];
 const base = routePattern(firstAbsolute.startsWith("/app") || PUBLIC_PATHS.has(firstAbsolute)
  ? firstAbsolute
  : `/app${firstAbsolute}`);

 return [...new Set(tokens.map((route, index) => {
  if (route.startsWith("/app") || PUBLIC_PATHS.has(route)) return routePattern(route);
  if (index === 0) return base;
  return routePattern(`${base}${route}`);
 }))];
}

export function mapCatalogRoutes(features: MigrationFeature[]): Record<string, string[]> {
 return Object.fromEntries(features.map((feature) => [feature.id, expandCatalogRoutes(feature.routes)]));
}

/**
 * Extracts literal TanStack paths from route declarations. A child of
 * authenticatedRoute is prefixed with /app. A splat is reported separately and
 * can never satisfy inventory coverage.
 */
export function discoverRouteDefinitions(sources: Record<string, string>): DiscoveredRoute[] {
 const discovered: DiscoveredRoute[] = [];

 for (const [source, contents] of Object.entries(sources)) {
  const definitions = contents.matchAll(/createRoute\s*\(\s*\{([\s\S]*?)\}\s*\)/g);
  for (const definition of definitions) {
   const body = definition[1];
   const path = body.match(/\bpath:\s*["']([^"']+)["']/)?.[1];
   if (!path) continue;
   const authenticated = /getParentRoute:\s*\(\)\s*=>\s*authenticatedRoute/.test(body);
   const pattern = authenticated
    ? path === "/" ? "/app" : routePattern(`/app/${path.replace(/^\//, "")}`)
    : routePattern(path);
   discovered.push({ pattern, source, kind: isCatchAllPath(path) ? "catch_all" : "concrete" });
  }
 }

 return discovered.filter((route, index, all) => (
  all.findIndex((candidate) => candidate.pattern === route.pattern && candidate.kind === route.kind) === index
 ));
}

export function buildMigrationCoverage(
 inventoryMarkdown: string,
 features: MigrationFeature[],
 routeSources: Record<string, string>,
): MigrationCoverage {
 const inventory = parseInventoryRoutes(inventoryMarkdown);
 const discovered = discoverRouteDefinitions(routeSources);
 const concreteRoutes = discovered.filter((route) => route.kind === "concrete");
 const catchAllRoutes = discovered.filter((route) => route.kind === "catch_all");
 const concretePatterns = new Set(concreteRoutes.map((route) => route.pattern));
 const catalogRoutes = mapCatalogRoutes(features);
 const featureRoutes = Object.fromEntries(features.map((feature) => {
  const expected = catalogRoutes[feature.id] ?? [];
  const implemented = expected.filter((pattern) => concretePatterns.has(pattern));
  return [feature.id, {
   featureId: feature.id,
   expected,
   implemented,
   missing: expected.filter((pattern) => !concretePatterns.has(pattern)),
   hasConcreteRoute: expected.length > 0 && implemented.length === expected.length,
  } satisfies FeatureRouteCoverage];
 }));
 const inventoryPatterns = new Set(inventory.map((route) => route.pattern));

 return {
  inventory,
  concreteRoutes,
  catchAllRoutes,
  featureRoutes,
  inventoryVariationsImplemented: inventory.filter((route) => concretePatterns.has(route.pattern)).length,
  inventoryPatternsImplemented: [...inventoryPatterns].filter((pattern) => concretePatterns.has(pattern)).length,
  inventoryPatternsTotal: inventoryPatterns.size,
  catalogRoutesMapped: Object.values(catalogRoutes).filter((routes) => routes.length > 0).length,
 };
}

export function assertImplementedFeaturesHaveConcreteRoutes(
 features: MigrationFeature[],
 progress: Record<string, ExecutionProgress>,
 coverage: MigrationCoverage,
): void {
 const invalid = features.filter((feature) => (
  progress[feature.id]?.status === "done" && !coverage.featureRoutes[feature.id]?.hasConcreteRoute
 ));
 if (invalid.length) {
  throw new Error(`Funcionalidades concluídas sem rota concreta: ${invalid.map((feature) => feature.id).join(", ")}`);
 }
}
