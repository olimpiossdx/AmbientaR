'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const CalculadoraView = dynamic(
  () => import('./calculadora-view').then((m) => ({ default: m.CalculadoraView })),
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

export default function CalculadoraPage() {
  return <CalculadoraView />;
}
