import type { AppShellNavItem } from "../../componentes";
import { adminNavigationItems } from "../navigation/navigation-registry";
import { canAccessByRole, isAdminRole, isRoleDeniedByPrefix } from "./permissions";

type FlatRouteEntry = {
 path: string;
 roles?: string[];
};

const legacyAliases: Record<string, string> = {
 "/autos-infracao-defesa": "/multas-defesas",
 "/environmental-company": "/responsible-company",
 "/monitoring": "/monitoring/manual",
 "/studies": "/studies/educacao-ambiental",
 "/studies/intervencao-ambiental": "/studies/pia",
};

function normalizePath(path: string): string {
 const base = path.split("?")[0]?.split("#")[0] ?? path;
 const withSlash = base.startsWith("/") ? base : `/${base}`;
 return withSlash.endsWith("/") && withSlash.length > 1 ? withSlash.slice(0, -1) : withSlash;
}

function navPath(item: AppShellNavItem): string | null {
 const target = item.legacyHref ?? item.to;
 if (!target) return null;
 if (target.startsWith("http")) return null;
 return normalizePath(target);
}

function flattenNavigation(items: AppShellNavItem[], out: FlatRouteEntry[] = []): FlatRouteEntry[] {
 for (const item of items) {
  const path = navPath(item);
  if (path) out.push({ path, roles: item.roles });
  if (item.children?.length) flattenNavigation(item.children, out);
 }
 return out;
}

const routeEntries = flattenNavigation(adminNavigationItems);

function pathMatches(entryPath: string, currentPath: string): boolean {
 if (entryPath === "/") return currentPath === "/";
 return currentPath === entryPath || currentPath.startsWith(`${entryPath}/`);
}

function legacyPathForAppRoute(path: string): string {
 if (path === "/app") return "/";
 if (path.startsWith("/app/")) return path.slice("/app".length);
 return path;
}

export function getAllowedRolesForPath(pathname: string): string[] | null {
 const path = normalizePath(pathname);
 const legacyPath = normalizePath(legacyPathForAppRoute(path));
 const alias = legacyAliases[legacyPath];
 if (alias) return getAllowedRolesForPath(alias);

 let best: FlatRouteEntry | null = null;
 for (const entry of routeEntries) {
  if (!pathMatches(entry.path, legacyPath) && !pathMatches(entry.path, path)) continue;
  if (!best || entry.path.length > best.path.length) best = entry;
 }

 if (!best?.roles?.length) return null;
 return best.roles;
}

export function isRoleAllowedForPath(role: string | undefined | null, pathname: string): boolean {
 if (!role) return false;
 if (isAdminRole(role)) return true;
 const legacyPath = normalizePath(legacyPathForAppRoute(normalizePath(pathname)));
 if (isRoleDeniedByPrefix(role, legacyPath)) return false;
 const allowedRoles = getAllowedRolesForPath(pathname);
 if (!allowedRoles) return true;
 return canAccessByRole(role, allowedRoles, legacyPath);
}
