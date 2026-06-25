'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const AiLabCloudLibraryView = dynamic(
  () =>
    import('./ai-lab-cloud-library-view').then((m) => ({
      default: m.AiLabCloudLibraryView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Biblioteca IA (OneDrive)"
          description="Sync, indexação e pesquisa na nuvem."
        />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function CloudLibraryPage() {
  return <AiLabCloudLibraryView />;
}
