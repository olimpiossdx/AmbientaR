"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import Link from "next/link";

/**
 * Limite de erro do segmento autenticado — evita falhas de HMR/recovery
 * quando o boundary da raiz não cobre bem o layout cliente.
 */
export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      "Erro na área da aplicação:",
      error.message,
      error.digest,
      error.stack,
    );
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <Leaf className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold text-foreground">Algo deu errado</h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Ocorreu um erro ao carregar esta área. Se a mensagem repetir após
        &quot;Tentar novamente&quot;, pare o servidor (<kbd className="rounded bg-muted px-1">Ctrl+C</kbd>),
        apague a pasta <code className="rounded bg-muted px-1">.next</code> e execute{" "}
        <code className="rounded bg-muted px-1">npm run dev</code> de novo (uma só instância na porta).
      </p>
      {error.message ? (
        <p className="max-w-md rounded-lg bg-destructive/10 p-3 text-left text-xs text-destructive">
          {error.message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={() => reset()} variant="default">
          Tentar novamente
        </Button>
        <Button type="button" asChild variant="outline">
          <Link href="/">Ir ao início</Link>
        </Button>
      </div>
    </div>
  );
}
