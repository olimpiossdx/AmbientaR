import type { ReactNode } from 'react';

import { AuthHeroPanel } from './auth-hero-panel';
import { AmbientaRLogo } from './ambientar-logo';
import { cn } from '../utils/utils';

type PublicAuthLayoutProps = {
  children: ReactNode;
  /** Coluna do formulário mais larga (cadastro multi-step). */
  wide?: boolean;
  /** Alinha conteúdo ao topo (fluxos longos como cadastro). */
  alignTop?: boolean;
  className?: string;
};

export function PublicAuthLayout({ children, wide = false, alignTop = false, className }: PublicAuthLayoutProps) {
  return (<div
      className={cn(
        'grid min-h-screen bg-emerald-50/40 dark:bg-background',
        wide
          ? 'lg:grid-cols-[1fr_min(720px,52%)]'
          : 'lg:grid-cols-[1fr_min(480px,45%)]',
      )}
    >
      <AuthHeroPanel />

      <div className="flex min-h-screen flex-col overflow-y-auto">
        <div
          className={cn(
            'mx-auto flex w-full flex-1 flex-col px-4 py-8 sm:px-6',
            wide ? 'max-w-2xl' : 'max-w-110',
            className,
          )}
        >
          <div className="mb-6 flex justify-center lg:hidden">
            <AmbientaRLogo size="sm" showWordmark href="/" />
          </div>

          <div
            className={cn(
              'flex flex-1 flex-col animate-fade-in-up',
              alignTop ? 'justify-start pt-2' : 'justify-center',
            )}
          >
            {children}
          </div>

          <p className="mt-8 shrink-0 pb-2 text-center text-xs text-muted-foreground">
            Desenvolvido por Barros e Sá Investimentos
          </p>
        </div>
      </div>
    </div>);
}
