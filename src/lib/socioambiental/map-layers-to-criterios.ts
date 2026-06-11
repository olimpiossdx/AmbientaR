/**
 * Converte resultados geoespaciais em critérios Apto/Inapto do extrato socioambiental.
 */

import type { GeoLayerResult } from "@/lib/types/geo-wave-a";
import type {
  DetalheAnalise,
  ResultadoCriterio,
} from "@/lib/types/analise-socioambiental";
import {
  SOCIOAMBIENTAL_REPORT_BLOCKS,
  type SocioambientalReportBlock,
  type SocioambientalReportBlockId,
} from "@/lib/socioambiental/report-blocks-catalog";

function layerHasRestrictionSignal(layer: GeoLayerResult): boolean {
  if (layer.status === "unavailable") return false;
  const noFeatures =
    /sem fei[cç][oõ]es|nenhuma fei[cç][aã]o|fora do recorte|ignorad[oa]/i.test(
      layer.summary,
    );
  if (noFeatures && layer.stats.length === 0) return false;

  return layer.stats.some(
    (s) =>
      (s.areaHa != null && s.areaHa > 0.01) ||
      (s.count != null && s.count > 0) ||
      (s.pctOfPerimeter != null && s.pctOfPerimeter > 0.01),
  );
}

function layersForBlock(
  block: SocioambientalReportBlock,
  layers: GeoLayerResult[],
): GeoLayerResult[] {
  const ids = new Set(block.layerIds);
  return layers.filter((l) => ids.has(l.layerId));
}

function buildDetalhesForBlock(
  block: SocioambientalReportBlock,
  blockLayers: GeoLayerResult[],
): DetalheAnalise[] {
  const out: DetalheAnalise[] = [];
  for (const layer of blockLayers) {
    if (!layerHasRestrictionSignal(layer)) continue;
    const areaHa = layer.stats.find((s) => s.areaHa != null)?.areaHa;
    const count = layer.stats.find((s) => s.count != null)?.count;
    out.push({
      criterio: block.criterioLabel,
      numeroDeteccoes: count,
      tamanhoDeteccoesHa: areaHa,
      areaSobreposicaoHa: areaHa,
      observacao: `${layer.title}: ${layer.summary}`,
    });
  }
  return out;
}

function resultadoForBlock(
  block: SocioambientalReportBlock,
  blockLayers: GeoLayerResult[],
): ResultadoCriterio {
  if (blockLayers.length === 0) {
    return {
      criterio: block.criterioLabel,
      resultado: "Não Analisado",
      detalhe: "Nenhuma camada consultada para este bloco.",
    };
  }

  const unavailable = blockLayers.every((l) => l.status === "unavailable");
  if (unavailable) {
    return {
      criterio: block.criterioLabel,
      resultado: "Não Analisado",
      detalhe: "Camadas indisponíveis no momento da consulta.",
    };
  }

  const hits = blockLayers.filter(layerHasRestrictionSignal);
  if (hits.length === 0) {
    return {
      criterio: block.criterioLabel,
      resultado: "Apto",
      detalhe: "Nenhuma restrição identificada nas camadas consultadas.",
    };
  }

  const titles = hits.map((h) => h.title).join("; ");
  return {
    criterio: block.criterioLabel,
    resultado: "Inapto",
    detalhe: `Restrição ou sobreposição em: ${titles}.`,
  };
}

export type MapLayersToCriteriosResult = {
  criteriosResultados: ResultadoCriterio[];
  detalhesAnalise: DetalheAnalise[];
};

export function mapLayersToCriterios(
  layers: GeoLayerResult[],
  selectedBlockIds: SocioambientalReportBlockId[],
): MapLayersToCriteriosResult {
  const criteriosResultados: ResultadoCriterio[] = [];
  const detalhesAnalise: DetalheAnalise[] = [];

  for (const blockId of selectedBlockIds) {
    const block = SOCIOAMBIENTAL_REPORT_BLOCKS.find((b) => b.id === blockId);
    if (!block) continue;
    const blockLayers = layersForBlock(block, layers);
    criteriosResultados.push(resultadoForBlock(block, blockLayers));
    detalhesAnalise.push(...buildDetalhesForBlock(block, blockLayers));
  }

  return { criteriosResultados, detalhesAnalise };
}
