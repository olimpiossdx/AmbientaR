'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const McaWorkbench = dynamic(
  () => import('./mca-workbench').then((m) => ({ default: m.McaWorkbench })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Mapas e análise multicritério (MCA)" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[520px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function StudiesMapasPage() {
  return <McaWorkbench />;
}
