'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PiaForm } from '../pia-form';
import {
  StudyFormModalSuspenseFallback,
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';
import type { PiaType } from '@/lib/types';

const LIST_PATH = '/studies/pia';

function NewPiaModalContent() {
  const searchParams = useSearchParams();
  const piaType = searchParams?.get('type') as PiaType | null;
  const onSuccess = useStudyFormShellSuccess('modal', LIST_PATH);

  return (
    <StudyFormShell
      variant="modal"
      title={`Adicionar Novo PIA (${piaType || 'Tipo não selecionado'})`}
      description="Preencha os detalhes para criar um novo Plano de Intervenção Ambiental."
      notFoundTitle="PIA não encontrado"
    >
      <PiaForm currentItem={null} piaType={piaType} onSuccess={onSuccess} />
    </StudyFormShell>
  );
}

export default function NewPiaModal() {
  return (
    <Suspense fallback={<StudyFormModalSuspenseFallback />}>
      <NewPiaModalContent />
    </Suspense>
  );
}
