'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { GESTAO_PROCESSOS_MENU_LABEL } from '@/lib/gestao-processos-menu';

const GestaoProcessosPlanilhaView = dynamic(
  () =>
    import('./gestao-processos-planilha-view').then((m) => ({
      default: m.GestaoProcessosPlanilhaView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Geral"
          description={`${GESTAO_PROCESSOS_MENU_LABEL} — acompanhamento e ferramentas operacionais.`}
        />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function GestaoProcessosPlanilhaPage() {
  return <GestaoProcessosPlanilhaView />;
}
