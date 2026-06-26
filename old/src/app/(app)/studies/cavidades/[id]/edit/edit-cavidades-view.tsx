'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { EstudoCavidade } from '@/lib/types';
import { CavidadesForm } from '../../cavidades-form';
import { CavidadesExportIconButtons } from '@/components/cavidades/cavidades-export-icon-buttons';
import { StudyFormShell } from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/cavidades';
const CARD_CONTENT_CLASS = 'min-h-[480px]';

function EditCavidadesPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();

  const docRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'estudosCavidades', id) : null),
    [firestore, id],
  );
  const { data: estudo, isLoading } = useDoc<EstudoCavidade>(docRef);

  return (
    <StudyFormShell
      variant="page"
      title="Estudo de cavidades"
      description={
        estudo
          ? `Status: ${estudo.status ?? 'Rascunho'} · Nível: ${estudo.nivelEstudo ?? 'triagem'}`
          : 'Atualize o estudo de cavidades.'
      }
      notFoundTitle="Estudo não encontrado"
      pageHeaderTitle={`Editar — ${estudo?.empreendimento?.nome || '...'}`}
      pageHeaderActions={
        estudo ? <CavidadesExportIconButtons estudo={estudo} /> : undefined
      }
      cardContentClassName={CARD_CONTENT_CLASS}
      isLoading={isLoading}
      notFoundMessage={!estudo && !isLoading ? 'Estudo não encontrado.' : undefined}
    >
      {estudo ? (
        <CavidadesForm
          currentItem={estudo}
          onCancel={() => router.push(LIST_PATH)}
        />
      ) : null}
    </StudyFormShell>
  );
}

export function EditCavidadesView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditCavidadesPageContent />
    </Suspense>
  );
}
