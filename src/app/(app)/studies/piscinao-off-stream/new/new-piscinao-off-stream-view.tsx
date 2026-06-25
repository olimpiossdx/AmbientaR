'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { PiscinaoOffStreamForm } from '../piscinao-off-stream-form';
import { StudyFormShell } from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/piscinao-off-stream';

function NewPiscinaoOffStreamPageContent() {
  const router = useRouter();

  return (
    <StudyFormShell
      variant="page"
      title="Piscinão off-stream"
      description="Cadastro de reservatório fora do leito do curso d'água. Vincule a projeto técnico ou outorga quando existirem."
      notFoundTitle="Cadastro não encontrado"
      pageHeaderTitle="Novo piscinão"
      cardContentClassName="min-h-[480px]"
    >
      <PiscinaoOffStreamForm
        onCreated={(id) => router.push(`/studies/piscinao-off-stream/${id}/edit`)}
        onCancel={() => router.push(LIST_PATH)}
      />
    </StudyFormShell>
  );
}

export function NewPiscinaoOffStreamView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewPiscinaoOffStreamPageContent />
    </Suspense>
  );
}
