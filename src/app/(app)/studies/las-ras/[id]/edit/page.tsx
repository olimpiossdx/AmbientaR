'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { LasRas } from '@/lib/types';
import { LasRasForm } from '../../las-ras-form';
import { StudyDynamicEditPage } from '@/components/studies/study-dynamic-edit-page';
import { isLasRasStaticRecord } from '@/lib/studies/study-document-record';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/las-ras';
const PAGE_WIDTH = 'max-w-4xl mx-auto';

function EditLasRasPageContent() {
  const params = useParams();
  const id = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);
  const { firestore } = useFirebase();

  const docRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'lasRas', id);
  }, [firestore, id]);

  const { data: item, isLoading } = useDoc<LasRas>(docRef);

  if (!isLoading && item && (item.formSource === 'dynamic' || !isLasRasStaticRecord(item))) {
    return (
      <StudyDynamicEditPage
        studySlug="las-ras"
        collectionName="lasRas"
        documentId={id}
        pageTitlePrefix="Editando LAS/RAS"
        listHref={LIST_PATH}
        listagemVariant="project"
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <StudyFormShell
      variant="page"
      title="Relatório Ambiental Simplificado"
      description="Atualize os campos do RAS."
      notFoundTitle="LAS/RAS não encontrado"
      pageHeaderTitle="Editar LAS/RAS"
      pageWidthClassName={PAGE_WIDTH}
      isLoading={isLoading}
      notFoundMessage={!item && !isLoading ? 'O registro solicitado não existe.' : undefined}
    >
      {item ? <LasRasForm currentItem={item} onSuccess={onSuccess} /> : null}
    </StudyFormShell>
  );
}

export default function EditLasRasPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditLasRasPageContent />
    </Suspense>
  );
}
