'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/** Intercept legado → rota canónica PIA. */
export default function IntervencaoAmbientalNewInterceptRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams?.toString() ?? '';
    router.replace(q ? `/studies/pia/new?${q}` : '/studies/pia/new');
  }, [router, searchParams]);

  return (
    <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Redirecionando para PIA…
    </div>
  );
}
