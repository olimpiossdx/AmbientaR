'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const FadMontarAcervoClient = dynamic(
  () => import('./fad-montar-acervo-client').then((m) => ({ default: m.FadMontarAcervoClient })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Montar acervo — Fiscal Ambiental Digital" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function FadMontarAcervoPage() {
  return <FadMontarAcervoClient />;
}
