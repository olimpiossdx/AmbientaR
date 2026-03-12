'use client';

import { useEffect } from 'react';

/**
 * Captura erros na raiz do app (layout, providers).
 * Deve ser mínimo e não depender de outros componentes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro global:', error.message, error.digest, error.stack);
  }, [error]);

  return (
    <html lang="pt-BR">
      <head>
        <style>{`
          body {
            font-family: system-ui;
            padding: 2rem;
            max-width: 42rem;
            margin: 0 auto;
          }
          h1 {
            color: #b91c1c;
          }
          pre {
            background: #fef2f2;
            padding: 1rem;
            overflow: auto;
            font-size: 0.875rem;
          }
          button {
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: #15803d;
            color: white;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
          }
        `}</style>
      </head>
      <body>
        <h1>Erro no servidor</h1>
        <p>Ocorreu um erro ao carregar a aplicação. Verifique o terminal onde <code>npm run dev</code> está rodando.</p>
        {error.message && (
          <pre>
            {error.message}
          </pre>
        )}
        <button
          type="button"
          onClick={() => reset()}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
