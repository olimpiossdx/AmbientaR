'use client';

import { Suspense } from 'react';
import { PtrfForm } from '../ptrf-form';
import {
  StudyFormModalSuspenseFallback,
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/ptrf';
const DIALOG_CLASS = 'sm:max-w-4xl h-full max-h-[90dvh] flex flex-col';

function NewPtrfModalContent() {
  const onSuccess = useStudyFormShellSuccess('modal', LIST_PATH);

  return (
    <StudyFormShell
      variant="modal"
      title="Adicionar Novo PTRF"
      description="Preencha os detalhes para criar um novo Projeto Técnico de Recomposição de Flora."
      notFoundTitle="PTRF não encontrado"
      dialogContentClassName={DIALOG_CLASS}
    >
      <PtrfForm currentItem={null} onSuccess={onSuccess} />
    </StudyFormShell>
  );
}

export function NewPtrfModalView() {
  return (
    <Suspense fallback={<StudyFormModalSuspenseFallback />}>
      <NewPtrfModalContent />
    </Suspense>
  );
}
