'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const MemorialDescritivoWorkbench = dynamic(
  () =>
    import('@/components/memorial-descritivo/memorial-descritivo-workbench').then((m) => ({
      default: m.MemorialDescritivoWorkbench,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Memorial descritivo" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function GeorefMemorialDescritivoPage() {
  return <MemorialDescritivoWorkbench context="georef" />;
}
