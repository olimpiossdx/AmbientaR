'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

const SKIP_THROW_PATHS = [
  'access_requests',
  '/documents/users',
  '/documents/companySettings/',
  'delegate_invites',
];

function shouldSkipGlobalToast(path: string): boolean {
  return SKIP_THROW_PATHS.some((fragment) => path.includes(fragment));
}

/**
 * Escuta erros de permissão Firestore e mostra toast — não derruba a aplicação.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      const path = error.request?.path ?? '';
      if (shouldSkipGlobalToast(path)) {
        return;
      }

      console.error(
        '[Firestore permission-error]',
        error.message,
        error.debugPayload,
      );

      toast({
        variant: 'destructive',
        title: 'Sem permissão',
        description: error.message,
      });
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
