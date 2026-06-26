'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const NovaMultaDefesaView = dynamic(
  () =>
    import('./nova-multa-defesa-view').then((m) => ({
      default: m.NovaMultaDefesaView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova multa / processo" />
        <main className="flex-1 p-4 md:p-6 space-y-4 max-w-3xl mx-auto w-full">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function NovaMultaDefesaPage() {
  return <NovaMultaDefesaView />;
}
