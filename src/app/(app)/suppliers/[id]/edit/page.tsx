'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const EditSupplierView = dynamic(
  () => import('./edit-supplier-view').then((m) => ({ default: m.EditSupplierView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Carregando Fornecedor..." />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function EditSupplierPage() {
  return <EditSupplierView />;
}
