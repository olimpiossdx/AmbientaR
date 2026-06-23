'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PcaForm } from '../../pca-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PCA } from '@/lib/types';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/pca';

const TITLE = 'Editar Plano de Controle Ambiental';
const DESCRIPTION = 'Atualize os detalhes do PCA abaixo.';
const NOT_FOUND =
  'O relatório que você está tentando editar não foi encontrado.';

function EditPcaPageContent() {
  const params = useParams();
  const pcaId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  const { firestore } = useFirebase();

  const pcaDocRef = useMemoFirebase(() => {
    if (!firestore || !pcaId) return null;
    return doc(firestore, 'pcas', pcaId);
  }, [firestore, pcaId]);

  const { data: pca, isLoading } = useDoc<PCA>(pcaDocRef);

  return (
    <StudyFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="PCA não encontrado"
      pageHeaderTitle={`Editando PCA: ${pca?.empreendimento?.nome || '...'}`}
      isLoading={isLoading}
      notFoundMessage={!pca && !isLoading ? NOT_FOUND : undefined}
    >
      {pca ? <PcaForm currentItem={pca} onSuccess={onSuccess} /> : null}
    </StudyFormShell>
  );
}

export default function EditPcaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditPcaPageContent />
    </Suspense>
  );
}
