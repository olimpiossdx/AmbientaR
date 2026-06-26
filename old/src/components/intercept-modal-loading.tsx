'use client';

import { Skeleton } from '@/components/ui/skeleton';

/** Fallback mínimo para shells `(.)` — evita importar *-form-shell no First Load JS. */
export function InterceptModalLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
      aria-busy="true"
      aria-label="Carregando formulário"
    >
      <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg sm:max-w-2xl">
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    </div>
  );
}
