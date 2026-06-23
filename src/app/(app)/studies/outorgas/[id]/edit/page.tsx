'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { OutorgaForm } from '../../outorga-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { WaterPermit } from '@/lib/types';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/outorgas';
const PAGE_WIDTH = 'max-w-2xl mx-auto';

const TITLE = 'Editar Pedido de Outorga';
const DESCRIPTION = 'Atualize os detalhes do pedido abaixo.';
const NOT_FOUND =
  'O registro que você está tentando editar não foi encontrado.';

function EditOutorgaPageContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, 'outorgas', itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<WaterPermit>(itemDocRef);

  return (
    <StudyFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="Outorga não encontrada"
      pageHeaderTitle={`Editando Outorga: ${item?.permitNumber || '...'}`}
      pageWidthClassName={PAGE_WIDTH}
      isLoading={isLoading}
      notFoundMessage={!item && !isLoading ? NOT_FOUND : undefined}
    >
      {item ? <OutorgaForm currentItem={item} onSuccess={onSuccess} /> : null}
    </StudyFormShell>
  );
}

export default function EditOutorgaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditOutorgaPageContent />
    </Suspense>
  );
}
