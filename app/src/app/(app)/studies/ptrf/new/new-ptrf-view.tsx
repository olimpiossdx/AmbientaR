'use client';

import { Suspense } from 'react';
import { PtrfForm } from '../ptrf-form';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/ptrf';

function NewPtrfPageContent() {
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  return (
    <StudyFormShell
      variant="page"
      title="Adicionar Novo PTRF"
      description="Preencha os detalhes para criar um novo PTRF."
      notFoundTitle="PTRF não encontrado"
      pageHeaderTitle="Novo Projeto Técnico de Recomposição de Flora (PTRF)"
    >
      <PtrfForm currentItem={null} onSuccess={onSuccess} />
    </StudyFormShell>
  );
}

export function NewPtrfView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewPtrfPageContent />
    </Suspense>
  );
}
