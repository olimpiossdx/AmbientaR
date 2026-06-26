'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Procuracao } from '@/lib/types';
import { ProcuracaoForm } from '../../procuracao-form';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/procuracao';
const PAGE_WIDTH = 'max-w-4xl mx-auto';

function EditProcuracaoPageContent() {
  const params = useParams();
  const id = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);
  const { firestore } = useFirebase();

  const docRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'procuracoes', id);
  }, [firestore, id]);

  const { data: item, isLoading } = useDoc<Procuracao>(docRef);

  return (
    <StudyFormShell
      variant="page"
      title={item?.outorgante?.nome ?? 'Editar procuração'}
      description="Atualize outorgante, outorgados, poderes e empreendimentos representados."
      notFoundTitle="Procuração não encontrada"
      pageHeaderTitle="Editar procuração"
      pageWidthClassName={PAGE_WIDTH}
      isLoading={isLoading}
      notFoundMessage={!item && !isLoading ? 'O registro solicitado não existe.' : undefined}
    >
      {item ? <ProcuracaoForm currentItem={item} onSuccess={onSuccess} /> : null}
    </StudyFormShell>
  );
}

export function EditProcuracaoView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditProcuracaoPageContent />
    </Suspense>
  );
}
