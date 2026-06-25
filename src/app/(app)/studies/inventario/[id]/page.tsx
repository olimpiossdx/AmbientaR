'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const InventarioProjectView = dynamic(
  () => import('./inventario-project-view').then((m) => ({ default: m.InventarioProjectView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    ),
  },
);

export default function InventarioProjectPage() {
  return <InventarioProjectView />;
}
