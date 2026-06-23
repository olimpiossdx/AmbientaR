'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { StudyDynamicCreationPage } from '@/components/studies/study-dynamic-creation-page';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';
import { RcaForm } from '../rca-form';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const LIST_PATH = '/studies/rca';

const TITLE = 'Adicionar Novo RCA';
const DESCRIPTION =
  'Elaboração do RCA — Listagens A a H harmonizadas. Use ?listagem=A…H na URL ou selecione abaixo. Formulário dinâmico via TR: botão "Formulário do documento (TR)".';

function NewRcaPageContent() {
  const searchParams = useSearchParams();
  const isDynamic = searchParams?.get('form') === 'dynamic';
  const initialListagemCode = searchParams?.get('listagem') ?? undefined;
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  if (isDynamic) {
    return (
      <StudyDynamicCreationPage
        studySlug="rca"
        studyLabel="RCA"
        pageTitle="Novo RCA (formulário do documento)"
        cardTitle="Adicionar novo RCA"
        listagemVariant="rca"
        staticFormHref="/studies/rca/new"
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <StudyFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="RCA não encontrado"
      pageHeaderTitle="Novo Relatório de Controle Ambiental"
      pageHeaderActions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/studies/rca/new?form=dynamic">
            Formulário do documento (TR)
          </Link>
        </Button>
      }
    >
      <RcaForm
        currentItem={null}
        onSuccess={onSuccess}
        initialListagemCode={initialListagemCode}
      />
    </StudyFormShell>
  );
}

export default function NewRcaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewRcaPageContent />
    </Suspense>
  );
}
