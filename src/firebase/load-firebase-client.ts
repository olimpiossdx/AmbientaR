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
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

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

function createFirestore(app: FirebaseApp): Firestore {
  if (typeof window === "undefined") {
    return getFirestore(app);
  }

  // Em dev (HMR/Fast Refresh), cache persistente + multi-aba corrompe o estado interno
  // do SDK ao remontar dezenas de onSnapshot → INTERNAL ASSERTION FAILED (b815).
  if (process.env.NODE_ENV === "development") {
    try {
      return initializeFirestore(app, {
        localCache: memoryLocalCache(),
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
      "[Firebase] Cache persistente do Firestore indisponível; usando instância padrão.",
      e,
    );
    return getFirestore(app);
  }
}

export function getInstances(config: FirebaseConfig): FirebaseClientInstances {
  if (cachedInstances) {
    return cachedInstances;
  }

  const isNewApp = getApps().length === 0;
  const app = isNewApp ? initializeApp(config) : getApp();
  const firestore = isNewApp ? createFirestore(app) : getFirestore(app);

  cachedInstances = {
    app,
    auth: getAuth(app),
    firestore,
  };
  return cachedInstances;
}
