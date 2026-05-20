'use client';

/**
 * Debug completo do menu Financeiro:
 * - Rotas consideradas "financeiras"
 * - Hook useFinancialMenuDebug() para logs e estado
 * - Componente FinancialMenuDebug para painel no canto da tela (apenas em dev)
 */

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/firebase';
import { getNavDebugInfo, type NavDebugInfo } from '@/lib/nav-debug';
import { allNavItems } from '@/lib/navigation-config';
import type { NavItem, NavSubItem, UserRole } from '@/lib/types';
import { canAccessNavItem } from '@/lib/role-guards';

/** Prefixos e rotas exatas do menu Financeiro (subitens de allNavItems "Financeiro") */
export const FINANCIAL_ROUTES = [
  '/clients',
  '/suppliers',
  '/invoices',
  '/proposals',
  '/commercial-proposals',
  '/contracts',
  '/contracts-suppliers',
  '/services',
  '/cash-flow',
  '/financial/dre-contabil',
  '/financial/abc-curve',
  '/bank-access',
] as const;

export function isFinancialRoute(pathname: string): boolean {
  const base = pathname.split('?')[0];
  return FINANCIAL_ROUTES.some(
    (route) => base === route || base.startsWith(route + '/')
  );
}

/** Retorna o item "Financeiro" de allNavItems e os subitens filtrados por role */
export function getFinancialMenuForRole(userRole: UserRole): { item: NavItem | null; visibleSubItems: { label: string; href?: string; roles?: string[] }[] } {
  const financialItem = allNavItems.find(
    (item): item is NavItem & { subItems: NonNullable<NavItem['subItems']> } =>
      item.label === 'Financeiro' && Array.isArray(item.subItems)
  ) ?? null;

  if (!financialItem) {
    return { item: null, visibleSubItems: [] };
  }

  const visibleSubItems: { label: string; href?: string; roles?: string[] }[] = [];

  function walk(items: NavSubItem[]) {
    for (const sub of items) {
      if (sub.roles && !canAccessNavItem(userRole, sub.roles)) continue;
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

  walk(financialItem.subItems);
  return { item: financialItem, visibleSubItems };
}

export type FinancialMenuDebugState = {
  pathname: string;
  isFinancialRoute: boolean;
  userRole: UserRole | null;
  userEmail: string | null;
  navDebug: NavDebugInfo;
  financialMenuVisibleCount: number;
  financialMenuHrefs: string[];
  timestamp: string;
};

export function useFinancialMenuDebug(): FinancialMenuDebugState {
  const pathname = usePathname();
  const { user } = useAuth();
  const navDebug = React.useMemo(() => getNavDebugInfo(pathname ?? ''), [pathname]);
  const isFinancial = isFinancialRoute(pathname ?? '');
  const { visibleSubItems } = getFinancialMenuForRole((user?.role ?? 'client') as UserRole);

  const state: FinancialMenuDebugState = {
    pathname: pathname ?? '',
    isFinancialRoute: isFinancial,
    userRole: (user?.role as UserRole) ?? null,
    userEmail: user?.email ?? null,
    navDebug,
    financialMenuVisibleCount: visibleSubItems.length,
    financialMenuHrefs: visibleSubItems.map(s => s.href).filter(Boolean) as string[],
    timestamp: new Date().toISOString(),
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) return;
    console.groupCollapsed('[FinancialMenu Debug]', pathname);
    console.log('isFinancialRoute', state.isFinancialRoute);
    console.log('userRole', state.userRole);
    console.log('financialMenuVisibleCount', state.financialMenuVisibleCount);
    console.log('financialMenuHrefs', state.financialMenuHrefs);
    console.log('navDebug', state.navDebug);
    console.groupEnd();
  }, [pathname, state.isFinancialRoute, state.userRole, state.financialMenuVisibleCount, state.financialMenuHrefs, state.navDebug]);

  return state;
}

/** Painel fixo de debug (só em development e em rotas financeiras) */
export function FinancialMenuDebugPanel() {
  const state = useFinancialMenuDebug();
  const [open, setOpen] = React.useState(false);

  if (process.env.NODE_ENV !== 'development') return null;
  if (!state.isFinancialRoute) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
      {open ? (
        <div className="bg-slate-900 text-green-400 border border-slate-700 rounded-lg p-3 shadow-xl max-w-sm max-h-[70vh] overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-amber-400">Menu Financeiro – Debug</span>
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
                financialMenuVisibleCount: state.financialMenuVisibleCount,
                financialMenuHrefs: state.financialMenuHrefs,
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
          className="bg-slate-800 text-amber-400 border border-slate-600 rounded px-2 py-1 shadow"
          title="Abrir debug do menu Financeiro"
        >
          [Financeiro]
        </button>
      )}
    </div>
  );
}
