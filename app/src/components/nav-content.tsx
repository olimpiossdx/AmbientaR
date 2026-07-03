
'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SIDEBAR_WIDTH_USER_DRAG_KEY,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/firebase';
import type { NavItem, NavSubItem, UserRole } from '@/lib/types';
import { allNavItems } from '@/lib/navigation-config';
import { sortSidebarNavItems } from '@/lib/sort-pt-br';
import { canAccessNavItem } from '@/lib/role-guards';
import { getFinancialMenuForRole, isFinancialRoute } from '@/lib/financial-menu-debug';
import { getCadastroMenuForRole, isCadastroRoute } from '@/lib/cadastro-menu-debug';

/** Largura aproximada dos rótulos (incl. subitens fechados no DOM) para não subestimar a sidebar. */
function estimateMenuLabelsWidthPx(items: NavItem[], userRole: UserRole): number {
  if (typeof document === 'undefined') return 0;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  ctx.font = '14px system-ui, -apple-system, "Segoe UI", sans-serif';
  let max = 0;
  const walk = (list: (NavItem | NavSubItem)[], depth: number) => {
    for (const item of list) {
      if ('roles' in item && item.roles && !canAccessNavItem(userRole, item.roles)) continue;
      const indent = Math.min(depth * 28, 84);
      const chrome = 56;
      max = Math.max(max, ctx.measureText(item.label).width + indent + chrome);
      if ('subItems' in item && item.subItems?.length) {
        walk(item.subItems, depth + 1);
      }
    }
  };
  walk(items, 0);
  return Math.ceil(max);
}

function useLocationHash(): string {
  return React.useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const handler = () => onChange();
      window.addEventListener("hashchange", handler);
      window.addEventListener("popstate", handler);
      return () => {
        window.removeEventListener("hashchange", handler);
        window.removeEventListener("popstate", handler);
      };
    },
    () => (typeof window !== "undefined" ? window.location.hash : ""),
    () => "",
  );
}

function NavContentInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locationHash = useLocationHash();
  const { user } = useAuth();
  const [navItems, setNavItems] = React.useState<NavItem[]>([]);
  const { isMobile, open, setOpenMobile, setDesktopSidebarWidth } = useSidebar();
  const menuRef = React.useRef<HTMLUListElement | null>(null);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      const userRole = user.role;

      const filterItemsByRole = (items: (NavItem | NavSubItem)[]): any[] => {
          return items
            .filter(item => canAccessNavItem(userRole, item.roles, item.href))
            .map(item => {
              if ('subItems' in item && item.subItems) {
                  const filteredSubItems = filterItemsByRole(item.subItems);
                  if (filteredSubItems.length === 0 && !item.href) {
                      return null;
                  }
                  return { ...item, subItems: filteredSubItems };
              }
              return item;
          }).filter(item => item !== null);
      };
      
      setNavItems(sortSidebarNavItems(filterItemsByRole(allNavItems)));

      // Debug do menu Financeiro (apenas em development)
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        const { visibleSubItems } = getFinancialMenuForRole(userRole);
        const pathnameForLog = typeof window !== 'undefined' ? window.location.pathname : '';
        console.groupCollapsed('[NavContent] Menu Financeiro (filtrado por role)');
        console.log('userRole', userRole);
        console.log('pathname', pathnameForLog);
        console.log('isFinancialRoute', isFinancialRoute(pathnameForLog));
        console.log('Financeiro – subitens visíveis', visibleSubItems.length, visibleSubItems.map(s => ({ label: s.label, href: s.href })));
        console.groupEnd();

        const { visibleSubItems: cadastroSubItems } = getCadastroMenuForRole(userRole);
        console.groupCollapsed('[NavContent] Menu Cadastro (filtrado por role)');
        console.log('userRole', userRole);
        console.log('pathname', pathnameForLog);
        console.log('isCadastroRoute', isCadastroRoute(pathnameForLog));
        console.log('Cadastro – subitens visíveis', cadastroSubItems.length, cadastroSubItems.map(s => ({ label: s.label, href: s.href })));
        console.groupEnd();
      }
    }
  }, [user]);

  const isPathMatch = React.useCallback(
    (href?: string) => {
      if (!href) return false;
      if (href.startsWith("/external")) return false;
      if (href === "/") return (pathname ?? "") === "/";

      const [beforeQuery, queryPart] = href.split("?", 2);
      const hashIdx = beforeQuery.indexOf("#");
      const pathPart =
        hashIdx >= 0 ? beforeQuery.slice(0, hashIdx) : beforeQuery;
      const hashFromHref =
        hashIdx >= 0 ? beforeQuery.slice(hashIdx) : null;

      const pathMatches =
        (pathname ?? "") === pathPart ||
        (pathname ?? "").startsWith(`${pathPart}/`);
      if (!pathMatches) return false;
      if (hashFromHref && locationHash !== hashFromHref) return false;
      if (!queryPart) return true;

      const required = new URLSearchParams(queryPart);
      for (const [k, v] of required.entries()) {
        if (searchParams?.get(k) !== v) return false;
      }
      return true;
    },
    [pathname, searchParams, locationHash],
  );

  const hasActiveDescendant = React.useCallback(
    (subItems?: NavSubItem[]): boolean => {
      if (!subItems || subItems.length === 0) return false;
      return subItems.some(
        (subItem) => isPathMatch(subItem.href) || hasActiveDescendant(subItem.subItems),
      );
    },
    [isPathMatch],
  );

  /** Entre irmãos (ex.: `/crm` vs `/crm/clients`), só o prefixo mais longo deve ficar ativo — espelha a lógica de `route-access`. */
  const pickLongestActiveSubHref = React.useCallback(
    (items: NavSubItem[]): string | null => {
      const hrefs: string[] = [];
      const walk = (list: NavSubItem[]) => {
        for (const it of list) {
          if (it.href && !it.href.startsWith("/external")) hrefs.push(it.href);
          if (it.subItems?.length) walk(it.subItems);
        }
      };
      walk(items);
      let best: string | null = null;
      let bestLen = -1;
      for (const h of hrefs) {
        if (!isPathMatch(h)) continue;
        const score = h.length;
        if (score > bestLen) {
          bestLen = score;
          best = h;
        }
      }
      return best;
    },
    [isPathMatch],
  );

  function renderSubItems(subItems: NavSubItem[], pathname: string, userRole: UserRole) {
      const visible = subItems.filter(
        (subItem) => canAccessNavItem(userRole, subItem.roles),
      );
      const activeExclusiveHref = pickLongestActiveSubHref(visible);
      return visible
        .map((subItem) => {

        if (subItem.subItems && subItem.subItems.length > 0) {
          const visibleSubItems = renderSubItems(subItem.subItems, pathname, userRole);
          if (visibleSubItems.every(item => item === null)) {
              return null;
          }

          return (
            <SidebarMenuItem
              key={subItem.label}
              className="w-full"
            >
              <Collapsible defaultOpen={hasActiveDescendant(subItem.subItems)}>
                  <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="group">
                          {subItem.icon && <subItem.icon />}
                          <span>{subItem.label}</span>
                          <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                      </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      <SidebarMenuSub>
                          {visibleSubItems}
                      </SidebarMenuSub>
                  </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          );
        }
        
        const href = subItem.href || '#';
        const linkProps = subItem.external ? { href: href, target: "_blank", rel: "noopener noreferrer" } : { href: href };

        const isLeafActive =
          Boolean(subItem.href) &&
          activeExclusiveHref !== null &&
          subItem.href === activeExclusiveHref;

        return (
          <SidebarMenuSubButton key={`${href}-${subItem.label}`} asChild isActive={isLeafActive} onClick={handleLinkClick}>
             <Link {...linkProps}>
              {subItem.icon && <subItem.icon />}
              <span>{subItem.label}</span>
            </Link>
          </SidebarMenuSubButton>
        );
      }).filter(Boolean);
  }

  React.useEffect(() => {
    if (isMobile || !open) return;

    let cancelled = false;
    let debounceTimer: number | null = null;

    const measureAndApply = () => {
      if (cancelled) return;
      try {
        if (localStorage.getItem(SIDEBAR_WIDTH_USER_DRAG_KEY) === "1") return;
      } catch {
        /* ignore */
      }
      if (!menuRef.current) return;

      const horizontalPad = 32;
      const subMenuSlack = 48;
      const minW = 220;

      const fromTree =
        navItems.length && user
          ? estimateMenuLabelsWidthPx(navItems, user.role) + subMenuSlack
          : minW;
      const vwCap =
        typeof window !== "undefined"
          ? Math.min(400, Math.floor(window.innerWidth * 0.36))
          : 400;
      const nextWidth = Math.min(
        Math.max(fromTree + horizontalPad, minW),
        vwCap,
      );
      setDesktopSidebarWidth(nextWidth);
    };

    const schedule = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        requestAnimationFrame(() => {
          requestAnimationFrame(measureAndApply);
        });
      }, 40);
    };

    schedule();
    const delayed = window.setTimeout(schedule, 280);

    const resizeObserver = new ResizeObserver(() => schedule());
    if (menuRef.current) resizeObserver.observe(menuRef.current);

    const mutationObserver = new MutationObserver(() => schedule());
    if (menuRef.current) {
      mutationObserver.observe(menuRef.current, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-state', 'hidden', 'aria-hidden'],
      });
    }

    const onWinResize = () => schedule();
    window.addEventListener('resize', onWinResize);

    return () => {
      cancelled = true;
      clearTimeout(delayed);
      if (debounceTimer) clearTimeout(debounceTimer);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', onWinResize);
    };
  }, [
    isMobile,
    open,
    navItems,
    pathname,
    searchParams,
    setDesktopSidebarWidth,
    user,
  ]);

  return (
      <SidebarMenu ref={menuRef}>
        {navItems.map((item) => {
          return (
          <SidebarMenuItem key={item.label} className="w-full">
            {item.subItems && item.subItems.length > 0 ? (
              <Collapsible defaultOpen={hasActiveDescendant(item.subItems)}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="group">
                    <item.icon />
                    <span>{item.label}</span>
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {user && renderSubItems(item.subItems, pathname ?? "", user.role)}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ) : item.href ? (
              <SidebarMenuButton
                asChild
                isActive={isPathMatch(item.href)}
                tooltip={{
                  children: item.label,
                }}
                onClick={handleLinkClick}
              >
                <Link {...(item.href.startsWith('/external') ? { href: item.href } : { href: item.href })}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            ) : null}
          </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
  );
}

export default function NavContent() {
  return (
    <Suspense
      fallback={
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <span className="text-muted-foreground">Menu…</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      }
    >
      <NavContentInner />
    </Suspense>
  );
}
