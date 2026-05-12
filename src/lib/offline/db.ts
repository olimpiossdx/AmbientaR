import Dexie, { type Table } from "dexie";
import type { OutboxOperation, SyncCheckpoint } from "./types";

const DB_NAME = "AmbientaROffline";
const DB_VERSION = 1;

class OfflineDexie extends Dexie {
  outbox!: Table<OutboxOperation, string>;
  syncCheckpoints!: Table<SyncCheckpoint, string>;
  /** Fila de uploads para Firebase Storage (bytes locais até enviar). */
  storageQueue!: Table<
    {
      id: string;
      storagePath: string;
      contentType: string;
      bytes: ArrayBuffer | null;
      status: "pending" | "uploading" | "done" | "error";
      firestoreDocPath?: string;
      firestoreField?: string;
      errorMessage?: string;
      createdAt: number;
      updatedAt: number;
    },
    string
  >;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      outbox: "id, status, createdAt",
      syncCheckpoints: "key, lastSyncedAt",
      storageQueue: "id, status, createdAt",
    });
  }
}

let dbSingleton: OfflineDexie | null = null;

/** IndexedDB só no cliente. */
export function getOfflineDb(): OfflineDexie {
  if (typeof window === "undefined") {
    throw new Error("getOfflineDb só pode ser chamado no browser.");
  }
  if (!dbSingleton) {
    dbSingleton = new OfflineDexie();
  }
  return dbSingleton;
}

export function resetOfflineDbForTests(): void {
  dbSingleton = null;
}
