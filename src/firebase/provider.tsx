
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback, useRef, DependencyList } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FirebaseApp } from 'firebase/app';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { readDocViaSnapshot } from '@/firebase/firestore-snapshot-read';
import { Auth, User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { logUserAction } from '@/lib/audit-log';
import { PRESENCE_HEARTBEAT_MS } from '@/lib/user-presence';
import { buildFallbackAppUser } from '@/lib/auth-user-id';
import {
  isQuotaOrIndexedDbError,
  notifyIndexedDbQuotaExceeded,
} from '@/lib/browser-storage-recovery';
import {
  ADMIN_BOOTSTRAP_EMAIL,
  isBootstrapAdminEmail,
  resolveRoleForEmail,
} from '@/lib/admin-bootstrap';

interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: AppUser | null;
  isInitialized: boolean;
  /** True enquanto o perfil Firestore está a ser carregado após sessão Auth. */
  isProfileLoading: boolean;
  login: (email: string, password_hash: string) => Promise<boolean>;
  logout: () => void;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/** Redirecionamentos que dependem de usePathname/useRouter. Só monta no cliente para evitar "useContext null" durante geração (SSR/Turbopack). */
function AuthRedirects({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{children}</>;
  return <AuthRedirectsInner>{children}</AuthRedirectsInner>;
}

function AuthRedirectsInner({ children }: { children: ReactNode }) {
  const ctx = useContext(FirebaseContext);
  const pathname = usePathname();
  const router = useRouter();
  const appUser = ctx?.user ?? null;
  const isInitialized = ctx?.isInitialized ?? false;
  const isProfileLoading = ctx?.isProfileLoading ?? false;
  const hasAuthSession = Boolean(ctx?.auth?.currentUser);

  useEffect(() => {
    if (!isInitialized || isProfileLoading) return;
    if (appUser || hasAuthSession) return;
    if (
      pathname !== '/login' &&
      pathname !== '/forgot-password' &&
      pathname !== '/register'
    ) {
      router.push('/login');
    }
  }, [appUser, hasAuthSession, isInitialized, isProfileLoading, pathname, router]);

  useEffect(() => {
    if (!appUser) return;
    if (
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/forgot-password'
    ) {
      router.replace('/');
    }
  }, [appUser, pathname, router]);
  return <>{children}</>;
}

export const FirebaseProvider: React.FC<{ children: ReactNode; firebaseApp: FirebaseApp; firestore: Firestore; auth: Auth; }> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const appUserRef = useRef<AppUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const profileWaitersRef = useRef<Set<(user: AppUser | null) => void>>(new Set());
  const { toast } = useToast();

  const notifyProfileWaiters = useCallback((user: AppUser | null) => {
    profileWaitersRef.current.forEach((resolve) => resolve(user));
    profileWaitersRef.current.clear();
  }, []);

  const commitAppUser = useCallback(
    (user: AppUser | null) => {
      appUserRef.current = user;
      setAppUser(user);
      notifyProfileWaiters(user);
    },
    [notifyProfileWaiters],
  );

  const waitForUserProfile = useCallback(
    (timeoutMs = 15000): Promise<AppUser | null> =>
      new Promise((resolve) => {
        if (appUserRef.current) {
          resolve(appUserRef.current);
          return;
        }
        const timer = window.setTimeout(() => {
          profileWaitersRef.current.delete(done);
          resolve(null);
        }, timeoutMs);
        const done = (user: AppUser | null) => {
          window.clearTimeout(timer);
          profileWaitersRef.current.delete(done);
          resolve(user);
        };
        profileWaitersRef.current.add(done);
      }),
    [],
  );

  const updateUserOnlineStatus = useCallback(async (uid: string, isOnline: boolean) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', uid);
    try {
      await updateDoc(userDocRef, {
        isOnline,
        lastSeenAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn(`Could not update online status for user ${uid}:`, error);
    }
  }, [firestore]);

  const touchUserPresence = useCallback(async (uid: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', uid);
    try {
      await updateDoc(userDocRef, {
        isOnline: true,
        lastSeenAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn(`Could not touch presence for user ${uid}:`, error);
    }
  }, [firestore]);
  
  const updateLastLogin = useCallback(async (uid: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', uid);
    try {
      await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
    } catch (error) {
        console.warn(`Could not update last login for user ${uid}:`, error);
    }
  }, [firestore]);

  const loadUserProfile = useCallback(
    async (firebaseUser: User): Promise<AppUser> => {
      await auth.authStateReady();
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const normalizedEmail = (firebaseUser.email || '').trim().toLowerCase();
      const sessionUid = firebaseUser.uid;

      let userDoc = await readDocViaSnapshot(userDocRef);

      if (!userDoc.exists() && normalizedEmail) {
        try {
          const emailQuery = query(
            collection(firestore, 'users'),
            where('email', '==', normalizedEmail),
            limit(1),
          );
          const emailSnap = await getDocs(emailQuery);
          if (!emailSnap.empty) {
            const legacyDoc = emailSnap.docs[0];
            const legacyData = legacyDoc.data() as Omit<AppUser, 'id'>;
            if (legacyDoc.id !== sessionUid) {
              console.warn(
                `Migrating user profile from ${legacyDoc.id} to auth uid ${sessionUid}`,
              );
              await setDoc(userDocRef, {
                ...legacyData,
                uid: sessionUid,
                email: normalizedEmail,
                role: resolveRoleForEmail(normalizedEmail, legacyData.role),
                lastLogin: serverTimestamp(),
                lastSeenAt: serverTimestamp(),
                isOnline: true,
              });
              userDoc = await readDocViaSnapshot(userDocRef);
            }
          }
        } catch (migrationError) {
          console.warn('Profile migration by email failed:', migrationError);
        }
      }

      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<AppUser, 'id'>;

        if (userData.uid && userData.uid !== sessionUid) {
          try {
            await updateDoc(userDocRef, { uid: sessionUid });
          } catch (uidPatchError) {
            console.warn('Could not patch stale uid on user profile:', uidPatchError);
          }
        }

        const resolvedRole = resolveRoleForEmail(
          normalizedEmail,
          userData.role,
        );
        if (userData.role !== resolvedRole) {
          try {
            await updateDoc(userDocRef, { role: resolvedRole });
          } catch (rolePatchError) {
            console.warn('Could not sync role to Firestore profile:', rolePatchError);
          }
        }

        if (isBootstrapAdminEmail(normalizedEmail) && userData.role !== 'admin') {
          try {
            await setDoc(
              userDocRef,
              { role: 'admin', status: 'active', uid: sessionUid },
              { merge: true },
            );
          } catch (adminRestoreError) {
            console.warn('Could not restore bootstrap admin role:', adminRestoreError);
          }
        }

        let resolvedStatus = userData.status;
        const shouldActivatePortalUser =
          userData.status === 'pending_invite' ||
          (userData.status === 'inactive' &&
            (resolvedRole === 'admin' || normalizedEmail === ADMIN_BOOTSTRAP_EMAIL));
        if (shouldActivatePortalUser) {
          try {
            await updateDoc(userDocRef, { status: 'active' });
            resolvedStatus = 'active';
          } catch (statusPatchError) {
            console.warn('Could not activate portal user profile:', statusPatchError);
          }
        }

        return {
          id: sessionUid,
          ...userData,
          uid: sessionUid,
          email: userData.email || normalizedEmail,
          role: resolvedRole,
          status: resolvedStatus,
          photoURL: userData.photoURL || firebaseUser.photoURL || undefined,
        };
      }

      console.warn(
        `User document not found for uid: ${sessionUid}. Creating profile.`,
      );
      const newUser: Omit<AppUser, 'id'> = {
        uid: sessionUid,
        name:
          firebaseUser.displayName ||
          normalizedEmail.split('@')[0] ||
          'Novo Usuário',
        email: normalizedEmail,
        role: resolveRoleForEmail(normalizedEmail),
        status: 'active',
        isOnline: true,
        photoURL: firebaseUser.photoURL || '',
        cpf: '',
        cnpjs: [],
      };
      await setDoc(userDocRef, {
        ...newUser,
        lastLogin: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      });
      return { ...newUser, id: sessionUid };
    },
    [firestore, auth],
  );

  useEffect(() => {
    if (!auth || !firestore) {
        setIsInitialized(true);
        return;
    }

    // Timeout de segurança: se o Firebase não responder em 5s, libera a tela de login
    const safetyTimeout = setTimeout(() => {
      setIsInitialized((prev) => (prev ? prev : true));
    }, 5000);

    // Mantém um alvo de watch aberto antes de leituras transitórias (workaround SDK ca9/b815).
    const anchorRef = doc(firestore, '_meta', 'client');
    const anchorUnsub = onSnapshot(anchorRef, () => {});

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            setIsProfileLoading(true);
            let loadedUser: AppUser | null = null;
            try {
                loadedUser = await loadUserProfile(firebaseUser);
                commitAppUser(loadedUser);
                await touchUserPresence(firebaseUser.uid);
            } catch (serverError: unknown) {
                console.error('Failed to fetch user document:', serverError);
                const fallback = buildFallbackAppUser(firebaseUser);
                commitAppUser(fallback);
                loadedUser = fallback;
                const userDocRef = doc(firestore, 'users', firebaseUser.uid);
                void setDoc(userDocRef, {
                  ...fallback,
                  lastLogin: serverTimestamp(),
                  lastSeenAt: serverTimestamp(),
                }).catch((writeError) => {
                  console.warn('Could not persist fallback user profile:', writeError);
                });
            } finally {
                setIsProfileLoading(false);
                setIsInitialized(true);
            }
        } else {
            commitAppUser(null);
            setIsProfileLoading(false);
            // Em ambientes que simulam mobile (ex.: IDE/browser do Cursor), a persistência
            // do Firebase pode demorar mais para restaurar a sessão. Só marcar como
            // inicializado após um curto atraso, para não redirecionar para /login antes
            // de onAuthStateChanged ser chamado novamente com o usuário restaurado.
            const persistenceDelay = setTimeout(() => {
                setIsInitialized(true);
            }, 900);
            return () => clearTimeout(persistenceDelay);
        }
    });

    const handleBeforeUnload = () => {
      if (auth.currentUser) {
        void updateUserOnlineStatus(auth.currentUser.uid, false);
      }
    };

    const handleVisibilityChange = () => {
      if (!auth.currentUser) return;
      if (document.visibilityState === 'hidden') {
        void updateUserOnlineStatus(auth.currentUser.uid, false);
      } else {
        void touchUserPresence(auth.currentUser.uid);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(safetyTimeout);
      anchorUnsub();
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (auth.currentUser) {
        void updateUserOnlineStatus(auth.currentUser.uid, false);
      }
    };
  }, [auth, firestore, updateUserOnlineStatus, touchUserPresence, loadUserProfile, commitAppUser]);

  useEffect(() => {
    if (!auth?.currentUser) return;

    const uid = auth.currentUser.uid;
    void touchUserPresence(uid);

    const heartbeat = setInterval(() => {
      if (auth.currentUser && document.visibilityState === 'visible') {
        void touchUserPresence(auth.currentUser.uid);
      }
    }, PRESENCE_HEARTBEAT_MS);

    return () => clearInterval(heartbeat);
  }, [auth, appUser?.uid, touchUserPresence]);

  const login = useCallback(async (email: string, password_hash: string): Promise<boolean> => {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Serviço',
        description: 'Serviços de autenticação não disponíveis.',
      });
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password_hash.trim();

    const finishLogin = async (firebaseUser: User, auditAction: string) => {
      setIsProfileLoading(true);
      try {
        let profile: AppUser;
        try {
          profile = await loadUserProfile(firebaseUser);
        } catch (serverError) {
          console.error('Failed to load profile after login:', serverError);
          profile = buildFallbackAppUser(firebaseUser);
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          await setDoc(
            userDocRef,
            {
              ...profile,
              lastLogin: serverTimestamp(),
              lastSeenAt: serverTimestamp(),
            },
            { merge: true },
          ).catch((writeError) => {
            console.warn('Could not persist fallback profile after login:', writeError);
          });
        }
        commitAppUser(profile);
        await updateLastLogin(firebaseUser.uid);
        await logUserAction(firestore, auth, auditAction);
        return true;
      } finally {
        setIsProfileLoading(false);
      }
    };

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        normalizedPassword,
      );
      return finishLogin(userCredential.user, 'login');
    } catch (error: any) {
      if (
        normalizedEmail === ADMIN_BOOTSTRAP_EMAIL &&
        (error.code === 'auth/user-not-found' ||
          error.code === 'auth/invalid-credential')
      ) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            normalizedEmail,
            normalizedPassword,
          );
          return finishLogin(
            userCredential.user,
            'login_admin_creation',
          );
        } catch (creationError: any) {
          const msg = creationError?.code === 'auth/weak-password'
            ? 'A senha deve ter no mínimo 6 caracteres.'
            : 'Não foi possível criar a conta de super-usuário.';
          toast({ variant: 'destructive', title: 'Erro de Admin', description: msg });
          return false;
        }
      }

      console.error('Login failed:', error);

      if (isQuotaOrIndexedDbError(error)) {
        notifyIndexedDbQuotaExceeded();
        toast({
          variant: 'destructive',
          title: 'Armazenamento local indisponível',
          description:
            'O navegador bloqueou o IndexedDB (comum com extensões de privacidade ou dados corrompidos). ' +
            'Use o botão “Limpar dados locais e recarregar” na parte inferior da tela e tente entrar novamente.',
        });
        return false;
      }

      let description = 'Ocorreu um erro inesperado. Tente novamente.';
      if (error.code === 'auth/user-not-found') {
        description = 'Nenhum usuário encontrado com este e-mail.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'E-mail inválido. Verifique se digitou corretamente.';
      } else if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        description =
          'Usuário ou senha incorretos. Verifique os dados e tente novamente.';
      } else if (error.code === 'auth/too-many-requests') {
        description =
          'Acesso temporariamente bloqueado devido a muitas tentativas. Tente novamente mais tarde.';
      }

      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description,
      });
      return false;
    }
  }, [auth, firestore, toast, updateLastLogin, loadUserProfile, commitAppUser]);

  const logout = useCallback(async () => {
    if (auth && auth.currentUser && firestore) {
        await logUserAction(firestore, auth, 'logout');
        await updateUserOnlineStatus(auth.currentUser.uid, false);
        await signOut(auth);
    }
    // onAuthStateChanged irá limpar o usuário e o useEffect irá redirecionar
  }, [auth, firestore, updateUserOnlineStatus]);

  const contextValue = useMemo(() => ({
    firebaseApp,
    firestore,
    auth,
    user: appUser,
    isInitialized,
    isProfileLoading,
    login,
    logout,
  }), [firebaseApp, firestore, auth, appUser, isInitialized, isProfileLoading, login, logout]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      <AuthRedirects>{children}</AuthRedirects>
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = () => {
  const context = useFirebase();
  return {
    user: context.user,
    login: context.login,
    logout: context.logout,
    isInitialized: context.isInitialized,
    isProfileLoading: context.isProfileLoading,
  };
}

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error('Firestore not available');
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) throw new Error('Firebase App not available');
  return firebaseApp;
};

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | MemoFirebase<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);
  
  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = (): { user: AppUser | null; isUserLoading: boolean } => {
  const { user, isInitialized, isProfileLoading } = useFirebase();
  return { user, isUserLoading: !isInitialized || isProfileLoading };
};
