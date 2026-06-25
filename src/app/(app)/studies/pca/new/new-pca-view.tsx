'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { StudyDynamicCreationPage } from '@/components/studies/study-dynamic-creation-page';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';
import { PcaForm } from '../pca-form';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const LIST_PATH = '/studies/pca';

const TITLE = 'Adicionar Novo PCA';
const DESCRIPTION =
  'Elaboração do PCA — Listagens A a H disponíveis. Os dados podem ser preenchidos a partir do empreendimento cadastrado. Formulário dinâmico via TR: botão "Formulário do documento (TR)".';

function NewPcaPageContent() {
  const searchParams = useSearchParams();
  const isDynamic = searchParams?.get('form') === 'dynamic';
  const initialListagemCode = searchParams?.get('listagem') ?? undefined;
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  if (isDynamic) {
    return (
      <StudyDynamicCreationPage
        studySlug="pca"
        studyLabel="PCA"
        pageTitle="Novo PCA (formulário do documento)"
        cardTitle="Adicionar novo PCA"
        listagemVariant="pca"
        staticFormHref="/studies/pca/new"
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <StudyFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="PCA não encontrado"
      pageHeaderTitle="Novo Plano de Controle Ambiental (PCA)"
      pageHeaderActions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/studies/pca/new?form=dynamic">
            Formulário do documento (TR)
          </Link>
        </Button>
      }
    >
      <PcaForm
        currentItem={null}
        onSuccess={onSuccess}
        initialListagemCode={initialListagemCode}
      />
    </StudyFormShell>
  );
}

export function NewPcaView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewPcaPageContent />
    </Suspense>
  );
}
