'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const FadWorkspaceEditPage = dynamic(
  () =>
    import('./fad-workspace-edit-page').then((m) => ({
      default: m.FadWorkspaceEditPage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    ),
  },
);

export default function FadWorkspaceEditRoute() {
  const params = useParams();
  const workspaceId = (params?.workspaceId as string | undefined) ?? '';

  if (!workspaceId) {
    return null;
  }

  return <FadWorkspaceEditPage workspaceId={workspaceId} />;
}
