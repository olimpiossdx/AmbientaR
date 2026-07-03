import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  type Firestore,
} from "firebase/firestore";
import { getOfflineDb } from "./db";
import type { OutboxOperation } from "./types";

function now() {
  return Date.now();
}

/**
 * Enfileira uma escrita Firestore (ou replay HTTP) para quando houver rede.
 * O Firestore SDK já enfileira offline em muitos casos; isto serve para
 * operações explícitas, reconciliação e futuros replays de `/api/*`.
 */
export async function enqueueOutboxOperation(
  partial: Omit<OutboxOperation, "status" | "createdAt" | "updatedAt">,
): Promise<void> {
  if (typeof window === "undefined") return;
  const db = getOfflineDb();
  const ts = now();
  const row: OutboxOperation = {
    ...partial,
    status: "pending",
    createdAt: ts,
    updatedAt: ts,
  };
  await db.outbox.put(row);
}

/**
 * Processa fila outbox contra Firestore / fetch. Idempotente por execução (limite em lote).
 */
export async function runSyncPass(
  firestore: Firestore | null,
  isOnline: boolean,
): Promise<{ pushed: number; errors: number }> {
  if (typeof window === "undefined" || !isOnline || !firestore) {
    return { pushed: 0, errors: 0 };
  }

  const db = getOfflineDb();
  const pending = await db.outbox.where("status").equals("pending").limit(40).toArray();
  let pushed = 0;
  let errors = 0;

  for (const op of pending) {
    const t = now();
    await db.outbox.update(op.id, { status: "processing", updatedAt: t });
    try {
      if (op.kind === "firestore.set") {
        const data = op.payloadJson ? JSON.parse(op.payloadJson) : {};
        await setDoc(doc(firestore, op.target), data, { merge: true });
      } else if (op.kind === "firestore.update") {
        const data = op.payloadJson ? JSON.parse(op.payloadJson) : {};
        await updateDoc(doc(firestore, op.target), data);
      } else if (op.kind === "firestore.delete") {
        await deleteDoc(doc(firestore, op.target));
      } else if (op.kind === "http_fetch") {
        const init = op.payloadJson
          ? (JSON.parse(op.payloadJson) as RequestInit)
          : undefined;
        const res = await fetch(op.target, { ...init, method: op.method ?? "POST" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} em ${op.target}`);
        }
      }
      await db.outbox.update(op.id, {
        status: "done",
        updatedAt: now(),
        errorMessage: undefined,
      });
      pushed++;
    } catch (e) {
      errors++;
      await db.outbox.update(op.id, {
        status: "error",
        updatedAt: now(),
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { pushed, errors };
}
