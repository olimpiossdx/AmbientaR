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
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

export type FirebaseConfig = Record<string, string>;

function createFirestore(app: FirebaseApp): Firestore {
  if (typeof window === "undefined") {
    return getFirestore(app);
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

export function getInstances(config: FirebaseConfig) {
  const isNewApp = getApps().length === 0;
  const app = isNewApp ? initializeApp(config) : getApp();
  const firestore = isNewApp ? createFirestore(app) : getFirestore(app);

  return {
    app,
    auth: getAuth(app),
    firestore,
  };
}
