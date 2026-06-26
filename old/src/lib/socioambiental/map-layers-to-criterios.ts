/**
 * Converte resultados geoespaciais em critérios Apto/Alerta/Inapto do extrato socioambiental.
 */

import type { GeoLayerResult } from "@/lib/types/geo-wave-a";
import type {
  DetalheAnalise,
  ProdesModoCriterio,
  ResultadoCriterio,
} from "@/lib/types/analise-socioambiental";
import type { SocioambientalReportBlockId } from "@/lib/socioambiental/report-blocks-catalog";
import {
  resolveActiveCriteria,
  type SocioambientalCriterioCatalogEntry,
} from "@/lib/socioambiental/socioambiental-criteria-catalog";
import {
  avaliarResultadoCriterio,
  extractSpatialSignals,
  prodesModoFromWizard,
} from "@/lib/socioambiental/regras-criterio";
import type { CarHistoricoAvaliacao } from "@/lib/geospatial/car-snapshot-compare";
import type { ListasAgenteResult } from "@/lib/socioambiental/listas-agente-types";

function layerById(
  layers: GeoLayerResult[],
  layerId: string | undefined,
): GeoLayerResult | undefined {
  if (!layerId) return undefined;
  return layers.find((l) => l.layerId === layerId);
}

function buildDetalhe(
  criterio: SocioambientalCriterioCatalogEntry,
  layer: GeoLayerResult | undefined,
  signals: ReturnType<typeof extractSpatialSignals>,
  resultado: ResultadoCriterio["resultado"],
): DetalheAnalise | null {
  if (resultado === "Apto") return null;

  if (resultado === "Não Analisado") {
    return {
      criterio: criterio.label,
      observacao:
        criterio.motivoNaoAnalisado ??
        (layer?.summary ? layer.summary : "Critério não analisado nesta execução."),
    };
  }

  const detalhe: DetalheAnalise = {
    criterio: criterio.label,
    areaSobreposicaoHa: signals.overlapHa > 0 ? signals.overlapHa : undefined,
    observacao: layer?.summary,
  };

  if (criterio.prodesAno) detalhe.ano = criterio.prodesAno;
  if (signals.bufferOverlapHa > 0) {
    detalhe.tamanhoDeteccoesHa = signals.bufferOverlapHa;
    detalhe.observacao = `Área no buffer ${criterio.bufferKm ?? 3} km: ~${signals.bufferOverlapHa.toFixed(2)} ha. ${layer?.summary ?? ""}`.trim();
  }
  if (signals.proximityM != null && signals.proximityM > 0) {
    detalhe.observacao = `Proximidade mínima: ${Math.round(signals.proximityM)} m. ${layer?.summary ?? ""}`.trim();
  }

  return detalhe;
}

function resultadoDetalheTexto(
  criterio: SocioambientalCriterioCatalogEntry,
  signals: ReturnType<typeof extractSpatialSignals>,
  resultado: ResultadoCriterio["resultado"],
  layer: GeoLayerResult | undefined,
): string {
  if (resultado === "Não Analisado") {
    return (
      criterio.motivoNaoAnalisado ??
      layer?.summary ??
      "Critério não analisado nesta execução."
    );
  }
  if (resultado === "Apto") {
    return "Nenhuma restrição identificada para este critério.";
  }
  if (criterio.tipoConsulta === "buffer" && signals.bufferOverlapHa > 0) {
    return `Interseção no buffer de ${criterio.bufferKm ?? 3} km (~${signals.bufferOverlapHa.toFixed(2)} ha).`;
  }
  if (criterio.tipoConsulta === "proximidade" && signals.proximityM != null) {
    return `Feição a ${Math.round(signals.proximityM)} m do perímetro (limite ${criterio.proximidadeLimiteM ?? 3000} m).`;
  }
  if (signals.overlapHa > 0) {
    return `Sobreposição de ~${signals.overlapHa.toFixed(2)} ha${layer?.title ? ` (${layer.title})` : ""}.`;
  }
  return layer?.summary ?? "Restrição identificada.";
}

function buildDetalheLista(
  criterio: SocioambientalCriterioCatalogEntry,
  detalhe: string,
  registros?: { rotulo: string; data?: string; uf?: string }[],
): DetalheAnalise | undefined {
  if (!registros?.length) return undefined;
  const extra = registros
    .map((r) => [r.rotulo, r.uf, r.data].filter(Boolean).join(" — "))
    .join("; ");
  return {
    criterio: criterio.label,
    observacao: `${detalhe} ${extra}`.trim(),
  };
}

function avaliarCriterio(
  criterio: SocioambientalCriterioCatalogEntry,
  layers: GeoLayerResult[],
  uf?: string,
  carHistorico?: CarHistoricoAvaliacao | null,
  listasAgente?: ListasAgenteResult | null,
): { resultado: ResultadoCriterio; detalhe?: DetalheAnalise } {
  if (criterio.tipoConsulta === "lista") {
    const hit = listasAgente?.hits.find((h) => h.criterioId === criterio.id);
    if (hit) {
      const detalheAnalise =
        hit.resultado !== "Apto"
          ? buildDetalheLista(criterio, hit.detalhe, hit.registros) ?? {
              criterio: criterio.label,
              observacao: hit.detalhe,
            }
          : undefined;
      return {
        resultado: {
          criterio: criterio.label,
          resultado: hit.resultado,
          detalhe: hit.detalhe,
        },
        detalhe: detalheAnalise,
      };
    }
    return {
      resultado: {
        criterio: criterio.label,
        resultado: "Não Analisado",
        detalhe:
          criterio.motivoNaoAnalisado ??
          "Informe CPF/CNPJ do agente para consulta em listas.",
      },
    };
  }

  if (
    criterio.id === "car_historico_omissao" &&
    criterio.tipoConsulta === "car_historico" &&
    carHistorico
  ) {
    const resultado = carHistorico.resultado;
    const detalhe: DetalheAnalise | undefined =
      resultado !== "Apto"
        ? {
            criterio: criterio.label,
            observacao: carHistorico.detalhe,
          }
        : undefined;
    return {
      resultado: {
        criterio: criterio.label,
        resultado,
        detalhe: carHistorico.detalhe,
      },
      detalhe,
    };
  }

  const layer = layerById(layers, criterio.fonte.layerId);
  const signals = extractSpatialSignals(layer, criterio);
  const resultado = avaliarResultadoCriterio({ criterio, signals, uf });
  const detalhe = buildDetalhe(criterio, layer, signals, resultado);

  return {
    resultado: {
      criterio: criterio.label,
      resultado,
      detalhe: resultadoDetalheTexto(criterio, signals, resultado, layer),
    },
    detalhe: detalhe ?? undefined,
  };
}

export type MapLayersToCriteriosOptions = {
  prodesModo?: ProdesModoCriterio;
  uf?: string;
  carHistorico?: CarHistoricoAvaliacao | null;
  listasAgente?: ListasAgenteResult | null;
};

export type MapLayersToCriteriosResult = {
  criteriosResultados: ResultadoCriterio[];
  detalhesAnalise: DetalheAnalise[];
};

export function mapLayersToCriterios(
  layers: GeoLayerResult[],
  selectedBlockIds: SocioambientalReportBlockId[],
  options?: MapLayersToCriteriosOptions,
): MapLayersToCriteriosResult {
  const prodesModo = prodesModoFromWizard(options?.prodesModo);
  const criteria = resolveActiveCriteria({
    blockIds: selectedBlockIds,
    prodesModo,
    uf: options?.uf,
  });

  const criteriosResultados: ResultadoCriterio[] = [];
  const detalhesAnalise: DetalheAnalise[] = [];

  for (const criterio of criteria) {
    const { resultado, detalhe } = avaliarCriterio(
      criterio,
      layers,
      options?.uf,
      options?.carHistorico,
      options?.listasAgente,
    );
    criteriosResultados.push(resultado);
    if (detalhe) detalhesAnalise.push(detalhe);
  }

  return { criteriosResultados, detalhesAnalise };
}
