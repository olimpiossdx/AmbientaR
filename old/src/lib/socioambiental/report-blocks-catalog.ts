/**
 * Blocos temáticos de relatório socioambiental (padrão Sicoob/AgroTools).
 * Agrupam critérios do catálogo fechado (`socioambiental-criteria-catalog.ts`).
 */

import type { ProdesModoCriterio } from "@/lib/types/analise-socioambiental";
import { resolveAllLayersForBbox } from "@/lib/geospatial/geo-all-layers";
import {
  countCriteriaForBlocks,
  getCriteriaForReportBlock,
  resolveLayerIdsForBlocks,
  type SocioambientalReportBlockId,
} from "@/lib/socioambiental/socioambiental-criteria-catalog";

export type { SocioambientalReportBlockId };

export type SocioambientalReportBlock = {
  id: SocioambientalReportBlockId;
  title: string;
  description: string;
  /** Rótulo do critério no extrato (Apto/Inapto). */
  criterioLabel: string;
  layerIds: readonly string[];
  defaultSelected: boolean;
};

function layerIdsForBlock(blockId: SocioambientalReportBlockId): readonly string[] {
  return resolveLayerIdsForBlocks([blockId], "agregado", "MG");
}

function criterioLabelForBlock(blockId: SocioambientalReportBlockId): string {
  const criteria = getCriteriaForReportBlock(blockId);
  if (criteria.length === 0) return blockId;
  if (criteria.length === 1) return criteria[0].label;
  return `${criteria[0].label} (+${criteria.length - 1} critérios)`;
}

export const SOCIOAMBIENTAL_REPORT_BLOCKS: SocioambientalReportBlock[] = [
  {
    id: "extrato_cadastro",
    title: "Cadastro rural (CAR/SICAR)",
    description: "Imóveis rurais no recorte, APP hídrica e cruzamento bioma.",
    criterioLabel: criterioLabelForBlock("extrato_cadastro"),
    layerIds: layerIdsForBlock("extrato_cadastro"),
    defaultSelected: true,
  },
  {
    id: "desmatamento",
    title: "Desmatamento e supressão",
    description: "PRODES (Cerrado, Mata Atlântica, Amazônia Legal) e MapBiomas Alerta.",
    criterioLabel: criterioLabelForBlock("desmatamento"),
    layerIds: layerIdsForBlock("desmatamento"),
    defaultSelected: true,
  },
  {
    id: "embargos_sancoes",
    title: "Embargos e sanções",
    description: "Embargos IBAMA/ICMBio (polígono) e listas por CPF/CNPJ (Fase 3).",
    criterioLabel: criterioLabelForBlock("embargos_sancoes"),
    layerIds: layerIdsForBlock("embargos_sancoes"),
    defaultSelected: true,
  },
  {
    id: "areas_protegidas",
    title: "Áreas protegidas e comunidades",
    description: "UC, TI, quilombolas, assentamentos, buffers 3 km e IPHAN.",
    criterioLabel: criterioLabelForBlock("areas_protegidas"),
    layerIds: layerIdsForBlock("areas_protegidas"),
    defaultSelected: true,
  },
  {
    id: "recursos_hidricos",
    title: "Recursos hídricos",
    description: "Hidrografia, massas d'água, APP e outorgas IGAM.",
    criterioLabel: criterioLabelForBlock("recursos_hidricos"),
    layerIds: layerIdsForBlock("recursos_hidricos"),
    defaultSelected: false,
  },
  {
    id: "contexto_ambiental",
    title: "Contexto ambiental (MG)",
    description: "Bioma, solos, geologia, fauna, ZEE e ICMS ecológico.",
    criterioLabel: criterioLabelForBlock("contexto_ambiental"),
    layerIds: layerIdsForBlock("contexto_ambiental"),
    defaultSelected: false,
  },
  {
    id: "licenciamento_mg",
    title: "Licenciamento (MG)",
    description: "Empreendimentos licenciados e licenciamento municipal.",
    criterioLabel: criterioLabelForBlock("licenciamento_mg"),
    layerIds: layerIdsForBlock("licenciamento_mg"),
    defaultSelected: false,
  },
];

const BLOCKS_BY_ID = new Map(
  SOCIOAMBIENTAL_REPORT_BLOCKS.map((b) => [b.id, b]),
);

export function getReportBlock(
  id: SocioambientalReportBlockId,
): SocioambientalReportBlock {
  const block = BLOCKS_BY_ID.get(id);
  if (!block) throw new Error(`Bloco socioambiental desconhecido: ${id}`);
  return block;
}

export function getDefaultSelectedBlockIds(): SocioambientalReportBlockId[] {
  return SOCIOAMBIENTAL_REPORT_BLOCKS.filter((b) => b.defaultSelected).map(
    (b) => b.id,
  );
}

/** União de layerIds dos blocos selecionados (deduplicado). */
export function resolveLayerIdsFromBlocks(
  blockIds: SocioambientalReportBlockId[],
  prodesModo: ProdesModoCriterio = "agregado",
  uf = "MG",
): string[] {
  return resolveLayerIdsForBlocks(blockIds, prodesModo, uf);
}

/** Camadas resolvidas para o bbox que pertencem aos blocos (para contagem na UI). */
export function countLayersForBlocks(
  blockIds: SocioambientalReportBlockId[],
  bbox: [number, number, number, number],
  prodesModo: ProdesModoCriterio = "agregado",
  uf = "MG",
): number {
  const wanted = new Set(resolveLayerIdsFromBlocks(blockIds, prodesModo, uf));
  return resolveAllLayersForBbox(bbox).filter((e) => wanted.has(e.layerId))
    .length;
}

/** Critérios ativos nos blocos (para UI avançada). */
export function countCriteriosForBlocks(
  blockIds: SocioambientalReportBlockId[],
  prodesModo: ProdesModoCriterio = "agregado",
  uf = "MG",
): number {
  return countCriteriaForBlocks(blockIds, prodesModo, uf);
}

/** Bbox MG continental — contagem de referência na UI. */
export const SOCIOAMBIENTAL_DEFAULT_LAYER_COUNT = countLayersForBlocks(
  getDefaultSelectedBlockIds(),
  [-51.13, -22.92, -36.03, -14.23],
);

/** Preset de bioma para pré-marcar blocos (estilo pacotes AgroTools/Sicoob). */
export type SocioambientalBiomaPresetId =
  | "mg_padrao"
  | "cerrado"
  | "mata_atlantica"
  | "amazonia"
  | "completo";

export type SocioambientalBiomaPreset = {
  id: SocioambientalBiomaPresetId;
  label: string;
  description: string;
  blockIds: SocioambientalReportBlockId[];
};

const CORE_MG_BLOCKS: SocioambientalReportBlockId[] = [
  "extrato_cadastro",
  "desmatamento",
  "embargos_sancoes",
  "areas_protegidas",
];

export const SOCIOAMBIENTAL_BIOMA_PRESETS: SocioambientalBiomaPreset[] = [
  {
    id: "mg_padrao",
    label: "MG — pacote padrão",
    description: "Cadastro, desmatamento, embargos e áreas protegidas.",
    blockIds: [...CORE_MG_BLOCKS],
  },
  {
    id: "cerrado",
    label: "Cerrado",
    description: "Pacote padrão + ênfase em PRODES Cerrado e MapBiomas Alerta.",
    blockIds: [...CORE_MG_BLOCKS],
  },
  {
    id: "mata_atlantica",
    label: "Mata Atlântica",
    description: "Pacote padrão + recursos hídricos (APP e outorgas).",
    blockIds: [...CORE_MG_BLOCKS, "recursos_hidricos"],
  },
  {
    id: "amazonia",
    label: "Amazônia / transição",
    description: "Pacote padrão + hídricos e contexto ambiental.",
    blockIds: [
      ...CORE_MG_BLOCKS,
      "recursos_hidricos",
      "contexto_ambiental",
    ],
  },
  {
    id: "completo",
    label: "Pacote completo",
    description: "Todos os blocos temáticos disponíveis.",
    blockIds: SOCIOAMBIENTAL_REPORT_BLOCKS.map((b) => b.id),
  },
];

export function getBlocksForBiomaPreset(
  presetId: SocioambientalBiomaPresetId,
): SocioambientalReportBlockId[] {
  const preset = SOCIOAMBIENTAL_BIOMA_PRESETS.find((p) => p.id === presetId);
  return preset ? [...preset.blockIds] : getDefaultSelectedBlockIds();
}

export function getBiomaPreset(
  presetId: SocioambientalBiomaPresetId,
): SocioambientalBiomaPreset {
  const preset = SOCIOAMBIENTAL_BIOMA_PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error(`Preset de bioma desconhecido: ${presetId}`);
  return preset;
}
