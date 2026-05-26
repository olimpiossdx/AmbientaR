'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { LasRas } from '@/lib/types';
import { LasRasForm } from '../../las-ras-form';
import { StudyDynamicEditPage } from '@/components/studies/study-dynamic-edit-page';
import { isLasRasStaticRecord } from '@/lib/studies/study-document-record';

function EditLasRasPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();

  const docRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'lasRas', id);
  }, [firestore, id]);

  const { data: item, isLoading } = useDoc<LasRas>(docRef);

  const handleSuccess = () => router.push('/studies/las-ras');

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Carregando LAS/RAS…" />
        <main className="p-6">
          <Skeleton className="h-[400px] w-full" />
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="LAS/RAS não encontrado" />
        <main className="p-6">
          <p className="text-sm text-muted-foreground">O registro solicitado não existe.</p>
        </main>
      </div>
    );
  }

  if (item.formSource === 'dynamic' || !isLasRasStaticRecord(item)) {
    return (
      <StudyDynamicEditPage
        studySlug="las-ras"
        collectionName="lasRas"
        documentId={id}
        pageTitlePrefix="Editando LAS/RAS"
        listHref="/studies/las-ras"
        listagemVariant="project"
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar LAS/RAS" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>Relatório Ambiental Simplificado</CardTitle>
            <CardDescription>Atualize os campos do RAS.</CardDescription>
          </CardHeader>
          <CardContent>
            <LasRasForm currentItem={item} onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function EditLasRasPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditLasRasPageContent />
    </Suspense>
  );
}
