"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CarStoredFile } from "@/lib/types";
import {
  FileText,
  Loader2,
  Map as MapIcon,
  Trash2,
  Upload,
} from "lucide-react";

type Props = {
  label: string;
  description?: string;
  accept: string;
  files: CarStoredFile[];
  uploading: boolean;
  limitLabel?: string;
  fileKind: "pdf" | "geometry";
  onFilesAdded: (files: File[]) => void;
  onRemove: (index: number) => void;
  className?: string;
};

export function CarFileUploadZone({
  label,
  description,
  accept,
  files,
  uploading,
  limitLabel,
  fileKind,
  onFilesAdded,
  onRemove,
  className,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    onFilesAdded(Array.from(fileList));
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    if (uploading) return;
    handleFiles(event.dataTransfer.files);
  };

  const FileIcon = fileKind === "pdf" ? FileText : MapIcon;

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!uploading) inputRef.current?.click();
          }
        }}
        onClick={() => {
          if (!uploading) inputRef.current?.click();
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex min-h-[7rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/30",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">
          {uploading
            ? "Enviando arquivos..."
            : "Arraste arquivos aqui ou clique para selecionar"}
        </p>
        {limitLabel ? (
          <p className="text-xs text-muted-foreground">Até {limitLabel} cada</p>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{files.length}</span>{" "}
        arquivo(s) carregado(s)
      </p>

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.url}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{file.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="ghost" size="sm" asChild>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemove(index)}
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remover</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs italic text-muted-foreground">
          Nenhum arquivo carregado ainda.
        </p>
      )}
    </div>
  );
}
