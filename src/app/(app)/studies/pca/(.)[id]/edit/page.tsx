'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PcaForm } from '../../pca-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PCA } from '@/lib/types';
import {
  StudyFormModalSuspenseFallback,
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/pca';

const TITLE = 'Editar Plano de Controle Ambiental';
const DESCRIPTION = 'Atualize os detalhes do PCA abaixo.';
const NOT_FOUND = 'PCA não encontrado.';

function EditPcaModalContent() {
  const params = useParams();
  const pcaId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('modal', LIST_PATH);

  const { firestore } = useFirebase();

  const pcaDocRef = useMemoFirebase(() => {
    if (!firestore || !pcaId) return null;
    return doc(firestore, 'pcas', pcaId);
  }, [firestore, pcaId]);

  const { data: pca, isLoading } = useDoc<PCA>(pcaDocRef);

  return (
    <StudyFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="PCA não encontrado"
      isLoading={isLoading}
      notFoundMessage={!pca && !isLoading ? NOT_FOUND : undefined}
    >
      {pca ? <PcaForm currentItem={pca} onSuccess={onSuccess} /> : null}
    </StudyFormShell>
  );
}

export default function EditPcaModal() {
  return (
    <Suspense fallback={<StudyFormModalSuspenseFallback />}>
      <EditPcaModalContent />
    </Suspense>
  );
}
