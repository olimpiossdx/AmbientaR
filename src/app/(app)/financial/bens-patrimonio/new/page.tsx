'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PatrimonioForm } from '../patrimonio-form';

function NewBemPatrimonioContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Novo bem patrimonial" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar bem</CardTitle>
              <CardDescription>
                Preencha os dados de aquisição, contabilidade e depreciação conforme o plano de contas da empresa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatrimonioForm
                currentItem={null}
                onSuccess={() => router.push('/financial/bens-patrimonio')}
                onCancel={() => router.back()}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function NewBemPatrimonioPage() {
  return (
    <Suspense fallback={<div>Carregando…</div>}>
      <NewBemPatrimonioContent />
    </Suspense>
  );
}
