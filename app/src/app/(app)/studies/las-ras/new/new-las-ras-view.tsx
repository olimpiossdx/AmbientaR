'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StudyDynamicCreationPage } from '@/components/studies/study-dynamic-creation-page';
import { LasRasForm } from '../las-ras-form';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/las-ras';
const PAGE_WIDTH = 'max-w-4xl mx-auto';

function NewLasRasPageContent() {
  const searchParams = useSearchParams();
  const isDynamic = searchParams?.get('form') === 'dynamic';
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  if (isDynamic) {
    return (
      <StudyDynamicCreationPage
        studySlug="las-ras"
        studyLabel="LAS-RAS"
        pageTitle="Novo LAS/RAS (formulário do documento)"
        cardTitle="Relatório Ambiental Simplificado"
        listagemVariant="project"
        staticFormHref="/studies/las-ras/new"
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <StudyFormShell
      variant="page"
      title="Relatório Ambiental Simplificado (RAS)"
      description="Formulário resumido com os campos principais do RAS."
      notFoundTitle="LAS/RAS não encontrado"
      pageHeaderTitle="Novo LAS/RAS"
      pageWidthClassName={PAGE_WIDTH}
    >
      <LasRasForm onSuccess={onSuccess} />
    </StudyFormShell>
  );
}

export function NewLasRasView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewLasRasPageContent />
    </Suspense>
  );
}
