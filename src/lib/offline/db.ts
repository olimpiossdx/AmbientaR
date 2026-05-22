import Dexie, { type Table } from "dexie";
import type { OutboxOperation, SyncCheckpoint } from "./types";

const DB_NAME = "AmbientaROffline";
const DB_VERSION = 1;

export type ColetaPendingRow = {
  id: string;
  collection: string;
  campanhaId?: string;
  updatedAt: number;
  syncStatus: "pending" | "synced";
};

class OfflineDexie extends Dexie {
  outbox!: Table<OutboxOperation, string>;
  syncCheckpoints!: Table<SyncCheckpoint, string>;
  /** Metadados de writes de coleta de campo aguardando sync. */
  coletaPending!: Table<ColetaPendingRow, string>;
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
    this.version(1).stores({
      outbox: "id, status, createdAt",
      syncCheckpoints: "key, lastSyncedAt",
      storageQueue: "id, status, createdAt",
    });
    this.version(2).stores({
      outbox: "id, status, createdAt",
      syncCheckpoints: "key, lastSyncedAt",
      storageQueue: "id, status, createdAt",
      coletaPending: "id, syncStatus, campanhaId, updatedAt",
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
