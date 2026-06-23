'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PtrfForm } from '../../ptrf-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PTRF } from '@/lib/types';
import {
  StudyFormModalSuspenseFallback,
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/ptrf';
const DIALOG_CLASS = 'sm:max-w-4xl h-full max-h-[90dvh] flex flex-col';

const TITLE = 'Editar Projeto Técnico de Recomposição de Flora';
const DESCRIPTION = 'Atualize os detalhes do PTRF abaixo.';
const NOT_FOUND = 'PTRF não encontrado.';

function EditPtrfModalContent() {
  const params = useParams();
  const ptrfId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('modal', LIST_PATH);

  const { firestore } = useFirebase();

  const ptrfDocRef = useMemoFirebase(() => {
    if (!firestore || !ptrfId) return null;
    return doc(firestore, 'ptrfs', ptrfId);
  }, [firestore, ptrfId]);

  const { data: ptrf, isLoading } = useDoc<PTRF>(ptrfDocRef);

  return (
    <StudyFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="PTRF não encontrado"
      dialogContentClassName={DIALOG_CLASS}
      isLoading={isLoading}
      notFoundMessage={!ptrf && !isLoading ? NOT_FOUND : undefined}
    >
      {ptrf ? <PtrfForm currentItem={ptrf} onSuccess={onSuccess} /> : null}
    </StudyFormShell>
  );
}

export default function EditPtrfModal() {
  return (
    <Suspense fallback={<StudyFormModalSuspenseFallback />}>
      <EditPtrfModalContent />
    </Suspense>
  );
}
