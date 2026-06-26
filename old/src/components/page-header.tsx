"use client";

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  /**
   * Mostra seta para voltar ao dashboard ("/").
   * Quando não informado, ativa automaticamente fora da home.
   */
  showBackToDashboard?: boolean;
};

export function PageHeader({
  title,
  description,
  children,
  showBackToDashboard,
}: PageHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const shouldShowBack = showBackToDashboard ?? (pathname !== '/');

  return (
    <header className="flex min-w-0 flex-col gap-3 border-b bg-muted/20 px-4 py-3 min-h-16 md:px-6 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        {shouldShowBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpenMobile(false);
              router.replace('/');
            }}
            aria-label="Voltar para o painel"
            title="Voltar para o painel"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-balance text-lg font-semibold md:text-xl">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto sm:w-auto sm:shrink-0 sm:justify-end sm:overflow-visible">
          {children}
        </div>
      )}
    </header>
  );
}
