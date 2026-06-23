'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  clearBrowserStorageForRecovery,
  clearFirestoreMemoryOnly,
  clearSkipAuthIndexedDbPersistence,
  clearSkipPersistentFirestoreCache,
  FIRESTORE_SDK_ERROR_EVENT,
  IDB_QUOTA_EVENT,
  isQuotaOrIndexedDbError,
} from '@/lib/browser-storage-recovery';
import { clearFirebaseClientInstancesCache } from '@/firebase/load-firebase-client';

/**
 * Aviso quando o armazenamento local do browser está cheio/corrompido.
 * Sem isto, Auth e Firestore falham com permission-denied (auth:null) em produção.
 */
export function IndexedDbRecoveryBanner() {
  const [visible, setVisible] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener(IDB_QUOTA_EVENT, show);
    window.addEventListener(FIRESTORE_SDK_ERROR_EVENT, show);
    return () => {
      window.removeEventListener(IDB_QUOTA_EVENT, show);
      window.removeEventListener(FIRESTORE_SDK_ERROR_EVENT, show);
    };
  }, []);

  const handleClearAndReload = useCallback(async () => {
    setIsClearing(true);
    try {
      await clearBrowserStorageForRecovery();
      clearFirebaseClientInstancesCache();
      clearSkipPersistentFirestoreCache();
      clearSkipAuthIndexedDbPersistence();
      clearFirestoreMemoryOnly();
      window.location.reload();
    } catch (error) {
      console.error('Falha ao limpar armazenamento local:', error);
      if (isQuotaOrIndexedDbError(error)) {
        setVisible(true);
      }
      setIsClearing(false);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-xl rounded-lg border border-amber-500/40 bg-amber-50 p-4 text-amber-950 shadow-lg dark:bg-amber-950/90 dark:text-amber-50"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="space-y-2 text-sm">
          <p className="font-medium">Armazenamento local cheio ou indisponível</p>
          <p>
            O navegador não conseguiu usar o cache local (IndexedDB / Firestore). Isso
            impede login e leitura de dados. Limpe os dados locais deste site e recarregue.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              disabled={isClearing}
              onClick={() => void handleClearAndReload()}
            >
              {isClearing ? 'A limpar…' : 'Limpar dados locais e recarregar'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setVisible(false)}
            >
              Ignorar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
