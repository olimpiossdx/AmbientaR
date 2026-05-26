'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CavidadesForm } from '../cavidades-form';

function NewCavidadesPageContent() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Novo estudo de cavidades" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <Card>
            <CardHeader>
              <CardTitle>Licenciamento espeleológico — MG</CardTitle>
              <CardDescription>
                Fluxo alinhado à IS SISEMA 08/2017 e DN COPAM 217/2017. Consulte{' '}
                <code className="text-xs">docs/ESTUDO-CAVIDADES-MG.md</code> para referências
                oficiais.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[480px]">
              <CavidadesForm
                currentItem={null}
                onCreated={(id) => router.push(`/studies/cavidades/${id}/edit`)}
                onCancel={() => router.push('/studies/cavidades')}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function NewCavidadesPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewCavidadesPageContent />
    </Suspense>
  );
}
