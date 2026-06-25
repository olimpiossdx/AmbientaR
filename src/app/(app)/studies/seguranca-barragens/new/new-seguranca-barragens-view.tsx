'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { SegurancaBarragensForm } from '../seguranca-barragens-form';
import { StudyFormShell } from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/seguranca-barragens';

function NewSegurancaBarragensPageContent() {
  const router = useRouter();

  return (
    <StudyFormShell
      variant="page"
      title="Segurança de barragens"
      description="PSB, inspeções, PAE e triagem de Dam Break. Classificação preliminar sujeita a revisão do RT."
      notFoundTitle="Estudo não encontrado"
      pageHeaderTitle="Novo estudo de segurança"
      cardContentClassName="min-h-[480px]"
    >
      <SegurancaBarragensForm
        onCreated={(id) => router.push(`/studies/seguranca-barragens/${id}/edit`)}
        onCancel={() => router.push(LIST_PATH)}
      />
    </StudyFormShell>
  );
}

export function NewSegurancaBarragensView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewSegurancaBarragensPageContent />
    </Suspense>
  );
}
