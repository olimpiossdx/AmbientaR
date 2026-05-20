'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PatrimonioForm } from '../../patrimonio-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { BemPatrimonio } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function EditBemPatrimonioContent() {
  const router = useRouter();
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, 'bens_patrimonio', itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<BemPatrimonio>(itemDocRef);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Carregando…" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Bem não encontrado" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Registro não encontrado</CardTitle>
              <CardDescription>O bem patrimonial solicitado não existe ou foi removido.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={`Editar: ${item.descricao}`} />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Editar bem patrimonial</CardTitle>
              <CardDescription>Atualize dados de aquisição, depreciação e documentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <PatrimonioForm
                currentItem={item}
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

export default function EditBemPatrimonioPage() {
  return (
    <Suspense fallback={<div>Carregando…</div>}>
      <EditBemPatrimonioContent />
    </Suspense>
  );
}
