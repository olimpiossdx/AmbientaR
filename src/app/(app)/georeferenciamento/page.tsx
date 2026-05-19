"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Crosshair,
  Trees,
  Building2,
  Leaf,
  FileSpreadsheet,
  Scale,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { GEOREF_PRAZOS_OBRIGATORIEDADE } from "@/lib/georeferenciamento/referencias";

const MODULOS = [
  {
    href: "/georeferenciamento/rural",
    title: "Rural — SIGEF / INCRA",
    description: "Certificação eletrônica, planilha de vértices, planta e memorial (MTGIR).",
    icon: Trees,
  },
  {
    href: "/georeferenciamento/urbano",
    title: "Urbano — Cartório",
    description: "Lotes, desmembramentos e memorial em SIRGAS2000 para registro no RI.",
    icon: Building2,
  },
  {
    href: "/georeferenciamento/ambiental",
    title: "CAR / SICAR",
    description: "Perímetro georreferenciado, APP, RL e compatibilização com certificação fundiária.",
    icon: Leaf,
  },
  {
    href: "/georeferenciamento/campo",
    title: "Campo e levantamento",
    description: "GNSS/RTK, QA de precisão e integração com Mapas.",
    icon: Crosshair,
  },
  {
    href: "/georeferenciamento/documentos",
    title: "Documentação técnica",
    description: "Memorial descritivo, planta, ART/RRT e anuências.",
    icon: FileSpreadsheet,
  },
  {
    href: "/georeferenciamento/validacoes",
    title: "Validações",
    description: "Sobreposição, área, sistema de coordenadas e fechamento de polígono.",
    icon: Scale,
  },
  {
    href: "/georeferenciamento/registro",
    title: "Cartório e registro",
    description: "Pacote documental para protocolo no Registro de Imóveis.",
    icon: BookOpen,
  },
] as const;

export default function GeoreferenciamentoDashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Georeferenciamento"
        description="Gestão de processos fundiários e ambientais georreferenciados — alinhado ao SIGEF (INCRA), CAR (SICAR) e registro em cartório."
      >
        <Button size="sm" asChild>
          <Link href="/georeferenciamento/processos">Ver processos</Link>
        </Button>
      </PageHeader>
      <main className="flex-1 space-y-8 overflow-auto p-4 md:p-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MODULOS.map((m) => (
            <Card key={m.href} className="flex flex-col">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <m.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{m.title}</CardTitle>
                <CardDescription>{m.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button variant="outline" size="sm" className="gap-1" asChild>
                  <Link href={m.href}>
                    Acessar
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Obrigatoriedade e prazos (referência)</CardTitle>
            <CardDescription>
              Resumo com base em normas federais e práticas de cartório — confirme sempre a
              legislação vigente e exigências do município/estado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {GEOREF_PRAZOS_OBRIGATORIEDADE.map((item) => (
              <div key={item.titulo} className="rounded-lg border p-4">
                <p className="font-medium">{item.titulo}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.texto}</p>
                <p className="mt-2 text-xs text-muted-foreground">Fonte: {item.fonte}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
