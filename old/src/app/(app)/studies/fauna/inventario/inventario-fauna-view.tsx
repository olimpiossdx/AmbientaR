'use client';

import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFaunaStudyPageSave } from '../_shared/use-fauna-study-page-save';

const InventarioFaunaForm = dynamic(
  () => import('./inventario-form').then((m) => ({ default: m.InventarioFaunaForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

export function InventarioFaunaView() {
  const handleSave = useFaunaStudyPageSave('inventario_projeto');

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Inventário de Fauna Silvestre Terrestre" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Projeto Técnico</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para gerar o projeto técnico para autorização de manejo de
              fauna.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InventarioFaunaForm currentItem={null} onSave={handleSave} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
