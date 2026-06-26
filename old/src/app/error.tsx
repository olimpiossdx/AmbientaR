'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Leaf } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro capturado pela aplicação:', error.message, error.digest, error.stack);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <Leaf className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold text-foreground">Algo deu errado</h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        O servidor retornou um erro. Verifique o console do navegador (F12) e o terminal onde
        o <code className="rounded bg-muted px-1">npm run dev</code> está rodando para mais detalhes.
      </p>
      {error.message && (
        <p className="max-w-md rounded-lg bg-destructive/10 p-3 text-left text-xs text-destructive">
          {error.message}
        </p>
      )}
      <Button onClick={reset} variant="default">
        Tentar novamente
      </Button>
    </div>
  );
}
