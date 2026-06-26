import {
  type DocumentReference,
  type DocumentSnapshot,
  onSnapshot,
} from "firebase/firestore";

/**
 * Lê um documento via onSnapshot em vez de getDoc transitório.
 * Evita race ca9/b815 no SDK 12.x quando getDoc é a primeira operação no canal.
 * @see https://github.com/firebase/firebase-js-sdk/issues/9267
 */
export function readDocViaSnapshot(
  ref: DocumentReference,
  options?: { timeoutMs?: number; waitForServer?: boolean },
): Promise<DocumentSnapshot> {
  const timeoutMs = options?.timeoutMs ?? 15_000;

  return new Promise((resolve, reject) => {
    let settled = false;
    let unsubscribe: (() => void) | undefined;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    const timer = window.setTimeout(() => {
      finish(() => {
        unsubscribe?.();
        reject(new Error(`Firestore snapshot timeout (${ref.path})`));
      });
    }, timeoutMs);

    unsubscribe = onSnapshot(
      ref,
      { includeMetadataChanges: options?.waitForServer === true },
      (snap) => {
        if (options?.waitForServer && snap.metadata.fromCache) return;
        finish(() => {
          resolve(snap);
          // Pequeno atraso antes de remover o alvo (evita race ca9 no teardown imediato).
          window.setTimeout(() => unsubscribe?.(), 250);
        });
      },
      (error) => {
        finish(() => {
          unsubscribe?.();
          reject(error);
        });
      },
    );
  });
}
