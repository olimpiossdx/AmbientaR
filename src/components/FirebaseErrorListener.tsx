'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's global-error.tsx.
 */
export function FirebaseErrorListener() {
  // Use the specific error type for the state for type safety.
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    // The callback now expects a strongly-typed error, matching the event payload.
    const handleError = (error: FirestorePermissionError) => {
      // Não quebrar a tela para erro em access_requests (perfil cliente): regras podem ainda não estar em deploy.
      const path = error.request?.path ?? '';
      if (path.includes('access_requests')) {
        return;
      }
      // Lista de usuários no chat (admin): não derrubar a app por falha pontual de regras/índice.
      if (path.includes('/documents/users')) {
        return;
      }
      // Branding / feature flags: leitura pode ocorrer antes do Auth restaurar a sessão.
      if (path.includes('/documents/companySettings/')) {
        return;
      }
      setError(error);
    };

    // The typed emitter will enforce that the callback for 'permission-error'
    // matches the expected payload type (FirestorePermissionError).
    errorEmitter.on('permission-error', handleError);

    // Unsubscribe on unmount to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // On re-render, if an error exists in state, throw it.
  if (error) {
    throw error;
  }

  // This component renders nothing.
  return null;
}
