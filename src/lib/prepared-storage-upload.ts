"use client";

import {
  uploadFileToStorage,
  sanitizeStorageFileName,
} from "@/lib/storage-upload";
import type { UploadContext } from "@/lib/upload-limits";
import { getUploadMaxBytes } from "@/lib/upload-limits";

export { getUploadMaxBytes, formatUploadLimitMb, uploadSizeErrorMessage } from "@/lib/upload-limits";
export type { UploadContext };

export async function uploadPreparedFileToStorage(
  file: File,
  storagePath: string,
  context: UploadContext = {},
): Promise<string> {
  const maxBytes = getUploadMaxBytes(context);
  if (file.size > maxBytes) {
    throw new Error(
      `Arquivo ainda excede o limite de ${maxBytes / 1024 / 1024} MB após preparação.`,
    );
  }
  return uploadFileToStorage(file, storagePath);
}

export function buildStoragePath(
  folder: string,
  fileName: string,
  uniqueSuffix?: string,
): string {
  const safe = sanitizeStorageFileName(fileName);
  const suffix = uniqueSuffix ?? `${Date.now()}`;
  return `${folder.replace(/\/$/, "")}/${suffix}-${safe}`;
}
