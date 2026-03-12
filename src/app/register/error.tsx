'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf } from 'lucide-react';

export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na página de cadastro:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-green-50/50 dark:to-green-950/20">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <Leaf className="h-6 w-6" />
            <CardTitle>Algo deu errado</CardTitle>
          </div>
          <CardDescription>
            Não foi possível carregar a página de cadastro. Tente novamente ou volte ao login.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={reset} variant="default">
            Tentar novamente
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Ir para o login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
