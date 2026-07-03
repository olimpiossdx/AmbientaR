"use client";

/* eslint-disable @next/next/no-img-element -- Preview temporário do arquivo preparado pode usar URL blob gerada no navegador. */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatBytesHuman } from "@/lib/upload-limits";
import type { PrepareFileResult } from "@/lib/upload-pipeline";
import { revokePrepareFilePreview } from "@/lib/upload-pipeline";

export type UploadPreparationDialogProps = {
  open: boolean;
  fileName: string;
  originalSize: number;
  maxBytes: number;
  phase: "compressing" | "review" | "error";
  progress: number;
  progressMessage: string;
  result: PrepareFileResult | null;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function UploadPreparationDialog({
  open,
  fileName,
  originalSize,
  maxBytes,
  phase,
  progress,
  progressMessage,
  result,
  errorMessage,
  onConfirm,
  onCancel,
}: UploadPreparationDialogProps) {
  React.useEffect(() => {
    if (!open && result) {
      revokePrepareFilePreview(result);
    }
  }, [open, result]);

  const reductionPct =
    result && originalSize > 0
      ? Math.round((1 - result.finalSize / originalSize) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Preparar arquivo para envio</DialogTitle>
          <DialogDescription>
            {fileName} — limite do sistema: {formatBytesHuman(maxBytes)}
          </DialogDescription>
        </DialogHeader>

        {phase === "compressing" && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{progressMessage}</p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Original: {formatBytesHuman(originalSize)}
            </p>
          </div>
        )}

        {phase === "error" && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {phase === "review" && result && (
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Tamanho original</p>
                <p className="font-medium">{formatBytesHuman(originalSize)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Após otimização</p>
                <p className="font-medium">{formatBytesHuman(result.finalSize)}</p>
              </div>
            </div>
            {reductionPct > 0 && (
              <p className="text-sm text-muted-foreground">
                Redução aproximada: {reductionPct}%
                {result.effectiveDpi != null
                  ? ` · Resolução efetiva ~${result.effectiveDpi} DPI (1ª página)`
                  : null}
              </p>
            )}
            {result.warnings.map((w) => (
              <Alert key={w}>
                <AlertDescription>{w}</AlertDescription>
              </Alert>
            ))}
            {result.previewUrl && (
              <div className="rounded-md border bg-muted/30 overflow-hidden">
                {result.rasterizedPdf || result.method === "pdf-raster" ? (
                  <iframe
                    title="Pré-visualização do PDF"
                    src={result.previewUrl}
                    className="w-full h-[min(420px,50vh)]"
                  />
                ) : (
                  <img
                    src={result.previewUrl}
                    alt="Pré-visualização"
                    className="max-h-[min(420px,50vh)] w-full object-contain"
                  />
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Verifique se a legibilidade atende antes de confirmar o envio.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          {phase === "review" && result && (
            <Button type="button" onClick={onConfirm}>
              Usar arquivo otimizado e continuar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
