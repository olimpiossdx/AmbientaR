'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const GeorefDocumentosView = dynamic(
  () => import('./georef-documentos-view').then((m) => ({ default: m.GeorefDocumentosView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Documentação técnica" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function GeorefDocumentosPage() {
  return <GeorefDocumentosView />;
}
