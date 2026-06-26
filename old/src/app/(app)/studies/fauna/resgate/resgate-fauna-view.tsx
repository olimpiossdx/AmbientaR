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
import { Skeleton } from '@/components/ui/skeleton';
import { useFaunaStudyPageSave } from '../_shared/use-fauna-study-page-save';

const ResgateForm = dynamic(
  () => import('./resgate-form').then((m) => ({ default: m.ResgateForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

export function ResgateFaunaView() {
  const handleSave = useFaunaStudyPageSave('resgate_projeto');

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Projeto de Resgate e Destinação de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Projeto Técnico</CardTitle>
            <CardDescription>
              Preencha os campos para gerar o projeto de resgate e destinação de fauna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResgateForm onSave={handleSave} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
