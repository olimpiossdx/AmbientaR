"use client";

import * as React from "react";
import { GeorefSectionPage } from "@/components/georeferenciamento/georef-section-page";
import { PROCESSO_CAMPO } from "@/lib/georeferenciamento/processos";
import {
  localizacaoToGeorefPatch,
  GEOREF_CAMPO_DRAFT_KEY,
} from "@/lib/geospatial/localizacao-request-snapshot";
import type { LocalizacaoResolvida } from "@/lib/types/localizacao-imovel";
import { useToast } from "@/hooks/use-toast";

export default function GeorefCampoPage() {
  const { toast } = useToast();

  const handleLocalizacaoConfirmed = React.useCallback(
    (resolved: LocalizacaoResolvida) => {
      const patch = localizacaoToGeorefPatch(resolved);
      try {
        localStorage.setItem(GEOREF_CAMPO_DRAFT_KEY, JSON.stringify(patch));
      } catch {
        /* ignore */
      }
      toast({
        title: "Ponto de campo registrado",
        description: `${patch.areaHa?.toFixed(2) ?? "—"} ha · CAR ${patch.car ?? "—"}. Rascunho salvo neste navegador.`,
      });
    },
    [toast],
  );

  return (
    <GeorefSectionPage
      title="Campo e levantamento GNSS"
      description="Planejamento, coleta de vértices, fotos de campo e processamento com QA de precisão (sigmas), conforme MTGIR e método declarado na planilha SIGEF."
      processo={PROCESSO_CAMPO}
      showMapLink
      localizador={{
        defaultInputMode: "gps",
        onConfirmed: handleLocalizacaoConfirmed,
      }}
    />
  );
}
