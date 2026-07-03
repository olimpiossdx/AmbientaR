'use client';

import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { PeaForm } from '../../pea-form';
import { useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PeaProgram } from '@/lib/pea/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PeaExportButtons } from '@/components/pea/pea-export-buttons';

export function EditEducacaoAmbientalView() {
  const params = useParams();
  const id = params && typeof params.id === 'string' ? params.id : '';
  const router = useRouter();
  const { firestore } = useFirebase();

  const peaRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'pea_programs', id) : null),
    [firestore, id],
  );
  const { data: pea, isLoading } = useDoc<PeaProgram>(peaRef);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar PEA">
        {pea && (
          <div className="flex items-center gap-2">
            <PeaExportButtons pea={pea} />
          </div>
        )}
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
        {isLoading && <Skeleton className="h-96 w-full" />}
        {!isLoading && pea && (
          <PeaForm
            currentItem={pea}
            onCancel={() => router.push('/studies/educacao-ambiental')}
            onSuccess={() => router.push('/studies/educacao-ambiental')}
          />
        )}
        {!isLoading && !pea && (
          <p className="text-muted-foreground">Programa não encontrado.</p>
        )}
      </main>
    </div>
  );
}
