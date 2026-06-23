'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { EiaRimaForm } from '../../eia-rima-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { EiaRima } from '@/lib/types';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/eia-rima';
const PAGE_WIDTH = 'max-w-4xl mx-auto';

const TITLE = 'Editar Estudo de Impacto Ambiental';
const DESCRIPTION = 'Atualize os detalhes do EIA/RIMA abaixo.';
const NOT_FOUND = 'O estudo que você está tentando editar não foi encontrado.';

function EditEiaRimaPageContent() {
  const params = useParams();
  const eiaRimaId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  const { firestore } = useFirebase();

  const eiaRimaDocRef = useMemoFirebase(() => {
    if (!firestore || !eiaRimaId) return null;
    return doc(firestore, 'eiaRimas', eiaRimaId);
  }, [firestore, eiaRimaId]);

  const { data: eiaRima, isLoading } = useDoc<EiaRima>(eiaRimaDocRef);

  return (
    <StudyFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      notFoundTitle="EIA/RIMA não encontrado"
      pageHeaderTitle={`Editando EIA/RIMA: ${eiaRima?.empreendimento?.nome || '...'}`}
      pageWidthClassName={PAGE_WIDTH}
      isLoading={isLoading}
      notFoundMessage={!eiaRima && !isLoading ? NOT_FOUND : undefined}
    >
      {eiaRima ? (
        <EiaRimaForm currentItem={eiaRima} onSuccess={onSuccess} />
      ) : null}
    </StudyFormShell>
  );
}

export default function EditEiaRimaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditEiaRimaPageContent />
    </Suspense>
  );
}
