'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarragemForm } from '../barragem-form';

function NewBarragemPageContent() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Novo Projeto Técnico de Barragem" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <Card>
            <CardHeader>
              <CardTitle>Memorial descritivo</CardTitle>
              <CardDescription>
                Estrutura alinhada ao modelo FPT (apresentação, informações básicas, aterro,
                hidrologia, extravasor, implantação e anexos). Exporte em PDF ou Word com a
                identidade visual da consultoria.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[480px]">
              <BarragemForm currentItem={null} onSuccess={() => router.push('/studies/barragem')} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function NewBarragemPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewBarragemPageContent />
    </Suspense>
  );
}
