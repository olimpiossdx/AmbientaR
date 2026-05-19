"use client";

import { GeorefSectionPage } from "@/components/georeferenciamento/georef-section-page";
import { PROCESSO_VALIDACOES } from "@/lib/georeferenciamento/processos";

export default function GeorefValidacoesPage() {
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
