/**
 * Recuperação quando o IndexedDB do browser enche ou corrompe (QuotaExceededError).
 * Firebase Auth + Firestore cache persistente + Dexie offline competem pelo mesmo quota.
 */

export const SKIP_PERSISTENT_FIRESTORE_CACHE_KEY =
  "ambientar-skip-persistent-firestore-cache";

export const SKIP_AUTH_INDEXEDDB_KEY = "ambientar-auth-skip-indexeddb";

/** Firestore só em memória nesta sessão (evita INTERNAL ASSERTION b815). */
export const FIRESTORE_MEMORY_ONLY_KEY = "ambientar-firestore-memory-only";

/** Evita loop de reload automático após recuperação b815. */
export const FIRESTORE_B815_RECOVERY_KEY = "ambientar-firestore-b815-recovered";

export const IDB_QUOTA_EVENT = "ambientar-idb-quota-exceeded";

export const FIRESTORE_SDK_ERROR_EVENT = "ambientar-firestore-sdk-error";

export function shouldSkipPersistentFirestoreCache(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SKIP_PERSISTENT_FIRESTORE_CACHE_KEY) === "1";
  } catch {
    return false;
  }
}

export function shouldSkipAuthIndexedDbPersistence(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SKIP_AUTH_INDEXEDDB_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSkipAuthIndexedDbPersistence(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SKIP_AUTH_INDEXEDDB_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearSkipAuthIndexedDbPersistence(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SKIP_AUTH_INDEXEDDB_KEY);
  } catch {
    /* ignore */
  }
}

export function markSkipPersistentFirestoreCache(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SKIP_PERSISTENT_FIRESTORE_CACHE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearSkipPersistentFirestoreCache(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SKIP_PERSISTENT_FIRESTORE_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function shouldUseFirestoreMemoryOnly(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      sessionStorage.getItem(FIRESTORE_MEMORY_ONLY_KEY) === "1" ||
      sessionStorage.getItem(SKIP_PERSISTENT_FIRESTORE_CACHE_KEY) === "1"
    );
  } catch {
    return false;
  }
}

export function markFirestoreMemoryOnly(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FIRESTORE_MEMORY_ONLY_KEY, "1");
    sessionStorage.setItem(SKIP_PERSISTENT_FIRESTORE_CACHE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearFirestoreMemoryOnly(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(FIRESTORE_MEMORY_ONLY_KEY);
    sessionStorage.removeItem(FIRESTORE_B815_RECOVERY_KEY);
  } catch {
    /* ignore */
  }
}

export function isFirestoreInternalAssertionError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? error ?? "");
  return (
    /INTERNAL ASSERTION FAILED/i.test(message) ||
    /\bID:\s*b815\b/i.test(message) ||
    /\bID:\s*ca9\b/i.test(message) ||
    /Cannot read properties of null \(reading 'Te'\)/i.test(message)
  );
}

/**
 * Recuperação automática: primeira ocorrência b815 → cache em memória + reload.
 * Segunda ocorrência na mesma sessão → só banner (evita loop).
 */
export function tryRecoverFromFirestoreInternalError(error: unknown): boolean {
  if (!isFirestoreInternalAssertionError(error)) return false;
  if (typeof window === "undefined") return false;

  window.dispatchEvent(
    new CustomEvent(FIRESTORE_SDK_ERROR_EVENT, { detail: { error } }),
  );

  try {
    if (sessionStorage.getItem(FIRESTORE_B815_RECOVERY_KEY) === "1") {
      notifyIndexedDbQuotaExceeded();
      return true;
    }
    sessionStorage.setItem(FIRESTORE_B815_RECOVERY_KEY, "1");
    markFirestoreMemoryOnly();
    markSkipAuthIndexedDbPersistence();
    window.location.reload();
    return true;
  } catch {
    notifyIndexedDbQuotaExceeded();
    return true;
  }
}

export function isQuotaOrIndexedDbError(error: unknown): boolean {
  const name = (error as { name?: string })?.name ?? "";
  const message = String((error as { message?: string })?.message ?? error ?? "");
  const code = (error as { code?: string })?.code ?? "";
  return (
    name === "QuotaExceededError" ||
    name === "UnknownError" ||
    code === "QuotaExceededError" ||
    /QuotaExceededError/i.test(message) ||
    /IndexedDbTransactionError/i.test(message) ||
    /backing store/i.test(message) ||
    /indexedDB\.open/i.test(message) ||
    /app\/idb-set/i.test(message) ||
    (name === "AbortError" && /transaction was aborted/i.test(message))
  );
}

function deleteIndexedDb(name: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Remove bases Firebase / Firestore / offline local para libertar quota. */
export async function clearBrowserStorageForRecovery(
  options?: { includeOfflineQueue?: boolean },
): Promise<void> {
  if (typeof window === "undefined") return;

  const includeOffline = options?.includeOfflineQueue !== false;
  const names = new Set<string>();

  try {
    const listed = await indexedDB.databases?.();
    if (listed) {
      for (const db of listed) {
        if (db.name) names.add(db.name);
      }
    }
  } catch {
    /* databases() indisponível em browsers antigos */
  }

  for (const candidate of [
    "firebaseLocalStorageDb",
    "firebase-heartbeat-database",
    "AmbientaROffline",
  ]) {
    names.add(candidate);
  }

  await Promise.all(
    [...names].filter((name) => {
      if (!includeOffline && name === "AmbientaROffline") return false;
      return (
        name.startsWith("firebase") ||
        name.includes("firestore") ||
        (includeOffline && name === "AmbientaROffline")
      );
    }).map((name) => deleteIndexedDb(name)),
  );

  try {
    localStorage.removeItem("firebase:authUser");
  } catch {
    /* ignore */
  }
}

export function notifyIndexedDbQuotaExceeded(): void {
  if (typeof window === "undefined") return;
  markSkipPersistentFirestoreCache();
  markSkipAuthIndexedDbPersistence();
  window.dispatchEvent(new CustomEvent(IDB_QUOTA_EVENT));
}

const IDB_PROBE_DB = "__ambientar_idb_probe__";

/** Testa se o browser consegue abrir e gravar no IndexedDB (Auth/Firestore dependem disto). */
export function probeIndexedDbWritable(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    const timer = window.setTimeout(() => finish(false), 4000);

    try {
      const req = indexedDB.open(IDB_PROBE_DB, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore("probe");
      };
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction("probe", "readwrite");
          tx.objectStore("probe").put(Date.now(), "ping");
          tx.oncomplete = () => {
            window.clearTimeout(timer);
            db.close();
            void deleteIndexedDb(IDB_PROBE_DB).then(() => finish(true));
          };
          tx.onerror = () => {
            window.clearTimeout(timer);
            db.close();
            finish(false);
          };
        } catch {
          window.clearTimeout(timer);
          db.close();
          finish(false);
        }
      };
      req.onerror = () => {
        window.clearTimeout(timer);
        finish(false);
      };
      req.onblocked = () => {
        window.clearTimeout(timer);
        finish(false);
      };
    } catch {
      window.clearTimeout(timer);
      finish(false);
    }
  });
}

export function registerIndexedDbQuotaWatcher(): () => void {
  if (typeof window === "undefined") return () => {};

  const onRejection = (event: PromiseRejectionEvent) => {
    if (tryRecoverFromFirestoreInternalError(event.reason)) {
      event.preventDefault();
      return;
    }
    if (isQuotaOrIndexedDbError(event.reason)) {
      notifyIndexedDbQuotaExceeded();
    }
  };

  const onError = (event: ErrorEvent) => {
    const payload = event.error ?? event.message;
    if (tryRecoverFromFirestoreInternalError(payload)) {
      event.preventDefault();
      return;
    }
    if (isQuotaOrIndexedDbError(payload)) {
      notifyIndexedDbQuotaExceeded();
    }
  };

  window.addEventListener("unhandledrejection", onRejection);
  window.addEventListener("error", onError);

  return () => {
    window.removeEventListener("unhandledrejection", onRejection);
    window.removeEventListener("error", onError);
  };
}
