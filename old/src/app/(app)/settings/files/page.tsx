'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const SettingsFilesView = dynamic(
  () => import('./settings-files-view').then((m) => ({ default: m.SettingsFilesView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Explorador de Arquivos do Projeto" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[480px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function ProjectFilesPage() {
  return <SettingsFilesView />;
}
