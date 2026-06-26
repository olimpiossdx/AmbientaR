"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { OutorgaChecklistDocumento } from "@/lib/types";
import { checklistProgress } from "@/lib/outorga-processo";

type Props = {
  items: OutorgaChecklistDocumento[];
  onChange: (items: OutorgaChecklistDocumento[]) => void;
  readOnly?: boolean;
};

export function OutorgaChecklistDocumentos({
  items,
  onChange,
  readOnly,
}: Props) {
  const progress = checklistProgress(items);
  const pct =
    progress.total > 0
      ? Math.round((progress.cumpridos / progress.total) * 100)
      : 0;

  const toggle = (id: string, cumprido: boolean) => {
    onChange(
      items.map((it) => (it.id === id ? { ...it, cumprido } : it)),
    );
  };

  const setAnexo = (id: string, anexoUrl: string) => {
    onChange(
      items.map((it) =>
        it.id === id ? { ...it, anexoUrl: anexoUrl || undefined } : it,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {progress.cumpridos} de {progress.total} itens
          </span>
          {progress.obrigatoriosPendentes > 0 && (
            <span className="text-amber-600 dark:text-amber-500">
              {progress.obrigatoriosPendentes} obrigatório(s) pendente(s)
            </span>
          )}
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border p-3 space-y-2 bg-card"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id={`chk-${item.id}`}
                checked={item.cumprido}
                disabled={readOnly}
                onCheckedChange={(v) => toggle(item.id, v === true)}
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`chk-${item.id}`}
                  className="text-sm font-medium leading-snug cursor-pointer"
                >
                  {item.label}
                  {item.obrigatorio && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
              </div>
            </div>
            {!readOnly && (
              <Input
                className="text-xs h-8"
                placeholder="URL do anexo (opcional)"
                value={item.anexoUrl ?? ""}
                onChange={(e) => setAnexo(item.id, e.target.value)}
              />
            )}
            {readOnly && item.anexoUrl && (
              <a
                href={item.anexoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline"
              >
                Ver anexo
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
