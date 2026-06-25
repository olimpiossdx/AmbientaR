"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { PROCESSO_RURAL_SIGEF } from "@/lib/georeferenciamento/processos";

const GeorefSectionPage = dynamic(
  () =>
    import("@/components/georeferenciamento/georef-section-page").then((m) => ({
      default: m.GeorefSectionPage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Imóvel rural — SIGEF / INCRA" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function GeorefRuralPage() {
  return (
    <GeorefSectionPage
      title="Imóvel rural — SIGEF / INCRA"
      description="Certificação eletrônica no Sistema de Gestão Fundiária: planilha de vértices, análise de sobreposição, planta e memorial descritivo (MTGIR — Portaria INCRA nº 2.502/2022)."
      processo={PROCESSO_RURAL_SIGEF}
      showMapLink
      links={[
        { label: "Acessar SIGEF", href: "https://sigef.incra.gov.br/" },
        { label: "Manual do SIGEF", href: "https://sigef.incra.gov.br/documentos/manual/" },
        {
          label: "Certificação de imóveis (INCRA)",
          href: "https://www.gov.br/incra/pt-br/assuntos/governanca-fundiaria/certificacao-imoveis",
        },
      ]}
    />
  );
}
