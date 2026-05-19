'use client';

import * as React from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Trees,
  Leaf,
  Sprout,
  Sigma,
  Calculator,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { InventoryProject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function normalizePath(p: string) {
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
  return p;
}

function isNavActive(pathname: string, href: string) {
  return normalizePath(pathname) === normalizePath(href);
}

export default function InventoryProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const projectId = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();

  const projectDocRef = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'inventories', projectId);
  }, [firestore, projectId]);

  const { data: project, isLoading: projectLoading } = useDoc<InventoryProject>(projectDocRef);

  const menuItems = [
    { label: 'Projeto', shortLabel: 'Projeto', icon: FileText, href: `/studies/inventario/${projectId}` },
    { label: 'Espécies', shortLabel: 'Espécies', icon: Leaf, href: `/studies/inventario/${projectId}/especies` },
    { label: 'Parcelas', shortLabel: 'Parc.', icon: Trees, href: `/studies/inventario/${projectId}/parcelas` },
    { label: 'Árvores', shortLabel: 'Árvores', icon: Sprout, href: `/studies/inventario/${projectId}/arvores` },
    { label: 'Fórmulas', shortLabel: 'Fórm.', icon: Sigma, href: `/studies/inventario/${projectId}/formulas` },
    { label: 'Calculadora', shortLabel: 'Calc.', icon: Calculator, href: `/studies/inventario/${projectId}/calculadora` },
  ] as const;

  const renderNavButton = (compact: boolean) =>
    menuItems.map((item) => {
      const active = isNavActive(pathname ?? '', item.href);
      const Icon = item.icon;
      return (
        <Button
          key={item.href}
          variant={active ? 'secondary' : 'ghost'}
          size={compact ? 'sm' : 'default'}
          className={cn(
            'justify-start shrink-0',
            compact && 'h-9 px-3',
            compact && active && 'bg-secondary',
          )}
          asChild
        >
          <Link href={item.href} aria-current={active ? 'page' : undefined} title={item.label}>
            <Icon className="mr-2 h-4 w-4 shrink-0" />
            <span className={cn(compact && 'max-w-[5.5rem] truncate')}>
              {compact ? item.shortLabel : item.label}
            </span>
          </Link>
        </Button>
      );
    });

  return (
    <div className="flex w-full min-h-0 flex-1 flex-col bg-muted/40 md:flex-row">
      {/* Mobile: submenu horizontal (sidebar principal já existe na app) */}
      <div className="flex md:hidden flex-col border-b bg-background">
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            aria-label="Voltar à lista de inventários"
            onClick={() => router.push('/studies/inventario')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            {projectLoading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <p className="truncate text-sm font-medium" title={project?.nome}>
                {project?.nome ?? 'Inventário'}
              </p>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 py-2" aria-label="Secções do inventário florestal">
          {renderNavButton(true)}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-background shrink-0">
        <div className="p-4 border-b space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/studies/inventario')}>
            <ChevronLeft className="mr-2 h-4 w-4 shrink-0" />
            Fechar projeto
          </Button>
          {projectLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Projeto</p>
              <p className="text-sm font-semibold leading-tight break-words" title={project?.nome}>
                {project?.nome ?? '—'}
              </p>
            </div>
          )}
        </div>
        <nav className="flex flex-col gap-1 p-4 overflow-y-auto" aria-label="Secções do inventário florestal">
          {renderNavButton(false)}
        </nav>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
