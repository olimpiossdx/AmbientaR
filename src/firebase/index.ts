'use client';

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

/** @deprecated No cliente use FirebaseClientProvider; a inicialização é feita por import dinâmico. */
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  throw new Error(
    'initializeFirebase não deve ser chamado no cliente. O Firebase é inicializado pelo FirebaseClientProvider.'
  );
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export * from './use-firestore-auth-ready';
