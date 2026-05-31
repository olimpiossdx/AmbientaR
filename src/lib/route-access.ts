import type { NavItem, NavSubItem, UserRole } from '@/lib/types';
import { isAdminRole, isConsultorRepresentante } from '@/lib/role-guards';
import { canConsultorAccessNavItem } from '@/lib/consultor-nav-access';
import { allNavItems } from '@/lib/navigation-config';

type FlatNavEntry = { href: string; roles?: UserRole[] };

/** Todas as roles que utilizam a app autenticada. */
const ALL_APP_ROLES: UserRole[] = [
  'admin',
  'client',
  'cliente_autonomo',
  'representative',
  'consultor_representante',
  'technical',
  'sales',
  'financial',
  'gestor',
  'supervisor',
  'diretor_fauna',
  'advogado',
];

/** Criar/editar ofícios (lista continua acessível a clientes titulares). */
const OFICIOS_WRITE_ROLES: UserRole[] = [
  'admin',
  'technical',
  'sales',
  'financial',
  'gestor',
  'supervisor',
  'diretor_fauna',
  'advogado',
];

/** Prefixos que o perfil `cliente_autonomo` não pode aceder (IA, estudos técnicos, licenciamento). */
const PATH_PREFIXES_DENIED_FOR_CLIENTE_AUTONOMO: readonly string[] = [
  '/ai-lab',
  '/studies',
  '/georeferenciamento',
  '/analise-ambiental',
  '/requests',
];

function pathMatchesIaDeniedPrefix(path: string, prefix: string): boolean {
  if (path === prefix) return true;
  return path.startsWith(`${prefix}/`);
}

function flattenNav(items: (NavItem | NavSubItem)[], out: FlatNavEntry[] = []): FlatNavEntry[] {
  for (const item of items) {
    if (item.href) out.push({ href: item.href, roles: item.roles });
    if ('subItems' in item && item.subItems?.length) flattenNav(item.subItems, out);
  }
  return out;
}

const flatNav = flattenNav(allNavItems);

/** Parâmetros de rota (ex.: `useSearchParams()` no layout). */
export type RouteSearchParams = Pick<URLSearchParams, 'get'> | null | undefined;

function normalizePathname(pathname: string): string {
  // Garante que `/foo?x=1` e `/foo#hash` sejam tratados como `/foo`.
  let path = pathname;
  const qIdx = path.indexOf('?');
  if (qIdx >= 0) path = path.slice(0, qIdx);
  const hIdx = path.indexOf('#');
  if (hIdx >= 0) path = path.slice(0, hIdx);
  return path;
}

function normalizeNavHref(href: string): string {
  return normalizePathname(href);
}

/** Redirecionamentos legados: mesma política de acesso que a rota canónica. */
const LEGACY_PATH_ROLE_ALIASES: Record<string, string> = {
  '/autos-infracao-defesa': '/multas-defesas',
  '/environmental-company': '/responsible-company',
  '/monitoring': '/monitoring/manual',
  '/studies': '/studies/educacao-ambiental',
  '/studies/intervencao-ambiental': '/studies/pia',
};

/** Rotas com política explícita (prioridade sobre o menu). */
function getManualAllowedRoles(path: string): UserRole[] | null {
  if (path === '/settings/appearance') return ALL_APP_ROLES;
  if (path === '/settings') return ['admin'];
  if (path === '/carteira' || path.startsWith('/carteira/')) {
    return ['admin', 'consultor_representante', 'client', 'cliente_autonomo'];
  }
  if (path === '/oficios/new' || /\/oficios\/[^/]+\/edit$/.test(path)) {
    return OFICIOS_WRITE_ROLES;
  }
  const alias = LEGACY_PATH_ROLE_ALIASES[path];
  if (alias) {
    return getAllowedRolesForPath(alias);
  }
  return null;
}

function matchHrefToPath(href: string, pathname: string): boolean {
  const path = normalizePathname(pathname);
  const base = normalizeNavHref(href);
  if (base === '/') return path === '/';
  return path === base || path.startsWith(`${base}/`);
}

function getUrlFromNavHref(href: string): string | null {
  const qIdx = href.indexOf('?');
  if (qIdx < 0) return null;
  const url = new URLSearchParams(href.slice(qIdx + 1)).get('url');
  return url?.trim() ? url : null;
}

function getUrlFromRouteSearchParams(searchParams?: RouteSearchParams): string | null {
  if (!searchParams) return null;
  const url = searchParams.get('url');
  return url?.trim() ? url : null;
}

/** Compara destinos `/external?url=…` de forma estável (barra final, etc.). */
function externalUrlsEqual(a: string, b: string): boolean {
  const normalize = (raw: string): string => {
    try {
      const parsed = new URL(raw);
      let path = parsed.pathname;
      if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
      return `${parsed.origin}${path}${parsed.search}${parsed.hash}`;
    } catch {
      return raw.trim();
    }
  };
  return normalize(a) === normalize(b);
}

function externalNavEntries(): FlatNavEntry[] {
  return flatNav.filter((e) => normalizePathname(e.href) === '/external');
}

function unionRolesFromEntries(entries: FlatNavEntry[]): UserRole[] | null {
  const roles = new Set<UserRole>();
  for (const entry of entries) {
    for (const role of entry.roles ?? []) roles.add(role);
  }
  return roles.size > 0 ? [...roles] : null;
}

function getAllowedRolesForExternal(searchParams?: RouteSearchParams): UserRole[] | null {
  const entries = externalNavEntries();
  if (entries.length === 0) return null;

  const targetUrl = getUrlFromRouteSearchParams(searchParams);
  if (!targetUrl) return unionRolesFromEntries(entries);

  const matched = entries.filter((entry) => {
    const entryUrl = getUrlFromNavHref(entry.href);
    return entryUrl != null && externalUrlsEqual(entryUrl, targetUrl);
  });

  if (matched.length === 1) {
    const roles = matched[0].roles;
    return roles?.length ? roles : null;
  }
  if (matched.length > 1) return unionRolesFromEntries(matched);

  // `url` presente mas sem entrada exata no menu: união (evita falso negativo).
  return unionRolesFromEntries(entries);
}

export function getAllowedRolesForPath(
  pathname: string,
  searchParams?: RouteSearchParams,
): UserRole[] | null {
  const path = normalizePathname(pathname);

  const manual = getManualAllowedRoles(path);
  if (manual) return manual;

  if (path === '/external') {
    return getAllowedRolesForExternal(searchParams);
  }

  // Escolhe o match mais específico (maior prefixo). Ignora `/external?…` (tratado acima).
  let best: FlatNavEntry | null = null;
  for (const entry of flatNav) {
    if (normalizeNavHref(entry.href) === '/external') continue;
    if (!matchHrefToPath(entry.href, path)) continue;
    if (!best || normalizeNavHref(entry.href).length > normalizeNavHref(best.href).length) {
      best = entry;
    }
  }

  // Se a rota não está mapeada no menu, não bloqueia (evita quebrar rotas internas/dinâmicas).
  if (!best) return null;

  // Se não tem roles definidas, considera liberado.
  if (!best.roles || best.roles.length === 0) return null;

  return best.roles;
}

export function isRoleAllowedForPath(
  role: UserRole,
  pathname: string,
  searchParams?: RouteSearchParams,
): boolean {
  if (isAdminRole(role)) return true;
  const path = normalizePathname(pathname);
  if (role === 'cliente_autonomo') {
    for (const prefix of PATH_PREFIXES_DENIED_FOR_CLIENTE_AUTONOMO) {
      if (pathMatchesIaDeniedPrefix(path, prefix)) return false;
    }
  }
  const allowed = getAllowedRolesForPath(pathname, searchParams);
  if (allowed === null) return true;
  if (isConsultorRepresentante(role)) {
    return canConsultorAccessNavItem(allowed, path);
  }
  return allowed.includes(role);
}

/**
 * Rotas do menu "Documentos Ambientais" (espelha `navigation-config`).
 * Ordem = preferência do atalho mobile (primeiro path a que o papel tem acesso).
 */
export const DOCUMENTOS_AMBIENTAIS_MOBILE_HREF_ORDER = [
  '/documentos-ambientais/pasta-cliente',
  '/licenses',
  '/outorgas',
  '/usos-insignificantes',
  '/intervencoes',
  '/compliance',
  '/car',
  '/monitoring/manual',
  '/monitoring/telemetric',
  '/fauna',
  '/inspections/reports',
] as const;

export function isDocumentosAmbientaisNavPath(pathname: string): boolean {
  const p = normalizePathname(pathname);
  for (const base of DOCUMENTOS_AMBIENTAIS_MOBILE_HREF_ORDER) {
    const b = normalizePathname(base);
    if (p === b || p.startsWith(`${b}/`)) return true;
  }
  return false;
}

/** Primeiro destino do grupo a que o papel pode aceder (atalho mobile). */
export function getFirstDocumentosAmbientaisHrefForRole(role: UserRole): string | null {
  for (const href of DOCUMENTOS_AMBIENTAIS_MOBILE_HREF_ORDER) {
    if (isRoleAllowedForPath(role, href)) return href;
  }
  return null;
}

