"use client";

import { GeorefSectionPage } from "@/components/georeferenciamento/georef-section-page";
import { PROCESSO_REGISTRO } from "@/lib/georeferenciamento/processos";

export default function GeorefRegistroPage() {
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
