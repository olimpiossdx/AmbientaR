'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const AbcCurveView = dynamic(
  () => import('./abc-curve-view').then((m) => ({ default: m.AbcCurveView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Análise da Curva ABC de Clientes" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function AbcCurvePage() {
  return <AbcCurveView />;
}
