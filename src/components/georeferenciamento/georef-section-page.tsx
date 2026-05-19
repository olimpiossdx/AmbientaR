"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { GeorefProcessoEtapas } from "@/components/georeferenciamento/georef-processo-etapas";
import { GeorefChecklist } from "@/components/georeferenciamento/georef-checklist";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GeorefProcessoDef } from "@/lib/georeferenciamento/processos";
import type { GeorefChecklistState } from "@/lib/georeferenciamento/types";
import { ExternalLink, Map } from "lucide-react";

type GeorefSectionPageProps = {
  title: string;
  description: string;
  processo: GeorefProcessoDef;
  /** Links externos oficiais exibidos no topo */
  links?: { label: string; href: string }[];
  /** Mostrar atalho para Mapas / campo */
  showMapLink?: boolean;
};

export function GeorefSectionPage({
  title,
  description,
  processo,
  links = [],
  showMapLink = false,
}: GeorefSectionPageProps) {
  const storageKey = `georef-checklist-${processo.id}`;
  const [checklist, setChecklist] = React.useState<GeorefChecklistState>({});

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecklist(JSON.parse(raw) as GeorefChecklistState);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const onChecklistChange = (next: GeorefChecklistState) => {
    setChecklist(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={title} description={description} />
      <main className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
        {(links.length > 0 || showMapLink) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Atalhos</CardTitle>
              <CardDescription>Portais oficiais e ferramentas do AmbientaR</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {links.map((l) => (
                <Button key={l.href} variant="outline" size="sm" asChild>
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    {l.label}
                  </a>
                </Button>
              ))}
              {showMapLink ? (
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/studies/mapas">
                    <Map className="mr-1 h-3.5 w-3.5" />
                    Abrir Mapas (perímetro / export)
                  </Link>
                </Button>
              ) : null}
              <Button variant="secondary" size="sm" asChild>
                <Link href="/georeferenciamento/processos">Gerenciar processos</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <GeorefProcessoEtapas processo={processo} />
          <GeorefChecklist
            titulo="Checklist operacional"
            descricao="Marque conforme o andamento do serviço (salvo localmente neste navegador)."
            items={processo.checklist}
            value={checklist}
            onChange={onChecklistChange}
          />
        </div>
      </main>
    </div>
  );
}
