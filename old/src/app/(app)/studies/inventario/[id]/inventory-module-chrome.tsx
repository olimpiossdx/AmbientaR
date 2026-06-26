'use client';

import * as React from 'react';
import { ExternalLink } from 'lucide-react';
import { MATA_NATIVA_LINKS } from './mata-nativa-links';
import { cn } from '@/lib/utils';

export function InventoryModuleHeader({
  projectName,
  section,
  children,
  className,
}: {
  projectName: string | undefined;
  section: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const name = projectName?.trim() || '…';
  return (
    <header
      className={cn(
        'flex min-h-14 flex-wrap items-start justify-between gap-3 border-b bg-background px-4 py-3 md:px-6',
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="truncate text-lg font-semibold md:text-xl">
          <span className="text-primary">{name}</span>
          <span className="font-normal text-muted-foreground"> › {section}</span>
        </h1>
        <InventoryHelpStrip className="text-xs" />
      </div>
      {children ? <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}

export function InventoryHelpStrip({ className }: { className?: string }) {
  const items = [
    { href: MATA_NATIVA_LINKS.tutoriais, label: 'Tutoriais' },
    { href: MATA_NATIVA_LINKS.cursoProcessamento, label: 'Curso (vídeo)' },
    { href: MATA_NATIVA_LINKS.universidade, label: 'Universidade' },
    { href: MATA_NATIVA_LINKS.youtubeSearch, label: 'Vídeos no YouTube' },
  ] as const;
  return (
    <nav className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground', className)} aria-label="Ajuda Mata Nativa">
      <span className="text-foreground/80">Referência:</span>
      {items.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 underline-offset-2 hover:text-primary hover:underline"
        >
          {label}
          <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
        </a>
      ))}
    </nav>
  );
}

/** Barra de ações tipo Mata Nativa: inserir (verde), excluir (vermelho contorno), resto outline. */
export function inventoryActionButtonClass(role: 'insert' | 'delete' | 'neutral') {
  if (role === 'insert') {
    return 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm';
  }
  if (role === 'delete') {
    return 'border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30';
  }
  return '';
}
