'use client';

import dynamic from 'next/dynamic';
import { Leaf } from 'lucide-react';

const DashboardRouterView = dynamic(
  () => import('./dashboard-router-view').then((m) => ({ default: m.DashboardRouterView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Leaf className="w-12 h-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    ),
  },
);

export default function DashboardRouterPage() {
  return <DashboardRouterView />;
}
