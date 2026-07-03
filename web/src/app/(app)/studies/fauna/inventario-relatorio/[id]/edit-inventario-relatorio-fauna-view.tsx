'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFaunaStudyPageSave } from '../../_shared/use-fauna-study-page-save';

const RelatorioInventarioForm = dynamic(
  () => import('../relatorio-form').then((m) => ({ default: m.RelatorioInventarioForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

export function EditInventarioRelatorioFaunaView() {
  const params = useParams();
  const studyId = (params?.id as string | undefined) ?? '';
  const handleSave = useFaunaStudyPageSave('inventario_relatorio');

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar Relatório de Inventário de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Relatório Técnico</CardTitle>
            <CardDescription>Atualize o relatório de inventário de fauna.</CardDescription>
          </CardHeader>
          <CardContent>
            <RelatorioInventarioForm documentId={studyId} onSave={handleSave} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
