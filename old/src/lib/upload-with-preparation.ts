"use client";

import {
  prepareFileForUpload,
  needsUploadPreparation,
} from "@/lib/upload-pipeline";
import { getUploadMaxBytes, type UploadContext } from "@/lib/upload-limits";
import { uploadFileToStorage } from "@/lib/storage-upload";

export type UploadWithPreparationOptions = UploadContext & {
  onProgress?: (pct: number, message: string) => void;
};

/**
 * Prepara (comprime se necessário) e envia para o Storage.
 * Use com `usePreparedUpload` na UI quando o operador precisa rever a compressão.
 */
export async function uploadWithPreparation(
  file: File,
  storagePath: string,
  options: UploadWithPreparationOptions = {},
): Promise<string> {
  const maxBytes = getUploadMaxBytes(options);
  const toUpload = needsUploadPreparation(file, maxBytes)
    ? (
        await prepareFileForUpload(file, {
          maxBytes,
          onProgress: options.onProgress,
        })
      ).file
    : file;
  return uploadFileToStorage(toUpload, storagePath);
}
