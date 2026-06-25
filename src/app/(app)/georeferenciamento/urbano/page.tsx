"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { PROCESSO_URBANO_CARTORIO } from "@/lib/georeferenciamento/processos";

const GeorefSectionPage = dynamic(
  () =>
    import("@/components/georeferenciamento/georef-section-page").then((m) => ({
      default: m.GeorefSectionPage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Lote urbano — memorial e registro" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function GeorefUrbanoPage() {
  return (
    <GeorefSectionPage
      title="Lote urbano — memorial e registro"
      description="Levantamento topográfico com GNSS, planta e memorial em SIRGAS2000/UTM, aprovação municipal quando exigida e protocolo no Registro de Imóveis."
      processo={PROCESSO_URBANO_CARTORIO}
      showMapLink
      links={[
        {
          label: "Serviço — validar levantamento rural (referência técnica)",
          href: "https://www.gov.br/pt-br/servicos/validar-levantamento-topografico-de-imovel-rural",
        },
      ]}
    />
  );
}
