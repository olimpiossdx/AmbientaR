'use client';

import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  getFirestoreErrorCode,
  getFirestoreErrorMessage,
} from '@/lib/firestore-payload';
export type FirestoreFormErrorContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: unknown;
};

/**
 * Tratamento padrão de erro em formulários Firestore:
 * toast amigável sempre; errorEmitter só em permission-denied real.
 */
export function handleFirestoreFormError(
  error: unknown,
  opts: {
    // Compatível com useToast().toast sem acoplar ao tipo interno do hook.
    toast: (props: {
      variant?: 'default' | 'destructive';
      title?: string;
      description?: string;
    }) => unknown;
    title: string;
    context: FirestoreFormErrorContext;
  },
): void {
  console.error(opts.title, error);
  const code = getFirestoreErrorCode(error);
  opts.toast({
    variant: 'destructive',
    title: opts.title,
    description: getFirestoreErrorMessage(error, code),
  });
  if (code === 'permission-denied') {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError(opts.context),
    );
  }
}

/** Para writes fire-and-forget (sem toast no formulário). */
export function emitFirestoreErrorIfPermissionDenied(
  error: unknown,
  context: FirestoreFormErrorContext,
): void {
  const code = getFirestoreErrorCode(error);
  if (code === 'permission-denied') {
    errorEmitter.emit('permission-error', new FirestorePermissionError(context));
  } else {
    console.error('Firestore write failed', context.path, error);
  }
}
