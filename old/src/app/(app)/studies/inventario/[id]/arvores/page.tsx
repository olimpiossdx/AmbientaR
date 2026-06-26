'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ArvoresView = dynamic(
  () => import('./arvores-view').then((m) => ({ default: m.ArvoresView })),
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

export default function ArvoresPage() {
  return <ArvoresView />;
}
