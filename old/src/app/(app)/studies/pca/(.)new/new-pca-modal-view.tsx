'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PcaForm } from '../pca-form';
import {
  StudyFormModalSuspenseFallback,
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/pca';

const TITLE = 'Adicionar Novo PCA';
const DESCRIPTION =
  'Preencha os detalhes para criar um novo Plano de Controle Ambiental.';

function NewPcaModalContent() {
  const searchParams = useSearchParams();
  const initialListagemCode = searchParams?.get('listagem') ?? undefined;
  const onSuccess = useStudyFormShellSuccess('modal', LIST_PATH);

  return (
    <StudyFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="PCA não encontrado"
    >
      <PcaForm
        currentItem={null}
        onSuccess={onSuccess}
        initialListagemCode={initialListagemCode}
      />
    </StudyFormShell>
  );
}

export function NewPcaModalView() {
  return (
    <Suspense fallback={<StudyFormModalSuspenseFallback />}>
      <NewPcaModalContent />
    </Suspense>
  );
}
