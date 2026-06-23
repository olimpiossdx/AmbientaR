'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EiaRimaForm } from '../eia-rima-form';
import { StudyDynamicCreationPage } from '@/components/studies/study-dynamic-creation-page';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/eia-rima';
const PAGE_WIDTH = 'max-w-4xl mx-auto';

function NewEiaRimaPageContent() {
  const searchParams = useSearchParams();
  const isDynamic = searchParams?.get('form') === 'dynamic';
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  if (isDynamic) {
    return (
      <StudyDynamicCreationPage
        studySlug="eia-rima"
        studyLabel="EIA/RIMA"
        pageTitle="Novo EIA/RIMA (formulário do documento)"
        cardTitle="Adicionar novo EIA/RIMA"
        listagemVariant="project"
        staticFormHref="/studies/eia-rima/new"
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <StudyFormShell
      variant="page"
      title="Adicionar Novo EIA/RIMA"
      description="Preencha os detalhes para criar um novo Estudo de Impacto Ambiental."
      notFoundTitle="EIA/RIMA não encontrado"
      pageHeaderTitle="Novo Estudo de Impacto Ambiental (EIA/RIMA)"
      pageWidthClassName={PAGE_WIDTH}
    >
      <EiaRimaForm currentItem={null} onSuccess={onSuccess} />
    </StudyFormShell>
  );
}

export default function NewEiaRimaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewEiaRimaPageContent />
    </Suspense>
  );
}
