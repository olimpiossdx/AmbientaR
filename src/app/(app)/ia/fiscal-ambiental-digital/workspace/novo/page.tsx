'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const FadWorkspaceForm = dynamic(
  () =>
    import('@/components/fiscal-ambiental/fad-workspace-form').then((m) => ({
      default: m.FadWorkspaceForm,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    ),
  },
);

export default function FadWorkspaceNovoPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Novo imóvel</h1>
        <p className="text-sm text-muted-foreground">
          Nome e perímetro da propriedade. As imagens INPE serão ligadas a este workspace na Fase 1.
        </p>
      </div>
      <FadWorkspaceForm mode="create" />
    </div>
  );
}
