'use client';

import { useEffect } from 'react';
import {
  clearBrowserStorageForRecovery,
  clearSkipPersistentFirestoreCache,
} from '@/lib/browser-storage-recovery';
import { clearFirebaseClientInstancesCache } from '@/firebase/load-firebase-client';

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

  const isPermissionError =
    /permission-denied|insufficient permissions|auth": null/i.test(
      error.message ?? '',
    );

  const handleClearStorage = async () => {
    await clearBrowserStorageForRecovery();
    clearFirebaseClientInstancesCache();
    clearSkipPersistentFirestoreCache();
    window.location.reload();
  };

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
          button.secondary {
            background: #b45309;
            margin-left: 0.5rem;
          }
          p.hint {
            color: #57534e;
            font-size: 0.9rem;
            line-height: 1.5;
          }
        `}</style>
      </head>
      <body>
        <h1>Erro ao carregar a aplicação</h1>
        {isPermissionError ? (
          <p className="hint">
            A sessão ou o armazenamento local do navegador pode estar corrompido
            (IndexedDB cheio). Tente limpar os dados locais deste site e voltar a
            entrar. Em alternativa: DevTools → Application → Clear site data.
          </p>
        ) : (
          <p className="hint">
            Ocorreu um erro inesperado. Se estiver em desenvolvimento, verifique o
            terminal onde <code>npm run dev</code> está a correr.
          </p>
        )}
        {error.message && (
          <pre>
            {error.message}
          </pre>
        )}
        <div>
          <button
            type="button"
            onClick={() => reset()}
          >
            Tentar novamente
          </button>
          {isPermissionError && (
            <button
              type="button"
              className="secondary"
              onClick={() => void handleClearStorage()}
            >
              Limpar dados locais e recarregar
            </button>
          )}
        </div>
      </body>
    </html>
  );
}
