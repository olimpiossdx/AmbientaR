import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import {
  getClientFirebaseStorage,
  getFirebaseAppOrThrow,
} from "@/lib/firebase-storage-client";

export { getFirebaseAppOrThrow };
import { inferMimeTypeFromFileName } from "@/lib/file-mime";
import {
  buildLimitErrorMessage,
  getPackageLimits,
  isPackageLimitsExempt,
  isSubjectToPackageLimits,
  type PackageLimits,
} from "@/lib/package-limits";
import type { AppUser } from "@/lib/types";

/** Sanitiza nome para usar em paths do Storage. */
export function sanitizeStorageFileName(name: string): string {
  return name.replace(/[^\w.\-]/g, "_") || "file";
}

/** Valida tamanho do arquivo contra o plano do portal (cliente autônomo / titular). */
export function assertFileAllowedForPackage(
  file: File,
  user: Pick<AppUser, "role" | "package" | "platformPaymentStatus"> | null | undefined,
): PackageLimits | null {
  if (!user || !isSubjectToPackageLimits(user) || isPackageLimitsExempt(user)) {
    return null;
  }
  const limits = getPackageLimits(user);
  if (!limits.allowsStorageUpload || limits.maxTotalFiles <= 0) {
    throw new Error(buildLimitErrorMessage("upload_not_allowed", limits));
  }
  if (file.size > limits.maxFileSizeBytes) {
    throw new Error(buildLimitErrorMessage("file_too_large", limits));
  }
  return limits;
}

/**
 * Envia um arquivo para o Firebase Storage e devolve a URL de download (HTTPS).
 */
export async function uploadFileToStorage(
  file: File,
  storagePath: string,
): Promise<string> {
  if (!storagePath?.trim()) {
    throw new Error("Caminho do Storage inválido para upload.");
  }
  const storage = getClientFirebaseStorage();
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
  if (!storagePath?.trim()) {
    throw new Error("Caminho do Storage inválido para upload.");
  }
  const storage = getClientFirebaseStorage();
  await deleteObject(ref(storage, storagePath));
}

/**
 * Extrai o path do objeto a partir da URL pública do Firebase Storage (para DELETE).
 * Retorna null se não for uma URL reconhecida.
 */
export function storagePathFromDownloadUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (
      !u.hostname.includes("firebasestorage.googleapis.com") &&
      !u.hostname.includes("firebasestorage.app")
    ) {
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
