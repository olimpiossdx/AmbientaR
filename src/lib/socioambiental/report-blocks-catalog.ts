/**
 * Blocos temáticos de relatório socioambiental (padrão Sicoob/AgroTools).
 * Cada bloco agrupa camadas do motor geoespacial Wave A.
 */

import {
  FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID,
  FEDERAL_PRODES_CERRADO_LAYER_ID,
  FEDERAL_PRODES_LEGAL_AMZ_LAYER_ID,
  FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
  FEDERAL_TI_LAYER_ID,
  FEDERAL_UC_LAYER_ID,
  IBAMA_EMBARGOS_LAYER_ID,
} from "@/lib/geospatial/wave-federal-catalog";
import { resolveAllLayersForBbox } from "@/lib/geospatial/geo-all-layers";

export type SocioambientalReportBlockId =
  | "extrato_cadastro"
  | "desmatamento"
  | "embargos_sancoes"
  | "areas_protegidas"
  | "recursos_hidricos"
  | "contexto_ambiental"
  | "licenciamento_mg";

export type SocioambientalReportBlock = {
  id: SocioambientalReportBlockId;
  title: string;
  description: string;
  /** Rótulo do critério no extrato (Apto/Inapto). */
  criterioLabel: string;
  layerIds: readonly string[];
  defaultSelected: boolean;
};

export const SOCIOAMBIENTAL_REPORT_BLOCKS: SocioambientalReportBlock[] = [
  {
    id: "extrato_cadastro",
    title: "Cadastro rural (CAR/SICAR)",
    description: "Imóveis rurais no recorte e APP hídrica (MapBiomas/CAR).",
    criterioLabel: "Cadastro Rural (CAR)",
    layerIds: ["br_sicar_imoveis", "mg_app_hidrica_mapcar"],
    defaultSelected: true,
  },
  {
    id: "desmatamento",
    title: "Desmatamento e supressão",
    description: "PRODES (Cerrado, Mata Atlântica, Amazônia Legal) e MapBiomas Alerta.",
    criterioLabel: "Desmatamento / Supressão de vegetação",
    layerIds: [
      FEDERAL_PRODES_CERRADO_LAYER_ID,
      FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
      FEDERAL_PRODES_LEGAL_AMZ_LAYER_ID,
      FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID,
    ],
    defaultSelected: true,
  },
  {
    id: "embargos_sancoes",
    title: "Embargos e sanções",
    description: "Embargos IBAMA (SISCOM) e ICMBio no território.",
    criterioLabel: "Embargos ambientais",
    layerIds: [IBAMA_EMBARGOS_LAYER_ID, "br_icmbio_embargos"],
    defaultSelected: true,
  },
  {
    id: "areas_protegidas",
    title: "Áreas protegidas",
    description: "UC federal/estadual, TI e sobreposição com unidades de conservação.",
    criterioLabel: "Unidades de Conservação e Terras Indígenas",
    layerIds: [
      FEDERAL_UC_LAYER_ID,
      FEDERAL_TI_LAYER_ID,
      "br_mma_uc_cnuc",
      "br_icmbio_uc_federal",
      "mg_unidades_conservacao",
    ],
    defaultSelected: true,
  },
  {
    id: "recursos_hidricos",
    title: "Recursos hídricos",
    description: "Hidrografia, massas d'água, APP e outorgas IGAM.",
    criterioLabel: "Recursos hídricos e outorgas",
    layerIds: [
      "mg_hidrografia",
      "mg_massas_dagua",
      "mg_hidrografia_classe_especial",
      "mg_outorgas_igam",
    ],
    defaultSelected: false,
  },
  {
    id: "contexto_ambiental",
    title: "Contexto ambiental (MG)",
    description: "Bioma, solos, geologia, fauna, ZEE e ICMS ecológico.",
    criterioLabel: "Contexto ambiental estadual",
    layerIds: [
      "mg_bioma",
      "mg_solos",
      "mg_geologia",
      "mg_geomorfologia",
      "mg_pedologia",
      "mg_inventario_florestal",
      "mg_fauna",
      "mg_zee_zonas",
      "mg_icms_ecologico",
    ],
    defaultSelected: false,
  },
  {
    id: "licenciamento_mg",
    title: "Licenciamento (MG)",
    description: "Empreendimentos licenciados e licenciamento municipal.",
    criterioLabel: "Licenciamento ambiental",
    layerIds: ["mg_licenciamento_municipal", "mg_empreendimentos_licenciados"],
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
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of blockIds) {
    const block = BLOCKS_BY_ID.get(id);
    if (!block) continue;
    for (const layerId of block.layerIds) {
      if (seen.has(layerId)) continue;
      seen.add(layerId);
      out.push(layerId);
    }
  }
  return out;
}

/** Camadas resolvidas para o bbox que pertencem aos blocos (para contagem na UI). */
export function countLayersForBlocks(
  blockIds: SocioambientalReportBlockId[],
  bbox: [number, number, number, number],
): number {
  const wanted = new Set(resolveLayerIdsFromBlocks(blockIds));
  return resolveAllLayersForBbox(bbox).filter((e) => wanted.has(e.layerId))
    .length;
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
