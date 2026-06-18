/**
 * Recuperação quando o IndexedDB do browser enche ou corrompe (QuotaExceededError).
 * Firebase Auth + Firestore cache persistente + Dexie offline competem pelo mesmo quota.
 */

export const SKIP_PERSISTENT_FIRESTORE_CACHE_KEY =
  "ambientar-skip-persistent-firestore-cache";

export const IDB_QUOTA_EVENT = "ambientar-idb-quota-exceeded";

export function shouldSkipPersistentFirestoreCache(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SKIP_PERSISTENT_FIRESTORE_CACHE_KEY) === "1";
  } catch {
    return false;
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

export function isQuotaOrIndexedDbError(error: unknown): boolean {
  const name = (error as { name?: string })?.name ?? "";
  const message = String((error as { message?: string })?.message ?? error ?? "");
  const code = (error as { code?: string })?.code ?? "";
  return (
    name === "QuotaExceededError" ||
    code === "QuotaExceededError" ||
    /QuotaExceededError/i.test(message) ||
    /IndexedDbTransactionError/i.test(message) ||
    /backing store/i.test(message) ||
    /app\/idb-set/i.test(message)
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
  window.dispatchEvent(new CustomEvent(IDB_QUOTA_EVENT));
}

export function registerIndexedDbQuotaWatcher(): () => void {
  if (typeof window === "undefined") return () => {};

  const onRejection = (event: PromiseRejectionEvent) => {
    if (isQuotaOrIndexedDbError(event.reason)) {
      notifyIndexedDbQuotaExceeded();
    }
  };

  const onError = (event: ErrorEvent) => {
    if (isQuotaOrIndexedDbError(event.error ?? event.message)) {
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
