import type {
  ProdesModoCriterio,
  ResultadoCriterio,
} from "@/lib/types/analise-socioambiental";
import {
  resolveActiveCriteria,
  type SocioambientalReportBlockId,
} from "@/lib/socioambiental/socioambiental-criteria-catalog";

export type LayerSemaphoreStatus = "Inapto" | "Alerta";

/** layerId → pior semáforo (Inapto prevalece sobre Alerta). */
export function resolveLayerSemaphoreMap(params: {
  criterios: ResultadoCriterio[];
  blockIds: SocioambientalReportBlockId[];
  prodesModo?: ProdesModoCriterio;
  uf?: string;
}): Map<string, LayerSemaphoreStatus> {
  const criteria = resolveActiveCriteria({
    blockIds: params.blockIds,
    prodesModo: params.prodesModo ?? "agregado",
    uf: params.uf ?? "MG",
  });
  const byLabel = new Map(criteria.map((c) => [c.label, c]));
  const out = new Map<string, LayerSemaphoreStatus>();

  for (const cr of params.criterios) {
    if (cr.resultado !== "Inapto" && cr.resultado !== "Alerta") continue;
    const entry = byLabel.get(cr.criterio);
    const layerId = entry?.fonte.layerId;
    if (!layerId) continue;
    const current = out.get(layerId);
    if (cr.resultado === "Inapto") {
      out.set(layerId, "Inapto");
    } else if (current !== "Inapto") {
      out.set(layerId, "Alerta");
    }
  }

  return out;
}

export const SEMAPHORE_OVERLAY_STYLE: Record<
  LayerSemaphoreStatus,
  { stroke: string; fill: string; fillOpacity: number; strokeWidth: number }
> = {
  Inapto: { stroke: "#b91c1c", fill: "#ef4444", fillOpacity: 0.42, strokeWidth: 1.5 },
  Alerta: { stroke: "#ca8a04", fill: "#fbbf24", fillOpacity: 0.36, strokeWidth: 1.3 },
};
