"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OfficeProcess } from "@/lib/gestao-processos/types";
import { Loader2 } from "lucide-react";

type ProtocolarProcessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  process: OfficeProcess | null;
  saving?: boolean;
  onConfirm: (values: { numeroProcesso: string; dataProtocolo: string }) => void | Promise<void>;
};

export function ProtocolarProcessDialog({
  open,
  onOpenChange,
  process,
  saving,
  onConfirm,
}: ProtocolarProcessDialogProps) {
  const [numeroProcesso, setNumeroProcesso] = React.useState("");
  const [dataProtocolo, setDataProtocolo] = React.useState("");

  React.useEffect(() => {
    if (!open || !process) return;
    setNumeroProcesso(process.numeroProcesso?.trim() && process.numeroProcesso !== "—"
      ? process.numeroProcesso
      : "");
    setDataProtocolo(
      process.dataProtocolo ?? new Date().toISOString().slice(0, 10),
    );
  }, [open, process]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Protocolar processo</DialogTitle>
          <DialogDescription>
            Ao confirmar, o processo passa do pipeline de consultoria para o
            pipeline do órgão (tramitação pós-protocolo).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="proto-num">Número SEI / SLA *</Label>
            <Input
              id="proto-num"
              value={numeroProcesso}
              onChange={(e) => setNumeroProcesso(e.target.value)}
              placeholder="0000.00.000000/0000-00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proto-data">Data de protocolo</Label>
            <Input
              id="proto-data"
              type="date"
              value={dataProtocolo}
              onChange={(e) => setDataProtocolo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving || !numeroProcesso.trim()}
            onClick={() =>
              void onConfirm({
                numeroProcesso: numeroProcesso.trim(),
                dataProtocolo,
              })
            }
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirmar protocolo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
