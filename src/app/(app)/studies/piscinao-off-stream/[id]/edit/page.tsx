'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PiscinaoOffStream } from '@/lib/types';
import { PiscinaoOffStreamForm } from '../../piscinao-off-stream-form';
import { PiscinaoExportIconButtons } from '@/components/piscinao/piscinao-export-icon-buttons';
import { StudyFormShell } from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/piscinao-off-stream';

function EditPiscinaoOffStreamPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();

  const docRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'piscinoesOffStream', id) : null),
    [firestore, id],
  );
  const { data: cadastro, isLoading } = useDoc<PiscinaoOffStream>(docRef);

  return (
    <StudyFormShell
      variant="page"
      title="Piscinão off-stream"
      description={
        cadastro
          ? `Status: ${cadastro.status ?? 'Rascunho'}. Use os ícones no topo para exportar PDF ou Word.`
          : 'Atualize o cadastro do piscinão.'
      }
      notFoundTitle="Cadastro não encontrado"
      pageHeaderTitle={`Editar — ${cadastro?.empreendimento?.nome || '...'}`}
      pageHeaderActions={
        cadastro ? <PiscinaoExportIconButtons cadastro={cadastro} /> : undefined
      }
      cardContentClassName="min-h-[480px]"
      isLoading={isLoading}
      notFoundMessage={!cadastro && !isLoading ? 'Cadastro não encontrado.' : undefined}
    >
      {cadastro ? (
        <PiscinaoOffStreamForm
          currentItem={cadastro}
          onCancel={() => router.push(LIST_PATH)}
        />
      ) : null}
    </StudyFormShell>
  );
}

export default function EditPiscinaoOffStreamPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditPiscinaoOffStreamPageContent />
    </Suspense>
  );
}
