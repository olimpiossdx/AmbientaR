"use client";

import { GeorefSectionPage } from "@/components/georeferenciamento/georef-section-page";
import { PROCESSO_AMBIENTAL_CAR } from "@/lib/georeferenciamento/processos";

export default function GeorefAmbientalPage() {
  return (
    <GeorefSectionPage
      title="CAR — Cadastro Ambiental Rural"
      description="Inscrição georreferenciada no SICAR (Lei 12.651/2012): perímetro, APP, Reserva Legal e análise pelo órgão estadual. Em MG, consulte também o IDE-SisemaNet."
      processo={PROCESSO_AMBIENTAL_CAR}
      showMapLink
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
