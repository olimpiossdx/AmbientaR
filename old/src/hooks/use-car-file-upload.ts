"use client";

import * as React from "react";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import { isPdfLikeFile } from "@/lib/file-mime";
import { isGeometryCarFile } from "@/lib/car/car-files";
import type { CarStoredFile } from "@/lib/types";

export type CarUploadKind = "pdf" | "geometry";

export function useCarFileUpload() {
  const carUploadKindRef = React.useRef<"car" | "car-shp">("car");
  const { uploadFile, dialogProps, limitLabel } = useStorageFileUpload({
    storageFolder: "car",
    storagePathPrefix: "car/",
    buildStoragePath: (_file, safe) =>
      `${carUploadKindRef.current}/${Date.now()}-${safe}`,
  });

  const uploadCarFiles = React.useCallback(
    async (
      files: File[],
      kind: CarUploadKind,
      onInvalid?: (message: string) => void,
    ): Promise<CarStoredFile[]> => {
      const uploaded: CarStoredFile[] = [];
      for (const file of files) {
        if (kind === "pdf" && !isPdfLikeFile(file)) {
          onInvalid?.("Envie arquivos em PDF para o recibo do CAR.");
          continue;
        }
        if (kind === "geometry" && !isGeometryCarFile(file)) {
          onInvalid?.("Envie arquivos SHP ou ZIP para a geometria.");
          continue;
        }
        carUploadKindRef.current = kind === "pdf" ? "car" : "car-shp";
        const url = await uploadFile(file);
        if (url) uploaded.push({ url, name: file.name });
      }
      return uploaded;
    },
    [uploadFile],
  );

  return { uploadCarFiles, dialogProps, limitLabel };
}
