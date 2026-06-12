'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/** Intercept legado → rota canónica PIA. */
export default function IntervencaoAmbientalEditInterceptRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  useEffect(() => {
    if (id) router.replace(`/studies/pia/${id}/edit`);
    else router.replace('/studies/pia');
  }, [router, id]);

  return (
    <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Redirecionando para PIA…
    </div>
  );
}
