'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const FadRelatoriosClient = dynamic(
  () =>
    import('@/components/fiscal-ambiental/fad-relatorios-client').then((m) => ({
      default: m.FadRelatoriosClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Relatórios — Fiscal Ambiental Digital" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function FadRelatoriosPage() {
  return <FadRelatoriosClient />;
}
