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

const InventarioFaunaForm = dynamic(
  () => import('../inventario-form').then((m) => ({ default: m.InventarioFaunaForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

export default function EditInventarioFaunaPage({ params }: { params: { id: string } }) {
  const { firestore } = useFirebase();
  const handleSave = useFaunaStudyPageSave('inventario_projeto');

  const studyRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'faunaStudies', params.id) : null),
    [firestore, params.id],
  );
  const { data: study, isLoading } = useDoc<FaunaStudy>(studyRef);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar Projeto de Inventário de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Projeto Técnico</CardTitle>
            <CardDescription>
              Atualize o projeto de inventário de fauna silvestre terrestre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : study ? (
              <InventarioFaunaForm
                currentItem={{ ...study, id: params.id }}
                onSave={handleSave}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Estudo não encontrado.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
