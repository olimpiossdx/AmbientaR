import { getApp, getApps } from "firebase/app";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { inferMimeTypeFromFileName } from "@/lib/file-mime";

function getFirebaseAppOrThrow() {
  if (typeof getApps === "function" && getApps().length === 0) {
    throw new Error("Firebase não inicializado. Recarregue a página.");
  }
  return getApp();
}

/** Sanitiza nome para usar em paths do Storage. */
export function sanitizeStorageFileName(name: string): string {
  return name.replace(/[^\w.\-]/g, "_") || "file";
}

/**
 * Envia um arquivo para o Firebase Storage e devolve a URL de download (HTTPS).
 */
export async function uploadFileToStorage(
  file: File,
  storagePath: string,
): Promise<string> {
  const storage = getStorage(getFirebaseAppOrThrow());
  const storageRef = ref(storage, storagePath);
  const contentType =
    (file.type && file.type.trim()) ||
    inferMimeTypeFromFileName(file.name) ||
    "application/octet-stream";
  try {
    await uploadBytes(storageRef, file, { contentType });
    return await getDownloadURL(storageRef);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === "storage/unauthorized") {
      throw new Error(
        "Sem permissão no Firebase Storage (storage/unauthorized). " +
          "Confirme se as regras do Storage foram publicadas (npm run deploy:storage).",
      );
    }
    throw new Error(err?.message || "Falha no upload.");
  }
}

/**
 * Remove objeto pelo path completo no bucket (ex.: `licenses/foo.pdf`).
 */
export async function deleteFileAtStoragePath(
  storagePath: string,
): Promise<void> {
  const storage = getStorage(getFirebaseAppOrThrow());
  await deleteObject(ref(storage, storagePath));
}

/**
 * Extrai o path do objeto a partir da URL pública do Firebase Storage (para DELETE).
 * Retorna null se não for uma URL reconhecida.
 */
export function storagePathFromDownloadUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("firebasestorage.googleapis.com")) {
      return null;
    }
    const parts = u.pathname.split("/");
    const oIdx = parts.indexOf("o");
    if (oIdx < 0 || !parts[oIdx + 1]) return null;
    return decodeURIComponent(parts[oIdx + 1]);
  } catch {
    return null;
  }
}
