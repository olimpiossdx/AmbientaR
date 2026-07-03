"use client";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import {
  GEOREF_REFERENCIAS,
  GEOREF_PRAZOS_OBRIGATORIEDADE,
} from "@/lib/georeferenciamento/referencias";

const CATEGORIA_LABEL: Record<string, string> = {
  fundiario: "Fundiário",
  ambiental: "Ambiental",
  cartorio: "Cartório",
  tecnico: "Técnico",
  mg: "Minas Gerais",
};

export function GeorefReferenciasView() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Referências normativas"
        description="Links oficiais e resumos para consulta rápida pela equipe técnica."
      />
      <main className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Portais e normas</CardTitle>
            <CardDescription>Fontes primárias recomendadas para georreferenciamento no Brasil.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {GEOREF_REFERENCIAS.map((ref) => (
              <div
                key={ref.id}
                className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{ref.titulo}</p>
                    <Badge variant="outline">{CATEGORIA_LABEL[ref.categoria] ?? ref.categoria}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ref.orgao}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{ref.descricao}</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0" asChild>
                  <a href={ref.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    Abrir
                  </a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Obrigatoriedade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {GEOREF_PRAZOS_OBRIGATORIEDADE.map((p) => (
              <div key={p.titulo} className="rounded-lg border p-4">
                <p className="font-medium">{p.titulo}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.texto}</p>
                <p className="mt-2 text-xs text-muted-foreground">Fonte: {p.fonte}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
