'use client';

import { useFirebase } from '@/firebase/provider';
import { useAuthUserId } from '@/lib/auth-user-id';

/**
 * True quando Firebase Auth tem sessão ativa no browser.
 * Evita onSnapshot/get com auth:null antes da sessão restaurar.
 */
export function useFirestoreAuthReady(): boolean {
  const { auth } = useFirebase();
  const sessionUid = useAuthUserId(auth);
  return Boolean(auth?.currentUser && sessionUid);
}
