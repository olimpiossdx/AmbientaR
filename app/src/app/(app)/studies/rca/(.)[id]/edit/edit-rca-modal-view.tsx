'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { RcaForm } from '../../rca-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { RCA } from '@/lib/types';
import {
  StudyFormModalSuspenseFallback,
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/rca';

const TITLE = 'Editar Relatório de Controle Ambiental';
const DESCRIPTION = 'Atualize os detalhes do RCA abaixo.';
const NOT_FOUND = 'RCA não encontrado.';

function EditRcaModalContent() {
  const params = useParams();
  const rcaId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('modal', LIST_PATH);

  const { firestore } = useFirebase();

  const rcaDocRef = useMemoFirebase(() => {
    if (!firestore || !rcaId) return null;
    return doc(firestore, 'rcas', rcaId);
  }, [firestore, rcaId]);

  const { data: rca, isLoading } = useDoc<RCA>(rcaDocRef);

  return (
    <StudyFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="RCA não encontrado"
      isLoading={isLoading}
      notFoundMessage={!rca && !isLoading ? NOT_FOUND : undefined}
    >
      {rca ? <RcaForm currentItem={rca} onSuccess={onSuccess} /> : null}
    </StudyFormShell>
  );
}

export function EditRcaModalView() {
  return (
    <Suspense fallback={<StudyFormModalSuspenseFallback />}>
      <EditRcaModalContent />
    </Suspense>
  );
}
