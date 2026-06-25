'use client';

import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ProposalForm = dynamic(
  () => import('../proposal-form').then((m) => ({ default: m.ProposalForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
);

function NewProposalPageContent() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/commercial-proposals');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Nova Proposta Comercial" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nova Proposta Comercial</CardTitle>
              <CardDescription>
                Preencha os detalhes para criar uma nova proposta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProposalForm
                currentItem={null}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewProposalPageContent />
    </Suspense>
  );
}
