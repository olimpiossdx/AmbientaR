'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { BarragemForm } from '../barragem-form';
import { StudyFormShell } from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/barragem';
const CARD_CONTENT_CLASS = 'min-h-[480px]';

function NewBarragemPageContent() {
  const router = useRouter();

  return (
    <StudyFormShell
      variant="page"
      title="Memorial descritivo"
      description="Estrutura alinhada ao modelo FPT (apresentação, informações básicas, aterro, hidrologia, extravasor, implantação e anexos). Exporte em PDF ou Word com a identidade visual da consultoria."
      notFoundTitle="Projeto não encontrado"
      pageHeaderTitle="Novo Projeto Técnico de Barragem"
      cardContentClassName={CARD_CONTENT_CLASS}
    >
      <BarragemForm
        currentItem={null}
        onCreated={(id) => router.push(`/studies/barragem/${id}/edit`)}
        onCancel={() => router.push(LIST_PATH)}
      />
    </StudyFormShell>
  );
}

export default function NewBarragemPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewBarragemPageContent />
    </Suspense>
  );
}
