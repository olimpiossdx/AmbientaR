'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StudyDynamicEditPage } from '@/components/studies/study-dynamic-edit-page';

function EditReanalisePageContent() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string | undefined) ?? '';

  return (
    <StudyDynamicEditPage
      studySlug="reanalise"
      collectionName="reanalises"
      documentId={id}
      pageTitlePrefix="Editando reanálise"
      listHref="/studies/reanalise"
      listagemVariant="project"
      onSuccess={() => router.push('/studies/reanalise')}
    />
  );
}

export function EditReanaliseView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditReanalisePageContent />
    </Suspense>
  );
}
