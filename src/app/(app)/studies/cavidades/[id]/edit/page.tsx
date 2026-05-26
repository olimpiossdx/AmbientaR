'use client';

import { Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { EstudoCavidade } from '@/lib/types';
import { CavidadesForm } from '../../cavidades-form';
import { CavidadesExportIconButtons } from '@/components/cavidades/cavidades-export-icon-buttons';

function EditCavidadesPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();

  const docRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'estudosCavidades', id) : null),
    [firestore, id],
  );
  const { data: estudo, isLoading } = useDoc<EstudoCavidade>(docRef);

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-4 h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!estudo) {
    return (
      <div className="p-6 text-muted-foreground">
        Estudo não encontrado.{' '}
        <button
          type="button"
          className="underline"
          onClick={() => router.push('/studies/cavidades')}
        >
          Voltar à lista
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={`Editar — ${estudo.empreendimento.nome}`}>
        <CavidadesExportIconButtons estudo={estudo} />
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <Card>
            <CardHeader>
              <CardTitle>Estudo de cavidades</CardTitle>
              <CardDescription>
                Status: {estudo.status ?? 'Rascunho'} · Nível: {estudo.nivelEstudo ?? 'triagem'}
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[480px]">
              <CavidadesForm
                currentItem={estudo}
                onCancel={() => router.push('/studies/cavidades')}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function EditCavidadesPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditCavidadesPageContent />
    </Suspense>
  );
}
