'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const RegisterView = dynamic(
  () => import('./register-view').then((m) => ({ default: m.RegisterView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando cadastro…</p>
      </div>
    ),
  },
);

export default function RegisterPage() {
  return <RegisterView />;
}
