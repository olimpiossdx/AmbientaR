'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOfflineOptional } from '@/lib/offline/hooks';
import { useColetaPendingCount } from '@/lib/coleta-campo/use-coleta-pending';
import { CloudOff, CloudUpload } from 'lucide-react';

export function ColetaOfflineBanner() {
  const offline = useOfflineOptional();
  const pending = useColetaPendingCount();
  const isOnline = offline?.isOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);

  if (isOnline && pending === 0) return null;

  return (
    <Alert variant={isOnline ? 'default' : 'destructive'} className="mb-4">
      {isOnline ? (
        <CloudUpload className="h-4 w-4" />
      ) : (
        <CloudOff className="h-4 w-4" />
      )}
      <AlertTitle>{isOnline ? 'Sincronização' : 'Modo offline'}</AlertTitle>
      <AlertDescription>
        {isOnline
          ? pending > 0
            ? `${pending} alteração(ões) na fila. A sincronização ocorre automaticamente quando a rede estiver estável.`
            : 'Sem pendências de envio.'
          : 'Você pode continuar lançando parcelas e árvores. Os dados serão enviados quando houver conexão.'}
        {!isOnline && pending > 0 ? ` (${pending} pendente(s))` : null}
      </AlertDescription>
    </Alert>
  );
}
