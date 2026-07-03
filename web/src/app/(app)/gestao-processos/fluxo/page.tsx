'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const FluxoView = dynamic(
  () => import('./fluxo-view').then((m) => ({ default: m.FluxoView })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
  },
);

export default function GestaoProcessosFluxoPage() {
  return <FluxoView />;
}
