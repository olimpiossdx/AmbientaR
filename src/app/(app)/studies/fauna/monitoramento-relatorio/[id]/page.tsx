'use client';

import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFaunaStudyPageSave } from '../../_shared/use-fauna-study-page-save';

const RelatorioMonitoramentoForm = dynamic(
  () => import('../relatorio-form').then((m) => ({ default: m.RelatorioMonitoramentoForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

export default function EditMonitoramentoRelatorioFaunaPage({ params }: { params: { id: string } }) {
  const handleSave = useFaunaStudyPageSave('monitoramento_relatorio');

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar Relatório de Monitoramento de Fauna" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Formulário de Relatório Técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <RelatorioMonitoramentoForm documentId={params.id} onSave={handleSave} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
