'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PtrfForm } from '../../ptrf-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PTRF } from '@/lib/types';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/ptrf';

const TITLE = 'Editar Projeto Técnico de Recomposição de Flora';
const DESCRIPTION = 'Atualize os detalhes do PTRF abaixo.';
const NOT_FOUND =
  'O formulário que você está tentando editar não foi encontrado.';

function EditPtrfPageContent() {
  const params = useParams();
  const ptrfId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  const { firestore } = useFirebase();

  const ptrfDocRef = useMemoFirebase(() => {
    if (!firestore || !ptrfId) return null;
    return doc(firestore, 'ptrfs', ptrfId);
  }, [firestore, ptrfId]);

  const { data: ptrf, isLoading } = useDoc<PTRF>(ptrfDocRef);

  return (
    <StudyFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="PTRF não encontrado"
      pageHeaderTitle={`Editando PTRF: ${ptrf?.empreendimento?.nome || '...'}`}
      isLoading={isLoading}
      notFoundMessage={!ptrf && !isLoading ? NOT_FOUND : undefined}
    >
      {ptrf ? <PtrfForm currentItem={ptrf} onSuccess={onSuccess} /> : null}
    </StudyFormShell>
  );
}

export default function EditPtrfPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditPtrfPageContent />
    </Suspense>
  );
}
