"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  SOCIOAMBIENTAL_REPORT_BLOCKS,
  type SocioambientalReportBlockId,
} from "@/lib/socioambiental/report-blocks-catalog";
import { cn } from "@/lib/utils";

export type SocioambientalReportPickerProps = {
  selected: SocioambientalReportBlockId[];
  onChange: (ids: SocioambientalReportBlockId[]) => void;
  disabled?: boolean;
  className?: string;
};

export function SocioambientalReportPicker({
  selected,
  onChange,
  disabled,
  className,
}: SocioambientalReportPickerProps) {
  const allIds = React.useMemo(
    () => SOCIOAMBIENTAL_REPORT_BLOCKS.map((b) => b.id),
    [],
  );
  const allSelected = selected.length === allIds.length;

  const toggle = (id: SocioambientalReportBlockId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Pacote de relatórios</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange(allSelected ? [] : [...allIds])}
        >
          {allSelected ? "Desmarcar todos" : "Selecionar todos"}
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {SOCIOAMBIENTAL_REPORT_BLOCKS.map((block) => {
          const checked = selected.includes(block.id);
          return (
            <label
              key={block.id}
              className={cn(
                "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
                checked ? "border-primary/50 bg-primary/5" : "border-border",
                disabled && "pointer-events-none opacity-60",
              )}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => toggle(block.id)}
                className="mt-0.5"
              />
              <span className="min-w-0 space-y-0.5">
                <Label className="cursor-pointer text-sm font-medium leading-tight">
                  {block.title}
                </Label>
                <span className="block text-xs text-muted-foreground">
                  {block.description}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {block.layerIds.length} camada
                  {block.layerIds.length === 1 ? "" : "s"}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
