'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { CavidadesForm } from '../cavidades-form';
import { StudyFormShell } from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/cavidades';
const CARD_CONTENT_CLASS = 'min-h-[480px]';

function NewCavidadesPageContent() {
  const router = useRouter();

  return (
    <StudyFormShell
      variant="page"
      title="Licenciamento espeleológico — MG"
      description="Fluxo alinhado à IS SISEMA 08/2017 e DN COPAM 217/2017. Consulte docs/ESTUDO-CAVIDADES-MG.md para referências oficiais."
      notFoundTitle="Estudo não encontrado"
      pageHeaderTitle="Novo estudo de cavidades"
      cardContentClassName={CARD_CONTENT_CLASS}
    >
      <CavidadesForm
        currentItem={null}
        onCreated={(id) => router.push(`/studies/cavidades/${id}/edit`)}
        onCancel={() => router.push(LIST_PATH)}
      />
    </StudyFormShell>
  );
}

export default function NewCavidadesPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewCavidadesPageContent />
    </Suspense>
  );
}
