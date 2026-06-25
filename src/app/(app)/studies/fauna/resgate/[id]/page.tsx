'use client';

import dynamic from 'next/dynamic';
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
import { useFaunaStudyPageSave } from '../../_shared/use-fauna-study-page-save';

const ResgateForm = dynamic(
  () => import('../resgate-form').then((m) => ({ default: m.ResgateForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

export default function EditResgateFaunaPage({ params }: { params: { id: string } }) {
  const { firestore } = useFirebase();
  const handleSave = useFaunaStudyPageSave('resgate_projeto');

  const studyRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'faunaStudies', params.id) : null),
    [firestore, params.id],
  );
  const { data: study, isLoading } = useDoc<FaunaStudy>(studyRef);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar Projeto de Resgate de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Projeto Técnico</CardTitle>
            <CardDescription>
              Atualize o projeto de resgate e destinação de fauna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : study ? (
              <ResgateForm currentItem={{ ...study, id: params.id }} onSave={handleSave} />
            ) : (
              <p className="text-sm text-muted-foreground">Estudo não encontrado.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
