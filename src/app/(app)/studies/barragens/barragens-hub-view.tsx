"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowRight,
  Building2,
  Droplets,
  ExternalLink,
  FileText,
  Shield,
  Waves,
  AlertTriangle,
} from "lucide-react";

const MODULOS = [
  {
    href: "/studies/barragem",
    label: "Projeto técnico",
    description:
      "Memorial descritivo, hidrologia, dimensionamento do extravasor, implantação e exportação DOCX/PDF.",
    icon: FileText,
    status: "disponivel" as const,
  },
  {
    href: "/studies/seguranca-barragens",
    label: "Segurança e emergência",
    description:
      "PSB, inspeções, PAE e triagem de Dam Break. Vincule ao projeto técnico de barragem.",
    icon: Shield,
    status: "disponivel" as const,
  },
  {
    href: "/studies/piscinao-off-stream",
    label: "Piscinão (off-stream)",
    description:
      "Reservatórios fora do curso d'água. Cadastro com demanda, regularização e vínculos a projeto/outorga.",
    icon: Waves,
    status: "disponivel" as const,
  },
];

const CHECKLIST_PROJETO = [
  "Memorial descritivo e de cálculo",
  "Estudo hidrológico",
  "Dimensionamento do vertedouro / extravasor",
  "Projeto do maciço e drenagem",
  "Planta de implantação e seções",
  "ART do responsável técnico",
];

const CHECKLIST_SEGURANCA = [
  "Plano de Segurança da Barragem (PSB), quando aplicável",
  "Inspeções de segurança regular e especial",
  "Plano de Ação de Emergência (PAE), quando exigido",
  "Estudo de ruptura hipotética (Dam Break), quando aplicável",
  "Classificação CRI / DPA (preliminar, sujeita a revisão do RT)",
];

const RECURSOS_APP = [
  {
    titulo: "Projeto técnico",
    itens: [
      "Hidrologia: racional, Kirpich, vertedouro, cota-área-volume",
      "Rippl (regularização de vazão)",
      "Geotecnia: Bishop e Morgenstern-Price (meia-seno)",
      "Concreto gravidade: FS deslizamento, tombamento e tensões na base",
      "Exportação PDF/DOCX e memorial de cálculo",
    ],
  },
  {
    titulo: "Segurança e emergência",
    itens: [
      "PSB, inspeções, PAE e classificação CRI/DPA",
      "Dam Break — triagem (Qp = 2V/T)",
      "Exportação / importação HEC-RAS (JSON, GeoJSON, CSV)",
      "Vínculo a projeto técnico, geo_analyses, outorga, RCA/PCA",
    ],
  },
  {
    titulo: "Piscinão off-stream",
    itens: [
      "Cadastro, demanda hídrica e Rippl",
      "Exportação PDF/DOCX",
    ],
  },
  {
    titulo: "Templates Word",
    itens: [
      "Slugs: barragens, seguranca-barragens, piscinao-off-stream",
      "Placeholders documentados em docs/PLACEHOLDERS-DOCX.md",
    ],
  },
];

export function BarragensHubView() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Projetos e Segurança de Barragens">
        <Button variant="outline" size="sm" className="gap-1" asChild>
          <a
            href="https://www.gov.br/ana/pt-br/assuntos/gestao-de-recursos-hidricos/outorga/barragens"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            ANA — Barragens
          </a>
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Aviso técnico e legal</AlertTitle>
          <AlertDescription>
            Este módulo apoia o engenheiro responsável na elaboração de estudos e documentos. Não substitui
            projeto executivo assinado, ART/RRT, validação em campo, outorga, licenciamento ambiental nem
            aprovação do órgão competente.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Como usar este módulo
            </CardTitle>
            <CardDescription>
              Fluxo sugerido: projeto técnico → segurança (PSB/PAE/Dam Break, quando aplicável) → outorga de
              barramento no IGAM, se necessário.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              Para <strong className="text-foreground">outorga de barramento</strong> em Minas Gerais, use o
              menu <strong className="text-foreground">Outorgas (processos)</strong> — modos IGAM 02 a 06
              (captação e barramento com/sem regularização).
            </p>
            <Button variant="secondary" size="sm" className="gap-1" asChild>
              <Link href="/studies/outorgas">
                <Droplets className="h-4 w-4" />
                Ir para Outorgas
              </Link>
            </Button>
            <p className="text-xs">
              Referência:{" "}
              <code className="bg-muted px-1 rounded">docs/Manual_Engenharia_Barragens_ERS_DamBreak.md</code>
              {" · "}
              <code className="bg-muted px-1 rounded">docs/REFERENCIAS-IGAM-SEMAD-DOWNLOADS.md</code>
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card key={mod.href} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{mod.label}</CardTitle>
                    </div>
                    <Badge
                      variant={mod.status === "disponivel" ? "default" : "secondary"}
                      className="shrink-0 text-xs"
                    >
                      {mod.status === "disponivel" ? "Disponível" : "Em desenvolvimento"}
                    </Badge>
                  </div>
                  <CardDescription>{mod.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <Button size="sm" className="gap-1" asChild>
                    <Link href={mod.href}>
                      Abrir módulo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recursos na aplicação</CardTitle>
            <CardDescription>
              Funcionalidades já disponíveis nos três submódulos (triagem conforme manual SIEBB).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {RECURSOS_APP.map((bloco) => (
              <div key={bloco.titulo}>
                <p className="text-sm font-medium mb-2">{bloco.titulo}</p>
                <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                  {bloco.itens.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist — projeto técnico</CardTitle>
              <CardDescription>Documentos típicos do memorial e projeto (manual §30).</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                {CHECKLIST_PROJETO.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist — segurança e emergência</CardTitle>
              <CardDescription>Quando a barragem exige PNSB / fiscalização (ANA Res. 236/2017).</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                {CHECKLIST_SEGURANCA.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
