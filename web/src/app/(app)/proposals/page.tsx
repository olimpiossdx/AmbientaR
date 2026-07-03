'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * URL legada `/proposals` → módulo unificado em Propostas Comerciais.
 */
function ProposalsRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams?.toString() ?? '';
    router.replace(q ? `/commercial-proposals?${q}` : '/commercial-proposals');
  }, [router, searchParams]);

  return (
    <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Redirecionando para Propostas Comerciais…
    </div>
  );
}

export default function ProposalsRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando…
        </div>
      }
    >
      <ProposalsRedirectContent />
    </Suspense>
  );
}
