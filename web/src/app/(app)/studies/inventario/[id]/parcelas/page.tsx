'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ParcelasView = dynamic(
  () => import('./parcelas-view').then((m) => ({ default: m.ParcelasView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[420px] w-full rounded-lg" />
      </div>
    ),
  },
);

export default function PlotsPage() {
  return <ParcelasView />;
}
