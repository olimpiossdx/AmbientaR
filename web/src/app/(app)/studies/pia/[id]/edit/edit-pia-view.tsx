'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PiaForm } from '../../pia-form';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PIA } from '@/lib/types';
import { PiaExportButtons } from '@/components/pia/pia-export-buttons';
import { asPiaRecord } from '@/lib/pia/pia-record';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/pia';

const DESCRIPTION =
  'Atualize os detalhes do PIA abaixo. Com status Aprovado, exporte Word ou PDF com identidade visual.';
const NOT_FOUND =
  'O formulário que você está tentando editar não foi encontrado.';

function EditPiaPageContent() {
  const params = useParams();
  const piaId = (params?.id as string | undefined) ?? '';
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  const { firestore } = useFirebase();

  const piaDocRef = useMemoFirebase(() => {
    if (!firestore || !piaId) return null;
    return doc(firestore, 'pias', piaId);
  }, [firestore, piaId]);

  const { data: pia, isLoading } = useDoc<PIA>(piaDocRef);

  return (
    <StudyFormShell
      variant="page"
      title={`Editar Plano de Intervenção Ambiental (${pia?.type ?? '...'})`}
      description={DESCRIPTION}
      notFoundTitle="PIA não encontrado"
      pageHeaderTitle={`Editando PIA: ${pia?.empreendimento?.nome || '...'}`}
      cardHeaderExtra={
        pia ? (
          <div className="pt-4">
            <PiaExportButtons pia={asPiaRecord(pia)!} />
          </div>
        ) : undefined
      }
      isLoading={isLoading}
      notFoundMessage={!pia && !isLoading ? NOT_FOUND : undefined}
    >
      {pia ? (
        <PiaForm
          currentItem={pia}
          piaType={pia.type || null}
          onSuccess={onSuccess}
        />
      ) : null}
    </StudyFormShell>
  );
}

export function EditPiaView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditPiaPageContent />
    </Suspense>
  );
}
