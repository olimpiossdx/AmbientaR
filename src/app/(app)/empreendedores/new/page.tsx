'use client';

import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCadastroGestaoWriteGuard } from '@/hooks/use-cadastro-gestao-write-guard';

const EmpreendedorForm = dynamic(
  () => import('../empreendedor-form').then((m) => ({ default: m.EmpreendedorForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

function NewEmpreendedorPageContent() {
  const router = useRouter();
  const { blocked, isInitialized } = useCadastroGestaoWriteGuard('/empreendedores');

  const handleSuccess = () => {
    router.push('/empreendedores');
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Empreendedor" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Skeleton className="mx-auto h-96 max-w-4xl" />
        </main>
      </div>
    );
  }
  if (blocked) return null;
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Novo Empreendedor" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Empreendedor</CardTitle>
              <CardDescription>
                Preencha os detalhes para criar um novo empreendedor (cliente técnico).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmpreendedorForm
                currentItem={null}
                onSuccess={handleSuccess}
                onCancel={() => router.back()}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function NewEmpreendedorPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewEmpreendedorPageContent />
    </Suspense>
  );
}
