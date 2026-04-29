
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { Leaf } from 'lucide-react';

/* Mesmo ícone da aplicação (layout): gradiente verde + folha */
const LogoIcon = () => (
  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground shadow-sm">
    <Leaf className="h-10 w-10" />
  </div>
);

function LoginPageContent() {
  return (
    <div className="w-full max-w-[400px] animate-fade-in-up space-y-8">
      {/* Marca: igual ao restante da aplicação */}
      <header>
        <Link href="/" className="flex w-full items-center justify-center gap-5">
          <LogoIcon />
          <div className="min-w-0 text-left">
            <h1 className="text-[2.65rem] font-bold leading-none tracking-tight text-primary">
              AmbientaR
            </h1>
            <p className="mt-1.5 text-base font-medium text-muted-foreground">
              Gestão Ambiental Inteligente
            </p>
          </div>
        </Link>
      </header>

      {/* Formulário */}
      <LoginForm />

      {/* Cadastre-se e Esqueceu a senha */}
      <div className="space-y-4 text-center text-sm">
        <p className="text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="/register" className="font-medium text-primary underline underline-offset-2 hover:no-underline">
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
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <Suspense>
        <LoginPageContent />
      </Suspense>
      <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
        Desenvolvido por Barros e Sá Investimentos
      </p>
    </div>
  );
}
