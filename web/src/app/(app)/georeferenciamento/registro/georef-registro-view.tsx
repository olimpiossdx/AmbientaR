"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { PROCESSO_REGISTRO } from "@/lib/georeferenciamento/processos";

const GeorefSectionPage = dynamic(
  () =>
    import("@/components/georeferenciamento/georef-section-page").then((m) => ({
      default: m.GeorefSectionPage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Cartório e registro de imóveis" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export function GeorefRegistroView() {
  return (
    <GeorefSectionPage
      title="Cartório e registro de imóveis"
      description="Montagem do pacote para protocolo no RI: certificação SIGEF, planta, memorial, ART, anuências, CCIR, ITR e CAR conforme exigido pelo oficial registrador."
      processo={PROCESSO_REGISTRO}
      links={[
        {
          label: "CCIR (INCRA)",
          href: "https://www.gov.br/incra/pt-br/assuntos/cadastro-credito-rural/ccir",
        },
      ]}
    />
  );
}
