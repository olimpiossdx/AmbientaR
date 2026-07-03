"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMPENSACAO_TIPOS } from "@/lib/compensacao-ambiental/config";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  Leaf,
  Mountain,
  Scale,
  TreeDeciduous,
  Gem,
  Droplets,
} from "lucide-react";
import type { CompensacaoTipo } from "@/lib/compensacao-ambiental/config";
import type { LucideIcon } from "lucide-react";

const TIPO_ICONS: Record<CompensacaoTipo, LucideIcon> = {
  especies: TreeDeciduous,
  snuc: Scale,
  "mata-atlantica": Leaf,
  mineraria: Gem,
  app: Droplets,
};

export function CompensacaoAmbientalHubView() {
  const sorted = [...COMPENSACAO_TIPOS].sort((a, b) => a.faseImplementacao - b.faseImplementacao);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Compensação Ambiental">
        <Button variant="outline" size="sm" className="gap-1" asChild>
          <a
            href="https://www.ief.mg.gov.br/compensacao-ambiental"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            IEF — Compensação
          </a>
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como usar este módulo</CardTitle>
            <CardDescription>
              Cada tipo de compensação é um processo separado. Use o checklist para reunir a documentação,
              faça upload dos modelos Word oficiais do IEF e copie o índice de juntada para o SEI!MG.
              Com login, cada checklist grava em Firestore ({`compensacao_drafts`}, um rascunho
              por tipo). Exportação PDF/Word automática continua planeada.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Ordem sugerida:</strong> espécies protegidas → SNUC → Mata
              Atlântica → minerária → APP.
            </p>
            <p>
              Documentação de referência:{" "}
              <code className="text-xs bg-muted px-1 rounded">docs/COMPENSACAO-AMBIENTAL-CHECKLIST.md</code>
            </p>
            <p className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" size="sm" className="gap-1" asChild>
                <Link href="/studies/pia">
                  <FileText className="h-4 w-4" />
                  PIA
                </Link>
              </Button>
              <Button variant="secondary" size="sm" className="gap-1" asChild>
                <Link href="/studies/prada">
                  <Mountain className="h-4 w-4" />
                  PRADA
                </Link>
              </Button>
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((meta) => {
            const Icon = TIPO_ICONS[meta.tipo];
            return (
              <Card key={meta.tipo} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{meta.shortLabel}</CardTitle>
                        <CardDescription className="line-clamp-2">{meta.label}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      Fase {meta.faseImplementacao}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="text-sm text-muted-foreground flex-1">{meta.description}</p>
                  {meta.processoSei && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">SEI:</span> {meta.processoSei}
                    </p>
                  )}
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                    {meta.legislacao.slice(0, 2).map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" className="gap-1" asChild>
                      <Link href={`/studies/compensacao-ambiental/${meta.tipo}`}>
                        Abrir checklist
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1" asChild>
                      <a href={meta.referenciaIef} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        IEF
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
