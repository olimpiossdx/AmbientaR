import type { GeoLayerResult, GeoLayerStat } from "@/lib/types/geo-wave-a";
import type {
  ProdesModoCriterio,
  ResultadoCriterioStatus,
} from "@/lib/types/analise-socioambiental";
import type { SocioambientalCriterioCatalogEntry } from "@/lib/socioambiental/socioambiental-criteria-catalog";

function statHasOverlap(stat: GeoLayerStat): boolean {
  return (
    (stat.areaHa != null && stat.areaHa > 0.01) ||
    (stat.count != null && stat.count > 0) ||
    (stat.pctOfPerimeter != null && stat.pctOfPerimeter > 0.01)
  );
}

/** Soma ha de polígonos ou presença simbólica de pontos (ex.: IPHAN). */
export function overlapHaFromLayerStats(stats: GeoLayerStat[]): number {
  return stats
    .filter(
      (s) => s.label !== "__buffer_overlap__" && s.label !== "__proximity_m__",
    )
    .filter(statHasOverlap)
    .reduce((sum, row) => {
      if (row.areaHa != null && row.areaHa > 0.01) return sum + row.areaHa;
      if ((row.count ?? 0) > 0) return sum + 0.01;
      return sum;
    }, 0);
}

function filterStatsForCriterio(
  stats: GeoLayerStat[],
  criterio: SocioambientalCriterioCatalogEntry,
): GeoLayerStat[] {
  let rows = stats;
  if (criterio.ucCategoriaFiltro) {
    rows = rows.filter((s) => criterio.ucCategoriaFiltro!.test(s.label));
  }
  if (criterio.tiSituacaoFiltro) {
    rows = rows.filter((s) => criterio.tiSituacaoFiltro!.test(s.label));
  }
  if (criterio.prodesAno != null) {
    const yearStr = String(criterio.prodesAno);
    rows = rows.filter(
      (s) =>
        s.label === yearStr ||
        s.label.includes(yearStr) ||
        /\d{4}/.test(s.label) && s.label.includes(yearStr),
    );
  }
  return rows;
}

export type CriterioSpatialSignals = {
  overlapHa: number;
  bufferOverlapHa: number;
  proximityM?: number;
  layerUnavailable: boolean;
  layerQueried: boolean;
};

export function extractSpatialSignals(
  layer: GeoLayerResult | undefined,
  criterio: SocioambientalCriterioCatalogEntry,
): CriterioSpatialSignals {
  if (!layer) {
    return {
      overlapHa: 0,
      bufferOverlapHa: 0,
      layerUnavailable: true,
      layerQueried: false,
    };
  }

  const stats = filterStatsForCriterio(layer.stats, criterio);
  const overlapHa = overlapHaFromLayerStats(stats);

  const bufferStat = layer.stats.find((s) => s.label === "__buffer_overlap__");
  const bufferOverlapHa = bufferStat?.areaHa ?? 0;
  const proximityStat = layer.stats.find((s) => s.label === "__proximity_m__");
  const proximityM = proximityStat?.count ?? layer.stats[0]?.proximityM;

  return {
    overlapHa,
    bufferOverlapHa,
    proximityM,
    layerUnavailable: layer.status === "unavailable",
    layerQueried: true,
  };
}

export function avaliarResultadoCriterio(params: {
  criterio: SocioambientalCriterioCatalogEntry;
  signals: CriterioSpatialSignals;
  uf?: string;
}): ResultadoCriterioStatus {
  const { criterio, signals, uf } = params;

  if (
    criterio.tipoConsulta === "lista" ||
    criterio.tipoConsulta === "car_historico"
  ) {
    return "Não Analisado";
  }

  if (signals.layerUnavailable && criterio.motivoNaoAnalisado) {
    return "Não Analisado";
  }

  if (
    uf &&
    criterio.ufsAplicaveis !== "BR" &&
    !criterio.ufsAplicaveis.includes(uf)
  ) {
    return "Não Analisado";
  }

  if (criterio.tipoConsulta === "agregado" || criterio.derivado) {
    return "Não Analisado";
  }

  if (!signals.layerQueried) return "Não Analisado";
  if (signals.layerUnavailable) return "Não Analisado";

  if (criterio.tipoConsulta === "intersecao" || criterio.tipoConsulta === "metadado") {
    if (signals.overlapHa > 0.01) return criterio.resultadoSobreposicao;
    return "Apto";
  }

  if (criterio.tipoConsulta === "buffer") {
    if (signals.bufferOverlapHa > 0.01) return criterio.resultadoSobreposicao;
    if (signals.overlapHa > 0.01) return "Inapto";
    return "Apto";
  }

  if (criterio.tipoConsulta === "proximidade") {
    if (signals.overlapHa > 0.01) return "Inapto";
    const limite = criterio.proximidadeLimiteM ?? 3000;
    if (
      signals.proximityM != null &&
      signals.proximityM > 0 &&
      signals.proximityM <= limite
    ) {
      return criterio.resultadoProximidade ?? "Alerta";
    }
    return "Apto";
  }

  return "Apto";
}

export function prodesModoFromWizard(
  modo: ProdesModoCriterio | undefined,
): ProdesModoCriterio {
  return modo ?? "agregado";
}
