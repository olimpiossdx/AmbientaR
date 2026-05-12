import { getApp } from "firebase/app";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { doc, updateDoc, type Firestore } from "firebase/firestore";
import { getOfflineDb } from "./db";

export type EnqueueStorageUploadInput = {
  /** Caminho completo no bucket (ex.: `inventoryPhotos/proj/x.jpg`). */
  storagePath: string;
  contentType: string;
  file: Blob;
  /** Opcional: atualizar campo no Firestore após upload (path completo `coleção/id`). */
  firestoreDocPath?: string;
  firestoreField?: string;
};

/**
 * Guarda bytes em IndexedDB e marca como pendente até `processStorageQueue` correr online.
 */
export async function enqueueStorageUpload(
  input: EnqueueStorageUploadInput,
): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("enqueueStorageUpload só no browser.");
  }
  const db = getOfflineDb();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sq_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const bytes = await input.file.arrayBuffer();
  const ts = Date.now();
  await db.storageQueue.add({
    id,
    storagePath: input.storagePath,
    contentType: input.contentType,
    bytes,
    status: "pending",
    firestoreDocPath: input.firestoreDocPath,
    firestoreField: input.firestoreField,
    createdAt: ts,
    updatedAt: ts,
  });
  return id;
}

/**
 * Envia ficheiros pendentes para Firebase Storage e opcionalmente atualiza Firestore.
 */
export async function processStorageQueue(
  firestore: Firestore | null,
): Promise<{ uploaded: number; errors: number }> {
  if (typeof window === "undefined" || !firestore || !navigator.onLine) {
    return { uploaded: 0, errors: 0 };
  }

  const db = getOfflineDb();
  const pending = await db.storageQueue
    .where("status")
    .equals("pending")
    .limit(10)
    .toArray();

  const storage = getStorage(getApp());
  let uploaded = 0;
  let errors = 0;

  for (const row of pending) {
    if (!row.bytes?.byteLength) continue;
    const t = Date.now();
    await db.storageQueue.update(row.id, { status: "uploading", updatedAt: t });
    try {
      const storageRef = ref(storage, row.storagePath);
      await uploadBytes(storageRef, row.bytes, { contentType: row.contentType });
      const url = await getDownloadURL(storageRef);
      if (row.firestoreDocPath && row.firestoreField) {
        await updateDoc(doc(firestore, row.firestoreDocPath), {
          [row.firestoreField]: url,
        });
      }
      await db.storageQueue.update(row.id, {
        status: "done",
        bytes: null,
        updatedAt: Date.now(),
        errorMessage: undefined,
      });
      uploaded++;
    } catch (e) {
      errors++;
      await db.storageQueue.update(row.id, {
        status: "error",
        updatedAt: Date.now(),
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { uploaded, errors };
}
