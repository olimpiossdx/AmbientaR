
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { PublicAuthLayout } from '@/components/auth/public-auth-layout';

function LoginPageContent() {
  return (
    <PublicAuthLayout>
      <div className="space-y-6">
        <LoginForm />

        <div className="space-y-4 text-center text-sm">
          <p className="text-muted-foreground">
            Não tem uma conta?{' '}
            <Link
              href="/register"
              className="font-medium text-primary underline underline-offset-2 hover:no-underline"
            >
              Cadastre-se
            </Link>
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-primary underline underline-offset-2 hover:no-underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
      </div>
    </PublicAuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
