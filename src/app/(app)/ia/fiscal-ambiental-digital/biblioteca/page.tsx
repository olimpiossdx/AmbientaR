'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const FadBibliotecaClient = dynamic(
  () =>
    import('@/components/fiscal-ambiental/fad-biblioteca-client').then((m) => ({
      default: m.FadBibliotecaClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Biblioteca — Fiscal Ambiental Digital" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function FadBibliotecaPage() {
  return <FadBibliotecaClient />;
}
