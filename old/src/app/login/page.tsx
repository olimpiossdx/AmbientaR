'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const LoginView = dynamic(
  () => import('./login-view').then((m) => ({ default: m.LoginView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Skeleton className="h-[420px] w-full max-w-md rounded-lg" />
      </div>
    ),
  },
);

export default function LoginPage() {
  return <LoginView />;
}
