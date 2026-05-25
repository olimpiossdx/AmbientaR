'use client';

import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DispensaForm } from '../../dispensa-form';
import { useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { DispensaPeaRecord } from '@/lib/pea/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DispensaExportButton } from '@/components/pea/dispensa-export-button';

export default function EditarDispensaPeaPage() {
  const params = useParams();
  const id = params && typeof params.id === 'string' ? params.id : '';
  const router = useRouter();
  const { firestore } = useFirebase();

  const ref = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'dispensaPea', id) : null),
    [firestore, id],
  );
  const { data: record, isLoading } = useDoc<DispensaPeaRecord>(ref);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar dispensa do PEA">
        {record && <DispensaExportButton record={record} />}
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {isLoading && <Skeleton className="h-96 w-full" />}
          {!isLoading && record && (
            <Card>
              <CardHeader>
                <CardTitle>Formulário de dispensa</CardTitle>
                <CardDescription>Atualize e exporte para protocolo no SLA/FEAM.</CardDescription>
              </CardHeader>
              <CardContent>
                <DispensaForm
                  currentItem={record}
                  onSuccess={() => router.push('/studies/educacao-ambiental')}
                  onCancel={() => router.back()}
                />
              </CardContent>
            </Card>
          )}
          {!isLoading && !record && (
            <p className="text-muted-foreground">Solicitação não encontrada.</p>
          )}
        </div>
      </main>
    </div>
  );
}
