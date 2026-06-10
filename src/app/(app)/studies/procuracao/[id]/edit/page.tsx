'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Procuracao } from '@/lib/types';
import { ProcuracaoForm } from '../../procuracao-form';

function EditProcuracaoPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();

  const docRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'procuracoes', id);
  }, [firestore, id]);

  const { data: item, isLoading } = useDoc<Procuracao>(docRef);
  const handleSuccess = () => router.push('/studies/procuracao');

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Carregando procuração…" />
        <main className="p-6">
          <Skeleton className="h-[400px] w-full" />
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Procuração não encontrada" />
        <main className="p-6">
          <p className="text-sm text-muted-foreground">O registro solicitado não existe.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar procuração" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>{item.outorgante?.nome}</CardTitle>
            <CardDescription>
              Atualize outorgante, outorgados, poderes e empreendimentos representados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProcuracaoForm currentItem={item} onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function EditProcuracaoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditProcuracaoPageContent />
    </Suspense>
  );
}
