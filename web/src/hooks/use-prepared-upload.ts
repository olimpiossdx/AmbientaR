"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  getUploadMaxBytes,
  formatUploadLimitMb,
  type UploadContext,
} from "@/lib/upload-limits";
import {
  prepareFileForUpload,
  needsUploadPreparation,
  revokePrepareFilePreview,
  type PrepareFileResult,
} from "@/lib/upload-pipeline";

export type UsePreparedUploadOptions = UploadContext;

type DialogState = {
  open: boolean;
  fileName: string;
  originalSize: number;
  phase: "compressing" | "review" | "error";
  progress: number;
  progressMessage: string;
  result: PrepareFileResult | null;
  errorMessage: string | null;
};

const initialDialog: DialogState = {
  open: false,
  fileName: "",
  originalSize: 0,
  phase: "compressing",
  progress: 0,
  progressMessage: "",
  result: null,
  errorMessage: null,
};

/**
 * Prepara arquivo para upload (comprime se exceder limite) e expõe diálogo de revisão.
 */
export function usePreparedUpload(options: UsePreparedUploadOptions = {}) {
  const pathname = usePathname();
  const context = React.useMemo<UploadContext>(
    () => ({
      pathname: options.pathname ?? pathname ?? undefined,
      storagePathPrefix: options.storagePathPrefix,
    }),
    [options.pathname, options.storagePathPrefix, pathname],
  );

  const maxBytes = React.useMemo(() => getUploadMaxBytes(context), [context]);
  const limitLabel = React.useMemo(() => formatUploadLimitMb(context), [context]);

  const [dialog, setDialog] = React.useState<DialogState>(initialDialog);
  const resolveRef = React.useRef<((file: File | null) => void) | null>(null);

  const closeDialog = React.useCallback(() => {
    setDialog((d) => {
      if (d.result) revokePrepareFilePreview(d.result);
      return initialDialog;
    });
  }, []);

  const prepareFile = React.useCallback(
    (file: File): Promise<File | null> => {
      if (!needsUploadPreparation(file, maxBytes)) {
        return Promise.resolve(file);
      }

      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setDialog({
          open: true,
          fileName: file.name,
          originalSize: file.size,
          phase: "compressing",
          progress: 0,
          progressMessage: "Iniciando otimização…",
          result: null,
          errorMessage: null,
        });

        void (async () => {
          try {
            const result = await prepareFileForUpload(file, {
              maxBytes,
              onProgress: (pct, message) => {
                setDialog((d) => ({
                  ...d,
                  phase: "compressing",
                  progress: pct,
                  progressMessage: message,
                }));
              },
            });
            setDialog((d) => ({
              ...d,
              phase: "review",
              progress: 100,
              progressMessage: "Concluído",
              result,
            }));
          } catch (e) {
            const message =
              e instanceof Error ? e.message : "Falha ao preparar o arquivo.";
            setDialog((d) => ({
              ...d,
              phase: "error",
              errorMessage: message,
            }));
          }
        })();
      });
    },
    [maxBytes],
  );

  const handleConfirm = React.useCallback(() => {
    const result = dialog.result;
    const resolve = resolveRef.current;
    resolveRef.current = null;
    if (result && resolve) {
      resolve(result.file);
    }
    closeDialog();
  }, [dialog.result, closeDialog]);

  const handleCancel = React.useCallback(() => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    if (resolve) resolve(null);
    closeDialog();
  }, [closeDialog]);

  const dialogProps = {
    open: dialog.open,
    fileName: dialog.fileName,
    originalSize: dialog.originalSize,
    maxBytes,
    phase: dialog.phase,
    progress: dialog.progress,
    progressMessage: dialog.progressMessage,
    result: dialog.result,
    errorMessage: dialog.errorMessage,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  return {
    context,
    maxBytes,
    limitLabel,
    prepareFile,
    dialogProps,
  };
}
