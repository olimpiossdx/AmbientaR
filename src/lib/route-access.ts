import type { NavItem, NavSubItem, UserRole } from '@/lib/types';
import { allNavItems } from '@/lib/navigation-config';

type FlatNavEntry = { href: string; roles?: UserRole[] };

/** Prefixos que o perfil `cliente_autonomo` não pode aceder (IA + processos). */
const PATH_PREFIXES_DENIED_FOR_CLIENTE_AUTONOMO: readonly string[] = [
  '/ai-lab',
  '/studies/assistant',
  '/analise-ambiental',
  '/studies/analise-socioambiental',
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

