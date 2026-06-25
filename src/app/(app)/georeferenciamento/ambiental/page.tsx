"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { PROCESSO_AMBIENTAL_CAR } from "@/lib/georeferenciamento/processos";
import {
  localizacaoToGeorefPatch,
  GEOREF_CAR_DRAFT_KEY,
} from "@/lib/geospatial/localizacao-request-snapshot";
import type { LocalizacaoResolvida } from "@/lib/types/localizacao-imovel";
import { useToast } from "@/hooks/use-toast";

const GeorefSectionPage = dynamic(
  () =>
    import("@/components/georeferenciamento/georef-section-page").then((m) => ({
      default: m.GeorefSectionPage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="CAR — Cadastro Ambiental Rural" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function GeorefAmbientalPage() {
  const { toast } = useToast();

  const handleLocalizacaoConfirmed = React.useCallback(
    (resolved: LocalizacaoResolvida) => {
      const patch = localizacaoToGeorefPatch(resolved);
      try {
        localStorage.setItem(GEOREF_CAR_DRAFT_KEY, JSON.stringify(patch));
      } catch {
        /* ignore */
      }
      toast({
        title: "Imóvel CAR confirmado",
        description:
          "Dados salvos como rascunho. Em Trâmites fundiários → Novo trâmite (tipo Ambiental) os campos serão pré-preenchidos.",
      });
    },
    [toast],
  );

  return (
    <GeorefSectionPage
      title="CAR — Cadastro Ambiental Rural"
      description="Inscrição georreferenciada no SICAR (Lei 12.651/2012): perímetro, APP, Reserva Legal e análise pelo órgão estadual. Em MG, consulte também o IDE-SisemaNet."
      processo={PROCESSO_AMBIENTAL_CAR}
      showMapLink
      showAnaliseLink
      localizador={{ onConfirmed: handleLocalizacaoConfirmed }}
      links={[
        { label: "SICAR", href: "https://www.car.gov.br/" },
        {
          label: "Regularização ambiental (MMA)",
          href: "https://www.gov.br/florestal/pt-br/assuntos/regularizacao-ambiental",
        },
        {
          label: "IDE-SisemaNet (MG)",
          href: "https://visualizador.idesisema.meioambiente.mg.gov.br/",
        },
      ]}
    />
  );
}
