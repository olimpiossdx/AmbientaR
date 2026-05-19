"use client";

import { GeorefSectionPage } from "@/components/georeferenciamento/georef-section-page";
import { PROCESSO_RURAL_SIGEF } from "@/lib/georeferenciamento/processos";

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
