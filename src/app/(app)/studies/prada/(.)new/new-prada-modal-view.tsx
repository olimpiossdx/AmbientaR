'use client';

import { Suspense } from 'react';
import { PradaForm } from '../prada-form';
import {
  StudyFormModalSuspenseFallback,
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/prada';

function NewPradaModalContent() {
  const onSuccess = useStudyFormShellSuccess('modal', LIST_PATH);

  return (
    <StudyFormShell
      variant="modal"
      title="Adicionar Novo PRADA"
      description="Preencha os detalhes para criar um novo Plano de Recuperação de Áreas Degradadas."
      notFoundTitle="PRADA não encontrado"
    >
      <PradaForm currentItem={null} onSuccess={onSuccess} />
    </StudyFormShell>
  );
}

export function NewPradaModalView() {
  return (
    <Suspense fallback={<StudyFormModalSuspenseFallback />}>
      <NewPradaModalContent />
    </Suspense>
  );
}
