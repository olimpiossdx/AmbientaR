'use client';

import { Suspense } from 'react';
import { EiaRimaForm } from '../eia-rima-form';
import {
  StudyFormModalSuspenseFallback,
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/eia-rima';
const DIALOG_CLASS = 'sm:max-w-4xl h-full max-h-[90dvh] flex flex-col';

function NewEiaRimaModalContent() {
  const onSuccess = useStudyFormShellSuccess('modal', LIST_PATH);

  return (
    <StudyFormShell
      variant="modal"
      title="Adicionar Novo EIA/RIMA"
      description="Preencha os detalhes para criar um novo Estudo de Impacto Ambiental."
      notFoundTitle="EIA/RIMA não encontrado"
      dialogContentClassName={DIALOG_CLASS}
    >
      <EiaRimaForm currentItem={null} onSuccess={onSuccess} />
    </StudyFormShell>
  );
}

export default function NewEiaRimaModal() {
  return (
    <Suspense fallback={<StudyFormModalSuspenseFallback />}>
      <NewEiaRimaModalContent />
    </Suspense>
  );
}
