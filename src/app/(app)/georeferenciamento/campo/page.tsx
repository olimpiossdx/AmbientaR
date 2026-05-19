"use client";

import { GeorefSectionPage } from "@/components/georeferenciamento/georef-section-page";
import { PROCESSO_CAMPO } from "@/lib/georeferenciamento/processos";

export default function GeorefCampoPage() {
  return (
    <GeorefSectionPage
      title="Campo e levantamento GNSS"
      description="Planejamento, coleta de vértices, fotos de campo e processamento com QA de precisão (sigmas), conforme MTGIR e método declarado na planilha SIGEF."
      processo={PROCESSO_CAMPO}
      showMapLink
    />
  );
}
