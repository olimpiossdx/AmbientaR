'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { FaunaStudy } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useFaunaStudyPageSave } from '../_shared/use-fauna-study-page-save';
import { ProjetoVinculadoBanner } from '../_shared/projeto-vinculado-banner';

const RelatorioMonitoramentoForm = dynamic(
  () => import('./relatorio-form').then((m) => ({ default: m.RelatorioMonitoramentoForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

function MonitoramentoRelatorioFaunaPageContent() {
  const searchParams = useSearchParams();
  const projetoId = searchParams?.get('projetoId') ?? null;
  const { firestore } = useFirebase();
  const handleSave = useFaunaStudyPageSave('monitoramento_relatorio');

  const projetoRef = useMemoFirebase(
    () => (firestore && projetoId ? doc(firestore, 'faunaStudies', projetoId) : null),
    [firestore, projetoId],
  );
  const { data: seedStudy, isLoading } = useDoc<FaunaStudy>(projetoRef);

  const wrappedSave = async (
    data: Record<string, unknown> & { id?: string },
    status: 'draft' | 'completed',
  ) => {
    const base = seedStudy
      ? {
          empreendedorId: seedStudy.empreendedorId,
          projectId: seedStudy.projectId,
          consultoriaId: seedStudy.consultoriaId,
        }
      : {};
    await handleSave({ ...base, ...data }, status);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Relatório de Monitoramento de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Relatório Técnico</CardTitle>
            <CardDescription>Elabore o relatório de monitoramento de fauna.</CardDescription>
          </CardHeader>
          <CardContent>
            {projetoId && isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <ProjetoVinculadoBanner study={seedStudy} />
                <RelatorioMonitoramentoForm seedStudy={seedStudy ?? null} onSave={wrappedSave} />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function MonitoramentoRelatorioFaunaPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-muted-foreground">Carregando...</div>}
    >
      <MonitoramentoRelatorioFaunaPageContent />
    </Suspense>
  );
}
