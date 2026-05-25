'use client';

import { Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ProjetoTecnicoBarragem } from '@/lib/types';
import { BarragemForm } from '../../barragem-form';
import { BarragemExportIconButtons } from '@/components/barragem/barragem-export-icon-buttons';

function EditBarragemPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();

  const docRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'projetosTecnicosBarragem', id) : null),
    [firestore, id],
  );
  const { data: projeto, isLoading } = useDoc<ProjetoTecnicoBarragem>(docRef);

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="p-6 text-muted-foreground">
        Projeto não encontrado.{' '}
        <button type="button" className="underline" onClick={() => router.push('/studies/barragem')}>
          Voltar à lista
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={`Editar — ${projeto.empreendimento.nome}`}>
        <BarragemExportIconButtons projeto={projeto} />
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <Card>
            <CardHeader>
              <CardTitle>Memorial descritivo</CardTitle>
              <CardDescription>
                Status: {projeto.status ?? 'Rascunho'}. Use os ícones no topo para exportar PDF ou
                Word.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[480px]">
              <BarragemForm
                currentItem={projeto}
                onSuccess={() => router.push('/studies/barragem')}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function EditBarragemPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditBarragemPageContent />
    </Suspense>
  );
}
