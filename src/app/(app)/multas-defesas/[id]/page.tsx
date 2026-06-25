'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { MULTAS_DEFESAS_LIST_LABEL } from '@/lib/multas-defesas-menu';

const MultaDefesaTramiteView = dynamic(
  () =>
    import('./multa-defesa-tramite-view').then((m) => ({
      default: m.MultaDefesaTramiteView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title={MULTAS_DEFESAS_LIST_LABEL} />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[480px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function MultaDefesaTramitePage() {
  return <MultaDefesaTramiteView />;
}
