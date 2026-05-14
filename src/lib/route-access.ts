import type { NavItem, NavSubItem, UserRole } from '@/lib/types';
import { allNavItems } from '@/lib/navigation-config';

type FlatNavEntry = { href: string; roles?: UserRole[] };

/** Prefixos que o perfil `cliente_autonomo` não pode aceder (IA, elaboração de estudos, processos). */
const PATH_PREFIXES_DENIED_FOR_CLIENTE_AUTONOMO: readonly string[] = [
  '/ai-lab',
  '/studies',
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

function normalizePathname(pathname: string): string {
  // Garante que `/foo?x=1` seja tratado como `/foo`.
  const idx = pathname.indexOf('?');
  return idx >= 0 ? pathname.slice(0, idx) : pathname;
}

function matchHrefToPath(href: string, pathname: string): boolean {
  const path = normalizePathname(pathname);
  const base = normalizePathname(href);
  if (base === '/') return path === '/';
  return path === base || path.startsWith(`${base}/`);
}

export function getAllowedRolesForPath(pathname: string): UserRole[] | null {
  const path = normalizePathname(pathname);

  // Escolhe o match mais específico (maior prefixo).
  let best: FlatNavEntry | null = null;
  for (const entry of flatNav) {
    if (!matchHrefToPath(entry.href, path)) continue;
    if (!best || normalizePathname(entry.href).length > normalizePathname(best.href).length) {
      best = entry;
    }
  }

  // Se a rota não está mapeada no menu, não bloqueia (evita quebrar rotas internas/dinâmicas).
  if (!best) return null;

  // Se não tem roles definidas, considera liberado.
  if (!best.roles || best.roles.length === 0) return null;

  return best.roles;
}

export function isRoleAllowedForPath(role: UserRole, pathname: string): boolean {
  if (role === 'admin') return true;
  const path = normalizePathname(pathname);
  if (role === 'cliente_autonomo') {
    for (const prefix of PATH_PREFIXES_DENIED_FOR_CLIENTE_AUTONOMO) {
      if (pathMatchesIaDeniedPrefix(path, prefix)) return false;
    }
  }
  const allowed = getAllowedRolesForPath(pathname);
  if (!allowed) return true;
  return allowed.includes(role);
}

/**
 * Rotas do menu "Autorizações/Relatórios" (espelha `navigation-config`).
 * Ordem = preferência do atalho mobile (primeiro path a que o papel tem acesso).
 */
export const AUTORIZACOES_RELATORIOS_MOBILE_HREF_ORDER = [
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

export function isAutorizacoesRelatoriosNavPath(pathname: string): boolean {
  const p = normalizePathname(pathname);
  for (const base of AUTORIZACOES_RELATORIOS_MOBILE_HREF_ORDER) {
    const b = normalizePathname(base);
    if (p === b || p.startsWith(`${b}/`)) return true;
  }
  return false;
}

/** Primeiro destino do grupo a que o papel pode aceder (atalho mobile). */
export function getFirstAutorizacoesRelatoriosHrefForRole(role: UserRole): string | null {
  for (const href of AUTORIZACOES_RELATORIOS_MOBILE_HREF_ORDER) {
    if (isRoleAllowedForPath(role, href)) return href;
  }
  return null;
}

