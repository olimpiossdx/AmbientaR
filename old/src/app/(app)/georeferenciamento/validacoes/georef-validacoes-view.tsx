"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { PROCESSO_VALIDACOES } from "@/lib/georeferenciamento/processos";

const GeorefSectionPage = dynamic(
  () =>
    import("@/components/georeferenciamento/georef-section-page").then((m) => ({
      default: m.GeorefSectionPage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Validações técnicas" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export function GeorefValidacoesView() {
  return (
    <GeorefSectionPage
      title="Validações técnicas"
      description="Conferências de sobreposição (SIGEF/CAR), consistência de área, SIRGAS2000/UTM e fechamento do polígono antes de certificação e registro."
      processo={PROCESSO_VALIDACOES}
      showMapLink
      links={[
        { label: "SIGEF — consulta de parcelas", href: "https://sigef.incra.gov.br/" },
        { label: "SICAR", href: "https://www.car.gov.br/" },
      ]}
    />
  );
}
