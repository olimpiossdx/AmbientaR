'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RcaForm } from '../rca-form';
import {
  StudyFormModalSuspenseFallback,
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/rca';

const TITLE = 'Adicionar Novo RCA';
const DESCRIPTION =
  'Preencha os detalhes para criar um novo Relatório de Controle Ambiental.';

function NewRcaModalContent() {
  const searchParams = useSearchParams();
  const initialListagemCode = searchParams?.get('listagem') ?? undefined;
  const onSuccess = useStudyFormShellSuccess('modal', LIST_PATH);

  return (
    <StudyFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="RCA não encontrado"
    >
      <RcaForm
        currentItem={null}
        onSuccess={onSuccess}
        initialListagemCode={initialListagemCode}
      />
    </StudyFormShell>
  );
}

export function NewRcaModalView() {
  return (
    <Suspense fallback={<StudyFormModalSuspenseFallback />}>
      <NewRcaModalContent />
    </Suspense>
  );
}
