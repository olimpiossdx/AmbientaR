'use client';

import { Suspense } from 'react';
import { PradaForm } from '../prada-form';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/prada';

function NewPradaPageContent() {
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  return (
    <StudyFormShell
      variant="page"
      title="Adicionar Novo PRADA"
      description="Preencha os detalhes para criar um novo PRADA."
      notFoundTitle="PRADA não encontrado"
      pageHeaderTitle="Novo Plano de Recuperação de Áreas Degradadas (PRADA)"
    >
      <PradaForm currentItem={null} onSuccess={onSuccess} />
    </StudyFormShell>
  );
}

export function NewPradaView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewPradaPageContent />
    </Suspense>
  );
}
