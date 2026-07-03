'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PiaForm } from '../../pia-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PIA } from '@/lib/types';
import {
  StudyFormModalSuspenseFallback,
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/pia';

const DESCRIPTION = 'Atualize os detalhes do PIA abaixo.';
const NOT_FOUND = 'PIA não encontrado.';

function EditPiaModalContent() {
  const params = useParams();
  const piaId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('modal', LIST_PATH);

  const { firestore } = useFirebase();

  const piaDocRef = useMemoFirebase(() => {
    if (!firestore || !piaId) return null;
    return doc(firestore, 'pias', piaId);
  }, [firestore, piaId]);

  const { data: pia, isLoading } = useDoc<PIA>(piaDocRef);

  return (
    <StudyFormShell
      variant="modal"
      title={`Editar Plano de Intervenção Ambiental (${pia?.type ?? '...'})`}
      description={DESCRIPTION}
      notFoundTitle="PIA não encontrado"
      isLoading={isLoading}
      notFoundMessage={!pia && !isLoading ? NOT_FOUND : undefined}
    >
      {pia ? (
        <PiaForm
          currentItem={pia}
          piaType={pia.type || null}
          onSuccess={onSuccess}
        />
      ) : null}
    </StudyFormShell>
  );
}

export function EditPiaModalView() {
  return (
    <Suspense fallback={<StudyFormModalSuspenseFallback />}>
      <EditPiaModalContent />
    </Suspense>
  );
}
