"use client";

import { useCallback } from "react";
import { usePreparedUpload, type UsePreparedUploadOptions } from "@/hooks/use-prepared-upload";
import {
  uploadFileToStorage,
  sanitizeStorageFileName,
} from "@/lib/storage-upload";

export type UseStorageFileUploadOptions = UsePreparedUploadOptions & {
  /** Pasta no Storage (ex.: `invoices`, `condicionantes`). */
  storageFolder: string;
  /** Caminho completo no bucket; se omitido, usa `{storageFolder}/{timestamp}-{nome}`. */
  buildStoragePath?: (file: File, safeName: string) => string;
};

/**
 * Upload para Firebase Storage com preparação/compressão automática quando excede o limite.
 */
export function useStorageFileUpload({
  storageFolder,
  buildStoragePath,
  ...contextOptions
}: UseStorageFileUploadOptions) {
  const folder = storageFolder.replace(/\/$/, "");
  const { prepareFile, dialogProps, limitLabel, maxBytes, context } =
    usePreparedUpload({
      ...contextOptions,
      storagePathPrefix:
        contextOptions.storagePathPrefix ?? `${folder}/`,
    });

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      const prepared = await prepareFile(file);
      if (!prepared) return null;
      const safe = sanitizeStorageFileName(prepared.name);
      const storagePath = buildStoragePath
        ? buildStoragePath(prepared, safe)
        : `${folder}/${Date.now()}-${safe}`;
      return uploadFileToStorage(prepared, storagePath);
    },
    [prepareFile, folder, buildStoragePath],
  );

  return {
    uploadFile,
    dialogProps,
    limitLabel,
    maxBytes,
    context,
  };
}
