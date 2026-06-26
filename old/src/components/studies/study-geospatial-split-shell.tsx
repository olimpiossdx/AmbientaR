"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";

export type StudyGeospatialSplitShellProps = {
  title: string;
  description?: string;
  /** Coluna principal (mapa / visualizador), à esquerda em `md+`. */
  mapPane: React.ReactNode;
  /** Cartões empilhados à direita em `md+`; em mobile ficam abaixo do mapa. */
  sidebar: React.ReactNode;
};

/**
 * Composição partilhada com a página Mapas: cabeçalho, mapa à esquerda,
 * barra lateral fixa (~380px) com cartões empilhados.
 */
export function StudyGeospatialSplitShell({
  title,
  description,
  mapPane,
  sidebar,
}: StudyGeospatialSplitShellProps) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title={title} description={description} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 md:flex-row md:p-6">
        <div className="flex min-h-[420px] min-w-0 flex-1 flex-col md:min-h-[calc(100vh-12rem)]">
          {mapPane}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-4 md:w-[380px]">
          {sidebar}
        </div>
      </div>
    </div>
  );
}
