'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PradaForm } from '../../prada-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Prada } from '@/lib/types';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/prada';

const TITLE = 'Editar Plano de Recuperação de Áreas Degradadas';
const DESCRIPTION =
  'Atualize os detalhes do PRADA abaixo. Use exportar PDF ou Word na listagem ou no diálogo de visualização.';
const NOT_FOUND =
  'O formulário que você está tentando editar não foi encontrado.';

function EditPradaPageContent() {
  const params = useParams();
  const pradaId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  const { firestore } = useFirebase();

  const pradaDocRef = useMemoFirebase(() => {
    if (!firestore || !pradaId) return null;
    return doc(firestore, 'pradas', pradaId);
  }, [firestore, pradaId]);

  const { data: prada, isLoading } = useDoc<Prada>(pradaDocRef);

  return (
    <StudyFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="PRADA não encontrado"
      pageHeaderTitle={`Editando PRADA: ${prada?.empreendimento?.nome || '...'}`}
      isLoading={isLoading}
      notFoundMessage={!prada && !isLoading ? NOT_FOUND : undefined}
    >
      {prada ? <PradaForm currentItem={prada} onSuccess={onSuccess} /> : null}
    </StudyFormShell>
  );
}

export default function EditPradaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditPradaPageContent />
    </Suspense>
  );
}
