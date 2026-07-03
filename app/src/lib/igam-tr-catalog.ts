/**
 * Termos de Referência IGAM/SEMAD por código de modo de uso (Tabela 01).
 * Complementa {@link ./outorga-mg-catalog.ts} com requisitos estruturados e canal SOUT/SEI.
 * Plano: Hub Projeto Frentes — Fase 0.
 */
import type { InsignificantWaterUseType } from "@/lib/types";
import {
  OUTORGA_CHECKLIST_GERAL,
  getModoUsoByCodigo,
  type OutorgaChecklistItemDef,
} from "@/lib/outorga-mg-catalog";

export const IGAM_DOC_BASE = "https://igam.mg.gov.br/documents/d/igam";

export type IgamFormularioTipo =
  | "agua_superficial"
  | "agua_subterranea"
  | "autorizacao_perfuracao"
  | "lancamento_efluentes"
  | "processo_unico";

export type IgamCanalProtocolo = "sout" | "sei";

export type IgamTrRequisitoGrupo =
  | "formulario"
  | "relatorio"
  | "anexo"
  | "declaracao";

export type IgamTrRequisito = {
  id: string;
  label: string;
  grupo: IgamTrRequisitoGrupo;
  obrigatorio: boolean;
};

export type IgamModoUsoTr = {
  codigo: string;
  trPdfUrl: string;
  formularioTipo: IgamFormularioTipo;
  formularioItens: string;
  formularioItensExcluir?: string;
  formularioExtra?: string;
  canalProtocolo: IgamCanalProtocolo;
  requisitos: IgamTrRequisito[];
};

/** Códigos que permanecem no SEI (Comunicado IGAM 01/2024). */
const SEI_CODIGOS = new Set(["10", "10.1", "10.2", "18", "25"]);

function trReq(
  id: string,
  label: string,
  grupo: IgamTrRequisitoGrupo,
  obrigatorio = true,
): IgamTrRequisito {
  return { id, label, grupo, obrigatorio };
}

/** TR pesquisados (set/2023) — cód. 01–11, 18, 25. */
export const IGAM_TR_BY_CODIGO: Record<string, IgamModoUsoTr> = {
  "01": {
    codigo: "01",
    trPdfUrl: `${IGAM_DOC_BASE}/cod_01-captacao_em_corpo_de_agua_set_2023-pdf`,
    formularioTipo: "agua_superficial",
    formularioItens: "1–9 (+ transposição de bacias se aplicável)",
    canalProtocolo: "sout",
    requisitos: [
      trReq("fluxograma_balanco", "Fluxograma do balanço hídrico", "relatorio"),
      trReq("croqui_captacao", "Croqui do ponto de captação", "anexo"),
      trReq("memorial_vazao", "Memorial de cálculo da vazão (Port. 48/2019)", "relatorio"),
      trReq("projeto_irrigacao", "Projeto de irrigação (quando aplicável)", "anexo", false),
    ],
  },
  "02": {
    codigo: "02",
    trPdfUrl: `${IGAM_DOC_BASE}/cod_02-captacao_barramento_sem_regularizacao_set_2023-pdf`,
    formularioTipo: "agua_superficial",
    formularioItens: "1–9",
    canalProtocolo: "sout",
    requisitos: [
      trReq("justificativa_vazao", "Justificativa da vazão solicitada", "relatorio"),
      trReq("fluxograma_balanco", "Fluxograma do balanço hídrico", "relatorio"),
      trReq("memorial_vazao", "Memorial de cálculo da vazão", "relatorio"),
      trReq("projeto_barramento", "Projeto do barramento", "anexo"),
      trReq("memorial_vertedor", "Memorial do vertedor e descarga de fundo", "relatorio"),
    ],
  },
  "03": {
    codigo: "03",
    trPdfUrl: `${IGAM_DOC_BASE}/cod_03-captacao_barramento_com_regularizacao_ate_5ha_set_2023-pdf`,
    formularioTipo: "agua_superficial",
    formularioItens: "1–9",
    canalProtocolo: "sout",
    requisitos: [
      trReq("projeto_barramento", "Projeto do barramento (área inundada ≤ 5 ha)", "anexo"),
      trReq("memorial_vazao", "Memorial de cálculo da vazão", "relatorio"),
    ],
  },
  "04": {
    codigo: "04",
    trPdfUrl: `${IGAM_DOC_BASE}/cod_04-captacao_barramento_com_regularizacao_maior_5ha_set_2023-pdf`,
    formularioTipo: "agua_superficial",
    formularioItens: "1–9",
    canalProtocolo: "sout",
    requisitos: [
      trReq("projeto_barramento", "Projeto do barramento (área inundada > 5 ha)", "anexo"),
      trReq("memorial_vazao", "Memorial de cálculo da vazão", "relatorio"),
    ],
  },
  "05": {
    codigo: "05",
    trPdfUrl: `${IGAM_DOC_BASE}/cod_05-barramento_sem_captacao_set_2023-pdf`,
    formularioTipo: "agua_superficial",
    formularioItens: "1–9",
    canalProtocolo: "sout",
    requisitos: [
      trReq("caracterizacao_barramento", "Caracterização do barramento sem captação", "relatorio"),
    ],
  },
  "06": {
    codigo: "06",
    trPdfUrl: `${IGAM_DOC_BASE}/cod_06-barramento_sem_captacao_regularizacao_set_2023-pdf`,
    formularioTipo: "agua_superficial",
    formularioItens: "1–9",
    canalProtocolo: "sout",
    requisitos: [
      trReq(
        "regularizacao_vazao",
        "Memorial de regularização de vazão",
        "relatorio",
      ),
    ],
  },
  "07": {
    codigo: "07",
    trPdfUrl: `${IGAM_DOC_BASE}/cod_07-autorizacao_poco_tubular_set_2023-pdf`,
    formularioTipo: "autorizacao_perfuracao",
    formularioItens: "1–4 + item 5 (croqui 500 m)",
    canalProtocolo: "sout",
    requisitos: [
      trReq("croqui_500m", "Croqui com interferências em raio de 500 m", "anexo"),
      trReq("geo_hidrogeologia", "Estudo geo/hidrogeológico", "relatorio"),
      trReq("mapa_localizacao", "Mapa de localização do poço", "anexo"),
    ],
  },
  "08": {
    codigo: "08",
    trPdfUrl: `${IGAM_DOC_BASE}/cod_08-captacao_agua_subterranea_poco_tubular_set_2023-pdf`,
    formularioTipo: "agua_subterranea",
    formularioItens: "1–9, 12, 15",
    formularioItensExcluir: "10, 11, 13, 14",
    formularioExtra: "Cadastro Qualidade Água Subterrânea",
    canalProtocolo: "sout",
    requisitos: [
      trReq("cadastro_qualidade_agua", "Cadastro Qualidade Água Subterrânea", "formulario"),
      trReq("perfil_litologico", "Perfil litológico e construtivo", "anexo"),
      trReq("ensaio_bombeamento", "Ensaio de bombeamento 24 h", "relatorio"),
      trReq("interferencias_500m", "Levantamento de interferências em 500 m", "relatorio"),
    ],
  },
  "09": {
    codigo: "09",
    trPdfUrl: `${IGAM_DOC_BASE}/cod_09-captacao_agua_subterranea_poco_manual_set_2023-pdf`,
    formularioTipo: "agua_subterranea",
    formularioItens: "1–9, 11, 15",
    formularioItensExcluir: "10, 12, 13, 14",
    canalProtocolo: "sout",
    requisitos: [
      trReq("monitoramento_poco_manual", "Monitoramento do poço manual", "relatorio"),
      trReq("comportamento_sazonal", "Comportamento hidrodinâmico sazonal", "relatorio"),
    ],
  },
  "11": {
    codigo: "11",
    trPdfUrl: `${IGAM_DOC_BASE}/cod_11-captacao_agua_subterranea_surgencia_set_2023-pdf`,
    formularioTipo: "agua_subterranea",
    formularioItens: "1–9, 11, 15",
    formularioItensExcluir: "10, 12, 13, 14",
    formularioExtra: "Cadastro Qualidade Água Subterrânea",
    canalProtocolo: "sout",
    requisitos: [
      trReq("cadastro_qualidade_agua", "Cadastro Qualidade Água Subterrânea", "formulario"),
      trReq("caracterizacao_surgencia", "Caracterização da surgência e preservação", "relatorio"),
      trReq("vazao_epoca_seca", "Vazão na época seca", "relatorio"),
    ],
  },
  "18": {
    codigo: "18",
    trPdfUrl: `${IGAM_DOC_BASE}/cod_18-lancamento_de_efluentes_ago_2023-pdf`,
    formularioTipo: "lancamento_efluentes",
    formularioItens: "Formulário esgotamento sanitário ou industrial",
    canalProtocolo: "sei",
    requisitos: [
      trReq("q7_10", "Determinação de Q7,10", "relatorio"),
      trReq("dbo_bruto_tratado", "DBO bruto e tratado", "relatorio"),
      trReq("fotos_montante_jusante", "Fotos montante e jusante", "anexo"),
      trReq(
        "memorial_diluicao",
        "Memorial de diluição (50% ou 70% Q7,10)",
        "relatorio",
      ),
    ],
  },
  "25": {
    codigo: "25",
    trPdfUrl: `${IGAM_DOC_BASE}/25-processo_unico_outorga-pdf`,
    formularioTipo: "processo_unico",
    formularioItens: "1 formulário por usuário/ponto",
    canalProtocolo: "sei",
    requisitos: [
      trReq("formulario_por_usuario", "Formulário técnico por ponto ou usuário", "formulario"),
      trReq("mapa_usuarios_bacia", "Croqui com distribuição dos usuários na bacia", "anexo"),
    ],
  },
};

const TR_GRUPO_TO_CHECKLIST: Record<
  IgamTrRequisitoGrupo,
  OutorgaChecklistItemDef["grupo"]
> = {
  formulario: "tecnico",
  relatorio: "tecnico",
  anexo: "tecnico",
  declaracao: "geral",
};

function requisitosToChecklist(
  requisitos: IgamTrRequisito[],
): OutorgaChecklistItemDef[] {
  return requisitos.map((r) => ({
    id: r.id,
    label: r.label,
    obrigatorio: r.obrigatorio,
    grupo: TR_GRUPO_TO_CHECKLIST[r.grupo],
  }));
}

export function getTrByCodigo(codigo: string): IgamModoUsoTr | undefined {
  return IGAM_TR_BY_CODIGO[codigo];
}

export function getCanalProtocolo(codigo: string): IgamCanalProtocolo {
  const tr = getTrByCodigo(codigo);
  if (tr) return tr.canalProtocolo;
  if (SEI_CODIGOS.has(codigo)) return "sei";
  const modo = getModoUsoByCodigo(codigo);
  if (
    modo?.tipoServico === "renovacao" ||
    modo?.tipoServico === "retificacao" ||
    modo?.tipoServico === "coletiva"
  ) {
    return "sei";
  }
  return "sout";
}

/** Merge checklist geral + requisitos TR + extras do catálogo legado. */
export function buildChecklistFromTr(codigo: string): OutorgaChecklistItemDef[] {
  const tr = getTrByCodigo(codigo);
  const modo = getModoUsoByCodigo(codigo);
  const extraLegacy = modo?.checklistExtra ?? [];
  const trItems = tr ? requisitosToChecklist(tr.requisitos) : [];

  const ids = new Set<string>();
  const merged: OutorgaChecklistItemDef[] = [];
  for (const item of [...OUTORGA_CHECKLIST_GERAL, ...trItems, ...extraLegacy]) {
    if (ids.has(item.id)) continue;
    ids.add(item.id);
    merged.push(item);
  }
  return merged;
}

export type UsoInsignificanteLimite = {
  norma: string;
  vazaoLsMax?: number;
  volumeM3Max?: number;
  volumeLdiaMax?: number;
  notas?: string;
};

export type UsoInsignificanteElaboracaoTipo = {
  usoType: InsignificantWaterUseType;
  enquadramento: string;
  normaRef: string;
  limites: UsoInsignificanteLimite[];
  camposElaboracao: string[];
};

/** Schema de elaboração SOUT (Gestão) — espelha IS 02 + DN 09/76. */
export const USO_INSIGNIFICANTE_ELABORACAO_SCHEMA: UsoInsignificanteElaboracaoTipo[] =
  [
    {
      usoType: "Poço Tubular",
      enquadramento: "DN CERH 76/2022 — poço tubular",
      normaRef: "DN 76/2022",
      limites: [
        {
          norma: "DN 76/2022",
          volumeLdiaMax: 14000,
          notas: "Área rural, 1 poço por UI/posse; exige autorização de perfuração",
        },
      ],
      camposElaboracao: [
        "volumeLdia",
        "autorizacaoPerfuracao",
        "profundidade",
        "perfilLitologico",
        "planilhaBombeamento24h",
        "horimetro",
      ],
    },
    {
      usoType: "Captação Superficial",
      enquadramento: "DN CERH 09/2004 — superficial",
      normaRef: "DN 09/2004",
      limites: [
        {
          norma: "DN 09/2004",
          vazaoLsMax: 1.0,
          volumeM3Max: 5000,
          notas: "Resto MG",
        },
        {
          norma: "DN 09/2004",
          vazaoLsMax: 0.5,
          volumeM3Max: 40000,
          notas: "CH especiais",
        },
      ],
      camposElaboracao: ["vazaoLs", "chUpgrh", "finalidade"],
    },
    {
      usoType: "Captação Em Barramento",
      enquadramento: "DN CERH 09/2004 — acumulação",
      normaRef: "DN 09/2004",
      limites: [{ norma: "DN 09/2004", volumeM3Max: 40000, notas: "CH especiais" }],
      camposElaboracao: ["volumeAcumulacaoM3", "finalidade"],
    },
    {
      usoType: "Barramento Sem Captação",
      enquadramento: "DN CERH 09/2004 — barramento",
      normaRef: "DN 09/2004",
      limites: [{ norma: "DN 09/2004", volumeM3Max: 40000 }],
      camposElaboracao: ["volumeAcumulacaoM3", "finalidade"],
    },
    {
      usoType: "Captação em Nascente",
      enquadramento: "DN CERH 76/2022 — surgência",
      normaRef: "DN 76/2022",
      limites: [{ norma: "DN 76/2022", volumeLdiaMax: 10000 }],
      camposElaboracao: ["volumeLdia", "preservacaoSurgencia"],
    },
    {
      usoType: "Captação em Cisterna",
      enquadramento: "DN CERH 76/2022 — cisterna",
      normaRef: "DN 76/2022",
      limites: [{ norma: "DN 76/2022", volumeLdiaMax: 10000 }],
      camposElaboracao: ["volumeLdia", "finalidade"],
    },
  ];

export function getUsoInsignificanteSchema(
  usoType: InsignificantWaterUseType,
): UsoInsignificanteElaboracaoTipo | undefined {
  return USO_INSIGNIFICANTE_ELABORACAO_SCHEMA.find((s) => s.usoType === usoType);
}
