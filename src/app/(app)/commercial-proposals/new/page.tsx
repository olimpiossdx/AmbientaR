'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const NewCommercialProposalView = dynamic(
  () =>
    import('./new-commercial-proposal-view').then((m) => ({
      default: m.NewCommercialProposalView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova Proposta Comercial" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full max-w-3xl mx-auto rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function NewProposalPage() {
  return <NewCommercialProposalView />;
}
