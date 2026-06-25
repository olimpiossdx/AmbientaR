'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StudyDynamicCreationPage } from '@/components/studies/study-dynamic-creation-page';

function NewReanalisePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDynamic = searchParams?.get('form') === 'dynamic';

  useEffect(() => {
    if (!isDynamic) {
      router.replace('/studies/reanalise/new?form=dynamic');
    }
  }, [isDynamic, router]);

  const handleSuccess = () => router.push('/studies/reanalise');

  if (!isDynamic) {
    return <div className="p-6 text-sm text-muted-foreground">Redirecionando…</div>;
  }

  return (
    <StudyDynamicCreationPage
      studySlug="reanalise"
      studyLabel="Reanálise"
      pageTitle="Nova reanálise (formulário do documento)"
      cardTitle="Processo de reanálise"
      listagemVariant="project"
      staticFormHref="/studies/reanalise/new"
      onSuccess={handleSuccess}
    />
  );
}

export function NewReanaliseView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewReanalisePageContent />
    </Suspense>
  );
}
