'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ProjetoTecnicoBarragem } from '@/lib/types';
import { BarragemForm } from '../../barragem-form';
import { BarragemExportIconButtons } from '@/components/barragem/barragem-export-icon-buttons';
import { StudyFormShell } from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/barragem';
const CARD_CONTENT_CLASS = 'min-h-[480px]';

function EditBarragemPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();

  const docRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'projetosTecnicosBarragem', id) : null),
    [firestore, id],
  );
  const { data: projeto, isLoading } = useDoc<ProjetoTecnicoBarragem>(docRef);

  return (
    <StudyFormShell
      variant="page"
      title="Memorial descritivo"
      description={
        projeto
          ? `Status: ${projeto.status ?? 'Rascunho'}. Use os ícones no topo para exportar PDF ou Word.`
          : 'Atualize o memorial descritivo do projeto técnico de barragem.'
      }
      notFoundTitle="Projeto não encontrado"
      pageHeaderTitle={`Editar — ${projeto?.empreendimento?.nome || '...'}`}
      pageHeaderActions={
        projeto ? <BarragemExportIconButtons projeto={projeto} /> : undefined
      }
      cardContentClassName={CARD_CONTENT_CLASS}
      isLoading={isLoading}
      notFoundMessage={!projeto && !isLoading ? 'Projeto não encontrado.' : undefined}
    >
      {projeto ? (
        <BarragemForm
          currentItem={projeto}
          onCancel={() => router.push(LIST_PATH)}
        />
      ) : null}
    </StudyFormShell>
  );
}

export default function EditBarragemPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditBarragemPageContent />
    </Suspense>
  );
}
