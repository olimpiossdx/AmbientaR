'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InspectionForm } from '../../inspection-form';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Inspection } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditInspectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { firestore } = useFirebase();

  const docRef = React.useMemo(() => (firestore && id ? doc(firestore, 'inspections', id) : null), [firestore, id]);
  const { data: inspection, isLoading, error } = useDoc<Inspection>(docRef);

  const handleSuccess = () => {
    router.push('/inspections');
  };

  if (id && !firestore) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Editar Vistoria" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <p className="text-muted-foreground">Carregando...</p>
        </main>
      </div>
    );
  }

  if (error || (id && !isLoading && !inspection)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Editar Vistoria" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <p className="text-destructive">Vistoria não encontrada.</p>
          <button type="button" onClick={() => router.push('/inspections')} className="text-primary underline mt-2">
            Voltar para Vistoria em Campo
          </button>
        </main>
      </div>
    );
  }

  if (inspection?.status === 'Aprovada') {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Editar Vistoria" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <p className="text-muted-foreground">Vistorias aprovadas não podem ser editadas.</p>
          <button type="button" onClick={() => router.push('/inspections')} className="text-primary underline mt-2">
            Voltar para Vistoria em Campo
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar Vistoria" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {isLoading || !inspection ? (
            <Card>
              <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
              <CardContent><Skeleton className="h-64 w-full" /></CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Editar Registro de Vistoria</CardTitle>
                <CardDescription>
                  Altere os dados da vistoria em campo. Esta vistoria ainda não foi aprovada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InspectionForm key={inspection.id} currentItem={inspection} onSuccess={handleSuccess} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
