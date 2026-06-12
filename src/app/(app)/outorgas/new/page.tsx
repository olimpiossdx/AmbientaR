'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { OutorgaForm } from '../outorga-form';

function NewOutorgaPageContent() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/outorgas');
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Nova outorga" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar nova outorga</CardTitle>
              <CardDescription>
                Preencha os detalhes para criar uma nova outorga.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OutorgaForm currentItem={null} onSuccess={handleSuccess} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function NewOutorgaPage() {
  return (
    <Suspense fallback={<div>Carregando…</div>}>
      <NewOutorgaPageContent />
    </Suspense>
  );
}
