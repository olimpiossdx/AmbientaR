'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { EiaRimaForm } from '../../eia-rima-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { EiaRima } from '@/lib/types';
import {
  StudyFormModalSuspenseFallback,
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/eia-rima';
const DIALOG_CLASS = 'sm:max-w-4xl h-full max-h-[90dvh] flex flex-col';

const TITLE = 'Editar Estudo de Impacto Ambiental';
const DESCRIPTION = 'Atualize os detalhes do EIA/RIMA abaixo.';
const NOT_FOUND = 'EIA/RIMA não encontrado.';

function EditEiaRimaModalContent() {
  const params = useParams();
  const eiaRimaId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('modal', LIST_PATH);

  const { firestore } = useFirebase();

  const eiaRimaDocRef = useMemoFirebase(() => {
    if (!firestore || !eiaRimaId) return null;
    return doc(firestore, 'eiaRimas', eiaRimaId);
  }, [firestore, eiaRimaId]);

  const { data: eiaRima, isLoading } = useDoc<EiaRima>(eiaRimaDocRef);

  return (
    <StudyFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="EIA/RIMA não encontrado"
      dialogContentClassName={DIALOG_CLASS}
      isLoading={isLoading}
      notFoundMessage={!eiaRima && !isLoading ? NOT_FOUND : undefined}
    >
      {eiaRima ? (
        <EiaRimaForm currentItem={eiaRima} onSuccess={onSuccess} />
      ) : null}
    </StudyFormShell>
  );
}

export default function EditEiaRimaModal() {
  return (
    <Suspense fallback={<StudyFormModalSuspenseFallback />}>
      <EditEiaRimaModalContent />
    </Suspense>
  );
}
