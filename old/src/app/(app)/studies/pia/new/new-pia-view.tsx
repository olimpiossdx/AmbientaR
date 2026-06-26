'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PiaForm } from '../pia-form';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';
import type { PiaType } from '@/lib/types';

const LIST_PATH = '/studies/pia';

function NewPiaPageContent() {
  const searchParams = useSearchParams();
  const piaType = searchParams?.get('type') as PiaType | null;
  const linkContext = {
    requestId: searchParams?.get('requestId') ?? undefined,
    projectId: searchParams?.get('projectId') ?? undefined,
    inventoryId: searchParams?.get('inventoryId') ?? undefined,
    empreendedorId: searchParams?.get('empreendedorId') ?? undefined,
  };
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  return (
    <StudyFormShell
      variant="page"
      title={`Adicionar Novo PIA (${piaType || 'Tipo não selecionado'})`}
      description="Preencha os detalhes para criar um novo Plano de Intervenção Ambiental."
      notFoundTitle="PIA não encontrado"
      pageHeaderTitle="Novo Plano de Intervenção Ambiental"
    >
      <PiaForm
        currentItem={null}
        piaType={piaType}
        linkContext={linkContext}
        onSuccess={onSuccess}
      />
    </StudyFormShell>
  );
}

export function NewPiaView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewPiaPageContent />
    </Suspense>
  );
}
