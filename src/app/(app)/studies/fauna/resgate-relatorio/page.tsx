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

const RelatorioResgateForm = dynamic(
  () => import('./relatorio-form').then((m) => ({ default: m.RelatorioResgateForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

function ResgateRelatorioFaunaPageContent() {
  const searchParams = useSearchParams();
  const projetoId = searchParams?.get('projetoId') ?? null;
  const { firestore } = useFirebase();
  const handleSave = useFaunaStudyPageSave('resgate_relatorio');

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
      <PageHeader title="Relatório de Resgate de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Relatório Técnico</CardTitle>
            <CardDescription>
              Elabore o relatório de resgate e destinação de fauna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projetoId && isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <ProjetoVinculadoBanner study={seedStudy} />
                <RelatorioResgateForm seedStudy={seedStudy ?? null} onSave={wrappedSave} />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function ResgateRelatorioFaunaPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-muted-foreground">Carregando...</div>}
    >
      <ResgateRelatorioFaunaPageContent />
    </Suspense>
  );
}
