'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { RcaForm } from '../../rca-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { RCA } from '@/lib/types';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/rca';

const TITLE = 'Editar Relatório de Controle Ambiental';
const DESCRIPTION = 'Atualize os detalhes do RCA abaixo.';
const NOT_FOUND =
  'O relatório que você está tentando editar não foi encontrado.';

function EditRcaPageContent() {
  const params = useParams();
  const rcaId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  const { firestore } = useFirebase();

  const rcaDocRef = useMemoFirebase(() => {
    if (!firestore || !rcaId) return null;
    return doc(firestore, 'rcas', rcaId);
  }, [firestore, rcaId]);

  const { data: rca, isLoading } = useDoc<RCA>(rcaDocRef);

  return (
    <StudyFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="RCA não encontrado"
      pageHeaderTitle={`Editando RCA: ${rca?.empreendimento?.nome || '...'}`}
      isLoading={isLoading}
      notFoundMessage={!rca && !isLoading ? NOT_FOUND : undefined}
    >
      {rca ? <RcaForm currentItem={rca} onSuccess={onSuccess} /> : null}
    </StudyFormShell>
  );
}

export default function EditRcaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditRcaPageContent />
    </Suspense>
  );
}
