"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GeorefProcessoDef } from "@/lib/georeferenciamento/processos";

type Props = {
  processo: GeorefProcessoDef;
};

export function GeorefProcessoEtapas({ processo }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{processo.titulo}</CardTitle>
        <CardDescription>{processo.descricao}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4 border-l-2 border-primary/30 pl-4">
          {processo.etapas.map((etapa) => (
            <li key={etapa.ordem} className="relative">
              <span className="absolute -left-[1.35rem] flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {etapa.ordem}
              </span>
              <p className="font-medium">{etapa.titulo}</p>
              <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
