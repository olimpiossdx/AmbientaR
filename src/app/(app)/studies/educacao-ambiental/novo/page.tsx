'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { PeaForm } from '../pea-form';

export default function NovoPeaPage() {
  const router = useRouter();
  const [initialProjectId, setInitialProjectId] = React.useState<string | undefined>();
  const [initialGeoAnalysisId, setInitialGeoAnalysisId] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('empreendimentoId')?.trim();
    const gid = params.get('geoAnalysisId')?.trim();
    setInitialProjectId(pid || undefined);
    setInitialGeoAnalysisId(gid || undefined);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Novo Programa de Educação Ambiental" />
      <main className="flex-1 overflow-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
        <PeaForm
          initialProjectId={initialProjectId}
          initialGeoAnalysisId={initialGeoAnalysisId}
          onCancel={() => router.push('/studies/educacao-ambiental')}
          onSuccess={(id) => {
            if (id) router.push(`/studies/educacao-ambiental/${id}/edit`);
            else router.push('/studies/educacao-ambiental');
          }}
        />
      </main>
    </div>
  );
}
