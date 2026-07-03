'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const EditSegurancaBarragensView = dynamic(
  () =>
    import('./edit-seguranca-barragens-view').then((m) => ({
      default: m.EditSegurancaBarragensView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Editar estudo de segurança" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full max-w-4xl mx-auto rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function EditSegurancaBarragensPage() {
  return <EditSegurancaBarragensView />;
}
