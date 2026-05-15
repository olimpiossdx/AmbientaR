'use client';

import { useEffect, useState } from 'react';
import type { Auth } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { AppUser } from '@/lib/types';

/**
 * UID da sessão Firebase Auth — única fonte válida para paths `users/{uid}/...`
 * nas regras (`request.auth.uid == userId`). Não usar `user.id` nem `uid` do Firestore.
 */
export function getSessionAuthUid(auth: Auth | null | undefined): string | null {
  return auth?.currentUser?.uid ?? null;
}

/** Perfil carregado e alinhado com a sessão (evita subscrições com ID legado). */
export function isUserProfileAlignedWithSession(
  user: AppUser | null | undefined,
  sessionUid: string | null,
): boolean {
  if (!user || !sessionUid) return false;
  return user.uid === sessionUid && user.id === sessionUid;
}

/**
 * Re-renderiza quando o UID da sessão muda (onAuthStateChanged).
 * Evita usar `user?.uid` do Firestore ou `auth.currentUser` sem re-render.
 */
export function useAuthUserId(auth: Auth | null | undefined): string | null {
  const [sessionUid, setSessionUid] = useState<string | null>(() =>
    getSessionAuthUid(auth),
  );

  useEffect(() => {
    if (!auth) {
      setSessionUid(null);
      return;
    }
    setSessionUid(auth.currentUser?.uid ?? null);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setSessionUid(firebaseUser?.uid ?? null);
    });
    return () => unsubscribe();
  }, [auth]);

  return sessionUid;
}
