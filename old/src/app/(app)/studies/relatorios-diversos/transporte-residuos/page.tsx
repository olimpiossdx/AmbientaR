'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const TransporteResiduosView = dynamic(
  () =>
    import('./transporte-residuos-view').then((m) => ({
      default: m.TransporteResiduosView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Relatório de Transporte de Produtos/Resíduos Perigosos" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function TransporteResiduosPage() {
  return <TransporteResiduosView />;
}
