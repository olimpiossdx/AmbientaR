'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { EstudoSegurancaBarragem } from '@/lib/types';
import { SegurancaBarragensForm } from '../../seguranca-barragens-form';
import { SegurancaExportIconButtons } from '@/components/seguranca-barragens/seguranca-export-icon-buttons';
import { StudyFormShell } from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/seguranca-barragens';

function EditSegurancaBarragensPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();

  const docRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'estudosSegurancaBarragem', id) : null),
    [firestore, id],
  );
  const { data: estudo, isLoading } = useDoc<EstudoSegurancaBarragem>(docRef);

  return (
    <StudyFormShell
      variant="page"
      title="Segurança de barragens"
      description={
        estudo
          ? `Status: ${estudo.status ?? 'Rascunho'}. Use os ícones no topo para exportar PDF ou Word.`
          : 'Atualize o estudo de segurança da barragem.'
      }
      notFoundTitle="Estudo não encontrado"
      pageHeaderTitle={`Editar — ${estudo?.empreendimento?.nome || '...'}`}
      pageHeaderActions={
        estudo ? <SegurancaExportIconButtons estudo={estudo} /> : undefined
      }
      cardContentClassName="min-h-[480px]"
      isLoading={isLoading}
      notFoundMessage={!estudo && !isLoading ? 'Estudo não encontrado.' : undefined}
    >
      {estudo ? (
        <SegurancaBarragensForm
          currentItem={estudo}
          onCancel={() => router.push(LIST_PATH)}
        />
      ) : null}
    </StudyFormShell>
  );
}

export default function EditSegurancaBarragensPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditSegurancaBarragensPageContent />
    </Suspense>
  );
}
