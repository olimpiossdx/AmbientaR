'use client';

/**
 * Debug completo do menu Cadastro:
 * - Rotas consideradas "cadastro"
 * - Hook useCadastroMenuDebug() para logs e estado
 * - Componente CadastroMenuDebugPanel para painel no canto da tela (apenas em dev)
 */

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/firebase';
import { getNavDebugInfo, type NavDebugInfo } from '@/lib/nav-debug';
import { allNavItems } from '@/lib/navigation-config';
import type { NavItem, NavSubItem, UserRole } from '@/lib/types';

/** Rotas do menu Cadastro (subitens de allNavItems "Cadastro") */
export const CADASTRO_ROUTES = [
  '/empreendedores',
  '/projects',
  '/responsible-company',
] as const;

export function isCadastroRoute(pathname: string): boolean {
  const base = pathname.split('?')[0];
  return CADASTRO_ROUTES.some(
    (route) => base === route || base.startsWith(route + '/')
  );
}

/** Retorna o item "Cadastro" de allNavItems e os subitens filtrados por role */
export function getCadastroMenuForRole(userRole: UserRole): {
  item: NavItem | null;
  visibleSubItems: { label: string; href?: string; roles?: string[] }[];
} {
  const cadastroItem = allNavItems.find(
    (item): item is NavItem & { subItems: NonNullable<NavItem['subItems']> } =>
      item.label === 'Cadastro' && Array.isArray(item.subItems)
  ) ?? null;

  if (!cadastroItem) {
    return { item: null, visibleSubItems: [] };
  }

  const visibleSubItems: { label: string; href?: string; roles?: string[] }[] = [];

  function walk(items: NavSubItem[]) {
    for (const sub of items) {
      if (sub.roles && !sub.roles.includes(userRole)) continue;
      visibleSubItems.push({
        label: sub.label,
        href: 'href' in sub ? sub.href : undefined,
        roles: sub.roles,
      });
      if ('subItems' in sub && sub.subItems?.length) {
        walk(sub.subItems);
      }
    }
  }

  walk(cadastroItem.subItems);
  return { item: cadastroItem, visibleSubItems };
}

export type CadastroMenuDebugState = {
  pathname: string;
  isCadastroRoute: boolean;
  userRole: UserRole | null;
  userEmail: string | null;
  navDebug: NavDebugInfo;
  cadastroMenuVisibleCount: number;
  cadastroMenuHrefs: string[];
  timestamp: string;
};

export function useCadastroMenuDebug(): CadastroMenuDebugState {
  const pathname = usePathname();
  const { user } = useAuth();
  const navDebug = React.useMemo(() => getNavDebugInfo(pathname ?? ''), [pathname]);
  const isCadastro = isCadastroRoute(pathname ?? '');
  const { visibleSubItems } = getCadastroMenuForRole((user?.role ?? 'client') as UserRole);

  const state: CadastroMenuDebugState = {
    pathname: pathname ?? '',
    isCadastroRoute: isCadastro,
    userRole: (user?.role as UserRole) ?? null,
    userEmail: user?.email ?? null,
    navDebug,
    cadastroMenuVisibleCount: visibleSubItems.length,
    cadastroMenuHrefs: visibleSubItems.map((s) => s.href).filter(Boolean) as string[],
    timestamp: new Date().toISOString(),
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) return;
    console.groupCollapsed('[CadastroMenu Debug]', pathname);
    console.log('isCadastroRoute', state.isCadastroRoute);
    console.log('userRole', state.userRole);
    console.log('cadastroMenuVisibleCount', state.cadastroMenuVisibleCount);
    console.log('cadastroMenuHrefs', state.cadastroMenuHrefs);
    console.log('navDebug', state.navDebug);
    console.groupEnd();
  }, [pathname, state.isCadastroRoute, state.userRole, state.cadastroMenuVisibleCount, state.cadastroMenuHrefs, state.navDebug]);

  return state;
}

/** Painel fixo de debug (só em development e em rotas de cadastro) */
export function CadastroMenuDebugPanel() {
  const state = useCadastroMenuDebug();
  const [open, setOpen] = React.useState(false);

  if (process.env.NODE_ENV !== 'development') return null;
  if (!state.isCadastroRoute) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9998] font-mono text-xs">
      {open ? (
        <div className="bg-slate-900 text-cyan-300 border border-slate-700 rounded-lg p-3 shadow-xl max-w-sm max-h-[70vh] overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-cyan-400">Menu Cadastro – Debug</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              Fechar
            </button>
          </div>
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify(
              {
                pathname: state.pathname,
                userRole: state.userRole,
                userEmail: state.userEmail,
                cadastroMenuVisibleCount: state.cadastroMenuVisibleCount,
                cadastroMenuHrefs: state.cadastroMenuHrefs,
                navEncontrado: state.navDebug.encontrado,
                menuPrincipal: state.navDebug.menuPrincipal,
                breadcrumb: state.navDebug.breadcrumb,
              },
              null,
              2
            )}
          </pre>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-slate-800 text-cyan-400 border border-slate-600 rounded px-2 py-1 shadow"
          title="Abrir debug do menu Cadastro"
        >
          [Cadastro]
        </button>
      )}
    </div>
  );
}
