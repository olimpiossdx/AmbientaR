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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import type { OfficeProcessImportPreview } from "@/lib/gestao-processos/types";
import { parseOfficeProcessFile } from "@/lib/gestao-processos/excel";
import { OFFICE_PROCESS_FASE_LABELS } from "@/lib/gestao-processos/utils";

type ExcelImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importing?: boolean;
  onConfirm: (
    preview: OfficeProcessImportPreview,
    options: { seedValidation: boolean },
  ) => void | Promise<void>;
};

export function ExcelImportDialog({
  open,
  onOpenChange,
  importing,
  onConfirm,
}: ExcelImportDialogProps) {
  const [preview, setPreview] = React.useState<OfficeProcessImportPreview | null>(
    null,
  );
  const [seedValidation, setSeedValidation] = React.useState(false);
  const [parsing, setParsing] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setPreview(null);
      setSeedValidation(false);
    }
  }, [open]);

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const result = await parseOfficeProcessFile(file);
      setPreview(result);
    } finally {
      setParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar planilha Excel</DialogTitle>
          <DialogDescription>
            Aba PROCESSO com colunas: PROCESSO, EMPREENDEDOR, EMPREENDIMENTO,
            MUNICIPIO, TIPO DE INTERVENÇÃO, PROJETO (código ou nome), STATUS, PRAZO.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={parsing}
              onClick={() => fileRef.current?.click()}
            >
              {parsing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Selecionar arquivo
            </Button>
            <div className="flex items-center gap-2">
              <Checkbox
                id="seedValidation"
                checked={seedValidation}
                onCheckedChange={(v) => setSeedValidation(v === true)}
              />
              <Label htmlFor="seedValidation" className="text-sm font-normal">
                Marcar como dados de validação (podem ser apagados depois)
              </Label>
            </div>
          </div>

          {preview?.errors.length ? (
            <Alert variant="destructive">
              <AlertTitle>Erros na planilha</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 text-sm">
                  {preview.errors.map((e) => (
                    <li key={`${e.rowNumber}-${e.message}`}>
                      Linha {e.rowNumber}: {e.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {preview?.duplicatesInFile.length ? (
            <Alert>
              <AlertTitle>Duplicatas no arquivo</AlertTitle>
              <AlertDescription>
                {preview.duplicatesInFile.join(", ")}
              </AlertDescription>
            </Alert>
          ) : null}

          {preview?.rows.length ? (
            <ScrollArea className="h-[min(50vh,360px)] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Processo</TableHead>
                    <TableHead>Empreendedor</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => (
                    <TableRow key={`${row.tipoProcesso}-${row.numeroProcesso}`}>
                      <TableCell className="font-mono text-xs">
                        {row.numeroProcesso}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">
                        {row.empreendedorName}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm">
                        {row.projetoRef ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm">
                        {row.statusDetalhe ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.fase ? OFFICE_PROCESS_FASE_LABELS[row.fase] : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={importing || !preview?.rows.length}
            onClick={() => preview && onConfirm(preview, { seedValidation })}
          >
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Importar {preview?.rows.length ?? 0} processo(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
