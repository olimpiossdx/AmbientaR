"use client";

import type { MergePreviewRow } from "@/lib/record-merge-utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DuplicateMergePreviewProps = {
  rows: MergePreviewRow[];
  recordNamesById?: Map<string, string>;
  className?: string;
};

export function DuplicateMergePreview({
  rows,
  recordNamesById,
  className,
}: DuplicateMergePreviewProps) {
  const changedRows = rows.filter((r) => r.changed);
  if (rows.length === 0) return null;

  return (
    <Collapsible className={cn("mt-2", className)}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs text-muted-foreground"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          Pré-visualizar fusão
          {changedRows.length > 0 && (
            <span className="text-foreground">
              ({changedRows.length} campo(s) alterado(s))
            </span>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="overflow-x-auto mt-1">
          <table className="w-full text-xs border rounded-md overflow-hidden">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="p-2 font-medium">Campo</th>
                <th className="p-2 font-medium">Atual (canônico)</th>
                <th className="p-2 font-medium">Após fusão</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.field}
                  className={cn("border-t", row.changed && "bg-amber-500/5")}
                >
                  <td className="p-2 text-muted-foreground">{row.label}</td>
                  <td className="p-2 break-all">{row.canonicalValue}</td>
                  <td className="p-2 break-all">
                    {row.mergedValue}
                    {row.changed && row.sourceId && (
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        de:{" "}
                        {recordNamesById?.get(row.sourceId) ||
                          row.sourceId.slice(0, 8)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
