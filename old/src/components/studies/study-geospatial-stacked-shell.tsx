"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";

export type StudyGeospatialStackedShellProps = {
  title: string;
  description?: string;
  /** Mapa em largura total (topo). */
  mapPane: React.ReactNode;
  /** Controles de entrada (modo CAR, SHP, botão gerar). */
  controlsPane?: React.ReactNode;
  /** Resultados (resumo + cards por camada). */
  resultsPane?: React.ReactNode;
  /** Etapa 2 / complemento IA. */
  footerPane?: React.ReactNode;
  /** Banner de uso / ajuda. */
  topExtras?: React.ReactNode;
};

/**
 * Layout empilhado: mapa ocupa a largura do frame; análise e resultados abaixo.
 */
export function StudyGeospatialStackedShell({
  title,
  description,
  mapPane,
  controlsPane,
  resultsPane,
  footerPane,
  topExtras,
}: StudyGeospatialStackedShellProps) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={title} description={description} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 md:gap-6 md:p-6">
        {topExtras}
        <div className="w-full min-w-0">{mapPane}</div>
        {controlsPane ? <div className="w-full min-w-0">{controlsPane}</div> : null}
        {resultsPane ? <div className="w-full min-w-0">{resultsPane}</div> : null}
        {footerPane ? <div className="w-full min-w-0">{footerPane}</div> : null}
      </div>
    </div>
  );
}
