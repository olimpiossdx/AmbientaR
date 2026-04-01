
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from './login-form';
import { Leaf } from 'lucide-react';

/* Mesmo ícone da aplicação (layout): gradiente verde + folha */
const LogoIcon = () => (
  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground">
    <Leaf className="h-5 w-5" />
  </div>
);

function LoginPageContent() {
  return (
    <div className="w-full max-w-[400px] animate-fade-in-up space-y-8">
      {/* Marca: igual ao restante da aplicação */}
      <header className="text-center">
        <Link href="/" className="inline-flex items-center justify-center gap-3">
          <LogoIcon />
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              AmbientaR
            </h1>
            <p className="text-xs text-muted-foreground">
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
