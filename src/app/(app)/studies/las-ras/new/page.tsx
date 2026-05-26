'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudyDynamicCreationPage } from '@/components/studies/study-dynamic-creation-page';
import { LasRasForm } from '../las-ras-form';

function NewLasRasPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDynamic = searchParams?.get('form') === 'dynamic';

  const handleSuccess = () => router.push('/studies/las-ras');

  if (isDynamic) {
    return (
      <StudyDynamicCreationPage
        studySlug="las-ras"
        studyLabel="LAS-RAS"
        pageTitle="Novo LAS/RAS (formulário do documento)"
        cardTitle="Relatório Ambiental Simplificado"
        listagemVariant="project"
        staticFormHref="/studies/las-ras/new"
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Novo LAS/RAS" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>Relatório Ambiental Simplificado (RAS)</CardTitle>
            <CardDescription>Formulário resumido com os campos principais do RAS.</CardDescription>
          </CardHeader>
          <CardContent>
            <LasRasForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function NewLasRasPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewLasRasPageContent />
    </Suspense>
  );
}
