'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcuracaoForm } from '../procuracao-form';

export default function NewProcuracaoPage() {
  const router = useRouter();
  const handleSuccess = () => router.push('/studies/procuracao');

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Nova procuração" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>Procuração de representação</CardTitle>
            <CardDescription>
              Mandato do empreendedor (outorgante) à consultoria (outorgada) para atos
              perante órgãos ambientais, vinculado ao(s) empreendimento(s) selecionado(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProcuracaoForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
