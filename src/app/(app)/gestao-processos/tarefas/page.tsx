'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const GestaoProcessosTarefasView = dynamic(
  () =>
    import('@/components/gestao-processos/gestao-processos-tarefas-view').then((m) => ({
      default: m.GestaoProcessosTarefasView,
    })),
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

export default function GestaoProcessosTarefasPage() {
  return <GestaoProcessosTarefasView />;
}
