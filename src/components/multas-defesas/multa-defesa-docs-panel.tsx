"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MULTA_DEFESA_DOCS_ANEXAR,
  MULTA_DEFESA_DOCS_PROTOCOLO,
  countRequiredDocs,
} from "@/lib/multas-defesas/docs-template";
import type { MultaDefesaDocumentState } from "@/lib/multas-defesas/types";
import { ACCEPTED_DEFESA_EXTENSIONS, getExt } from "@/lib/multas-defesas/utils";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";

type Props = {
  documents: MultaDefesaDocumentState[];
  phaseFilter: "instrucao" | "protocolo";
  disabled?: boolean;
  uploadingDocId: string | null;
  onToggle: (id: string, checked: boolean) => void;
  onFileUpload: (id: string, file: File) => void;
  opts: { isPj?: boolean; hasProcurador?: boolean; requiresTaxaExpediente?: boolean };
};

export function MultaDefesaDocsPanel({
  documents,
  phaseFilter,
  disabled,
  uploadingDocId,
  onToggle,
  onFileUpload,
  opts,
}: Props) {
  const { toast } = useToast();
  const template =
    phaseFilter === "instrucao"
      ? MULTA_DEFESA_DOCS_ANEXAR
      : MULTA_DEFESA_DOCS_PROTOCOLO;
  const rows = documents.filter((d) => template.some((t) => t.id === d.id));
  const counts =
    phaseFilter === "instrucao"
      ? countRequiredDocs(documents, opts)
      : { done: rows.filter((r) => r.checked && r.fileUrl).length, total: rows.length };

  const handleFile = (id: string, file: File | null) => {
    if (!file) return;
    const ext = getExt(file.name);
    if (!ACCEPTED_DEFESA_EXTENSIONS.includes(ext)) {
      toast({
        variant: "destructive",
        title: "Formato não permitido",
        description: `Use: ${ACCEPTED_DEFESA_EXTENSIONS.join(", ")}`,
      });
      return;
    }
    onFileUpload(id, file);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {phaseFilter === "instrucao" ? "Documentos a apensar" : "Protocolo"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {counts.done} de {counts.total} obrigatório(s) concluído(s)
        </span>
      </div>
      <div className="space-y-3 rounded-md border p-3">
        {rows.map((doc) => (
          <div
            key={doc.id}
            className="grid gap-2 md:grid-cols-[1fr_auto] items-start border-b border-border/50 pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-start gap-2">
              <Checkbox
                checked={doc.checked}
                disabled={disabled}
                onCheckedChange={(c) => onToggle(doc.id, !!c)}
              />
              <div>
                <span className="text-sm font-medium">{doc.label}</span>
                {doc.requirement !== "opcional" && (
                  <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">
                    obrigatório
                  </span>
                )}
                {doc.fileName && (
                  <p className="text-xs text-muted-foreground mt-0.5">{doc.fileName}</p>
                )}
                {doc.helpUrl && (
                  <a
                    href={doc.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary mt-1"
                  >
                    Orientação SEMAD <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
            <Input
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              disabled={disabled || uploadingDocId === doc.id}
              className="max-w-[280px]"
              onChange={(e) => handleFile(doc.id, e.target.files?.[0] || null)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
