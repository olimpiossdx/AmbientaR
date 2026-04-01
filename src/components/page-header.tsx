"use client";

import * as React from 'react';
import { usePathname } from 'next/navigation';
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
  const { setOpenMobile } = useSidebar();
  const shouldShowBack = showBackToDashboard ?? (pathname !== '/');

  return (
    <header className="flex items-center gap-4 border-b bg-muted/20 px-4 md:px-6 min-h-16 py-3">
      {shouldShowBack && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => {
            // Retorno "hard" para resetar estado de navegação mobile e evitar
            // a sidebar abrindo junto ao voltar para o dashboard.
            setOpenMobile(false);
            if (typeof window !== 'undefined') {
              // Evita toque residual abrindo o gesto lateral no dashboard.
              sessionStorage.setItem(
                "suppressMobileSidebarGestureUntil",
                String(Date.now() + 1800),
              );
              window.location.assign('/');
            }
          }}
          aria-label="Voltar para o painel"
          title="Voltar para o painel"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </header>
  );
}
