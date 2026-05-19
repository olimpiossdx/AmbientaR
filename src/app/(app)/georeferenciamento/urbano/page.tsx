"use client";

import { GeorefSectionPage } from "@/components/georeferenciamento/georef-section-page";
import { PROCESSO_URBANO_CARTORIO } from "@/lib/georeferenciamento/processos";

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
