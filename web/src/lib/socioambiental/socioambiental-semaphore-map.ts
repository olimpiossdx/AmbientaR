"use client";

import {
  buildCartographicSheetSvg,
  CARTOGRAPHIC_PAGE_SIZE,
  type CartographicOverlayRing,
} from "@/lib/geospatial/cartographic-layout";
import { fetchThematicWfsOverlays } from "@/lib/geospatial/fetch-layer-wfs-for-export";
import { svgStringToPngDataUrl } from "@/lib/geospatial/render-minimap-client";
import type { WaveAAnalysisResult } from "@/lib/types/geo-wave-a";
import type {
  ProdesModoCriterio,
  ResultadoCriterio,
} from "@/lib/types/analise-socioambiental";
import {
  resolveLayerSemaphoreMap,
  SEMAPHORE_OVERLAY_STYLE,
  type LayerSemaphoreStatus,
} from "@/lib/socioambiental/layer-semaphore-from-criterios";
import type { SocioambientalReportBlockId } from "@/lib/socioambiental/socioambiental-criteria-catalog";

function applySemaphoreStyle(
  rings: CartographicOverlayRing[],
  status: LayerSemaphoreStatus,
): CartographicOverlayRing[] {
  const style = SEMAPHORE_OVERLAY_STYLE[status];
  return rings.map((ring) => ({
    ...ring,
    stroke: style.stroke,
    fill: style.fill,
    fillOpacity: style.fillOpacity,
    strokeWidth: style.strokeWidth,
  }));
}

export async function buildSocioambientalSemaphoreMapPng(params: {
  wave: WaveAAnalysisResult;
  criterios: ResultadoCriterio[];
  blockIds: SocioambientalReportBlockId[];
  prodesModo?: ProdesModoCriterio;
  propertyName?: string;
}): Promise<string | null> {
  const semaphore = resolveLayerSemaphoreMap({
    criterios: params.criterios,
    blockIds: params.blockIds,
    prodesModo: params.prodesModo,
  });

  const overlayRings: CartographicOverlayRing[] = [];
  const layerIds = [...semaphore.keys()];

  for (const layerId of layerIds) {
    const status = semaphore.get(layerId)!;
    try {
      const rings = await fetchThematicWfsOverlays(
        layerId,
        params.wave.perimeter.bbox,
      );
      if (rings.length) {
        overlayRings.push(...applySemaphoreStyle(rings, status));
      }
    } catch {
      /* camada indisponível no recorte */
    }
  }

  const svg = buildCartographicSheetSvg({
    title: "Mapa de restrições socioambientais",
    perimeter: params.wave.perimeter,
    overlayRings,
    meta: {
      propertyLabel: params.propertyName ?? "Perímetro analisado",
      dataSource: "Camadas SIG — semáforo Inapto (vermelho) e Alerta (amarelo)",
      projectAuthor: "AmbientaR — Extrato Socioambiental",
    },
  });

  if (!svg) return null;

  return svgStringToPngDataUrl(
    svg,
    CARTOGRAPHIC_PAGE_SIZE.width,
    CARTOGRAPHIC_PAGE_SIZE.height,
  );
}
