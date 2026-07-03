'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const GestaoProcessosIndicadoresAnaliseView = dynamic(
  () =>
    import('@/components/gestao-processos/gestao-processos-indicadores-analise-view').then(
      (m) => ({ default: m.GestaoProcessosIndicadoresAnaliseView }),
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    ),
  },
);

export default function GestaoProcessosIndicadoresAnalisePage() {
  return <GestaoProcessosIndicadoresAnaliseView />;
}
