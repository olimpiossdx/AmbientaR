"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GeorefChecklistItem } from "@/lib/georeferenciamento/processos";
import type { GeorefChecklistState } from "@/lib/georeferenciamento/types";

type GeorefChecklistProps = {
  titulo: string;
  descricao?: string;
  items: GeorefChecklistItem[];
  value: GeorefChecklistState;
  onChange?: (next: GeorefChecklistState) => void;
  readOnly?: boolean;
};

export function GeorefChecklist({
  titulo,
  descricao,
  items,
  value,
  onChange,
  readOnly = false,
}: GeorefChecklistProps) {
  const done = items.filter((i) => value[i.id]).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  const toggle = (id: string, checked: boolean) => {
    if (readOnly || !onChange) return;
    onChange({ ...value, [id]: checked });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{titulo}</CardTitle>
        {descricao ? <CardDescription>{descricao}</CardDescription> : null}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {done} de {items.length} itens
            </span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-md border p-3"
          >
            <Checkbox
              id={item.id}
              checked={!!value[item.id]}
              disabled={readOnly}
              onCheckedChange={(c) => toggle(item.id, c === true)}
            />
            <div className="grid gap-1 leading-none">
              <Label htmlFor={item.id} className="cursor-pointer font-medium">
                {item.label}
                {item.obrigatorio ? (
                  <span className="ml-1 text-destructive">*</span>
                ) : null}
              </Label>
              {item.hint ? (
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
