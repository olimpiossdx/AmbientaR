'use client';

import { useEffect, useState } from 'react';
import type { Auth, User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { AppUser } from '@/lib/types';

/** Conta bootstrap de administrador (criação automática no primeiro login). */
export const ADMIN_BOOTSTRAP_EMAIL = 'adm@adm.com';

/** Perfil mínimo quando o Firestore falha mas a sessão Auth é válida. */
export function buildFallbackAppUser(firebaseUser: User): AppUser {
  const normalizedEmail = (firebaseUser.email || '').trim().toLowerCase();
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    name:
      firebaseUser.displayName ||
      normalizedEmail.split('@')[0] ||
      'Usuário',
    email: normalizedEmail,
    role: normalizedEmail === ADMIN_BOOTSTRAP_EMAIL ? 'admin' : 'client',
    status: 'active',
    isOnline: true,
    photoURL: firebaseUser.photoURL || '',
    cpf: '',
    cnpjs: [],
  };
}

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
 * UID da sessão para queries de titular / autônomo / representante (`userId`, `approvedUserIds`, etc.).
 * Preferir isto a `user.id` isolado (documentos antigos podem divergir de `user.uid`).
 */
export function resolvePortalAuthUid(
  user: Pick<AppUser, "id" | "uid"> | null | undefined,
): string | null {
  if (!user) return null;
  return user.uid || user.id || null;
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
