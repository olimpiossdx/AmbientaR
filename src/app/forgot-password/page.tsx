'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ForgotPasswordView = dynamic(
  () => import('./forgot-password-view').then((m) => ({ default: m.ForgotPasswordView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Skeleton className="h-80 w-full max-w-md rounded-lg" />
      </div>
    ),
  },
);

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
