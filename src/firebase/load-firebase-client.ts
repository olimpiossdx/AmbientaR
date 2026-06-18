/**
 * Único ponto de entrada do Firebase no cliente.
 * Usa o SDK modular (sem compat) para evitar erros de resolução
 * como "Can't resolve '@firebase/auth/internal'".
 *
 * Firestore: em navegadores usa cache persistente (IndexedDB) com sincronização
 * multi-aba, reduzindo leituras repetidas da rede (alinhado a planos Spark/Blaze com custo controlado).
 */
import {
  initializeApp,
  getApp,
  getApps,
  type FirebaseApp,
} from "firebase/app";
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import {
  notifyIndexedDbQuotaExceeded,
  shouldSkipPersistentFirestoreCache,
} from "@/lib/browser-storage-recovery";

export type FirebaseConfig = Record<string, string>;

export type FirebaseClientInstances = {
  app: FirebaseApp;
  auth: ReturnType<typeof getAuth>;
  firestore: Firestore;
};

let cachedInstances: FirebaseClientInstances | null = null;

/** Limpa o singleton (ex.: botão “Tentar novamente” antes de recarregar a página). */
export function clearFirebaseClientInstancesCache(): void {
  cachedInstances = null;
}

function createAuth(app: FirebaseApp): Auth {
  if (typeof window === "undefined") {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
      ],
    });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "auth/already-initialized" || String(e).includes("already")) {
      return getAuth(app);
    }
    console.warn(
      "[Firebase] Auth com persistência em camadas indisponível; usando getAuth padrão.",
      e,
    );
    return getAuth(app);
  }
}

function createFirestore(app: FirebaseApp): Firestore {
  if (typeof window === "undefined") {
    return getFirestore(app);
  }

  const useMemoryOnly =
    shouldSkipPersistentFirestoreCache() ||
    (() => {
      try {
        return sessionStorage.getItem("ambientar-firestore-memory-only") === "1";
      } catch {
        return false;
      }
    })();

  // Em dev (HMR/Fast Refresh), cache persistente + multi-aba corrompe o estado interno
  // do SDK ao remontar dezenas de onSnapshot → INTERNAL ASSERTION FAILED (b815).
  if (process.env.NODE_ENV === "development" || useMemoryOnly) {
    try {
      return initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalAutoDetectLongPolling: true,
      });
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (
        code === "failed-precondition" ||
        code === "already-exists" ||
        String(e).includes("already")
      ) {
        return getFirestore(app);
      }
      console.warn(
        "[Firebase] Firestore em memória indisponível no dev; usando instância padrão.",
        e,
      );
      return getFirestore(app);
    }
  }

  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      experimentalAutoDetectLongPolling: true,
    });
  } catch (e) {
    notifyIndexedDbQuotaExceeded();
    const code = (e as { code?: string })?.code;
    if (
      code === "failed-precondition" ||
      code === "already-exists" ||
      String(e).includes("already")
    ) {
      return getFirestore(app);
    }
    console.warn(
      "[Firebase] Cache persistente (IndexedDB) indisponível; Firestore em memória.",
      e,
    );
    try {
      return initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalAutoDetectLongPolling: true,
      });
    } catch (memErr) {
      const memCode = (memErr as { code?: string })?.code;
      if (
        memCode === "failed-precondition" ||
        memCode === "already-exists" ||
        String(memErr).includes("already")
      ) {
        return getFirestore(app);
      }
      return getFirestore(app);
    }
  }
}

export function getInstances(config: FirebaseConfig): FirebaseClientInstances {
  if (cachedInstances) {
    return cachedInstances;
  }

  const isNewApp = getApps().length === 0;
  const app = isNewApp ? initializeApp(config) : getApp();
  const firestore = isNewApp ? createFirestore(app) : getFirestore(app);
  const auth = isNewApp ? createAuth(app) : getAuth(app);

  cachedInstances = {
    app,
    auth,
    firestore,
  };
  return cachedInstances;
}
