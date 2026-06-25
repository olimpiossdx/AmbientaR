/**
 * Catálogo oficial de modos de uso / códigos de outorga — Minas Gerais (IGAM).
 * Fontes: Portaria IGAM 48/2019 (Tabela 01), Tabelas de Apoio, custos vigentes 01/01/2026, Decreto 47.705/2019.
 * UFEMG: Resolução SEF nº 5.969/2025 (exercício 2026).
 */
import { buildChecklistFromTr } from "@/lib/igam-tr-catalog";

export const OUTORGA_MG_EXERCICIO_TAXAS = 2026;
export const OUTORGA_MG_UFEMG = 5.7899;
export const OUTORGA_MG_RESOLUCAO_UFEMG = "SEF nº 5.969/2025";

export const OUTORGA_MG_LINKS = {
  custosOutorga: "https://igam.mg.gov.br/w/custos-de-outorga",
  taxasProcessosOutorga:
    "https://igam.mg.gov.br/web/igam/taxas-de-processos-de-outorga",
  custosPdfReferencia:
    "https://igam.mg.gov.br/w/custos-de-outorga",
  ufemgSef: "https://www.fazenda.mg.gov.br/empresas/legislacao_tributaria/resolucoes/ufemg.html",
  orientacoesSout:
    "https://igam.mg.gov.br/w/orientacoes-para-obtencao-de-outorga-1",
  formularios: "https://igasimm.mg.gov.br/outorga/formularios",
  tabelasApoio:
    "https://igam.mg.gov.br/documents/d/igam/tabelas_de_apoio_abr_2020-pdf",
  decreto47705Almg:
    "https://www.almg.gov.br/legislacao-mineira/texto/DEC/47705/2019/?cons=1",
  portaria48Siam:
    "http://www.siam.mg.gov.br/sla/download.pdf?idNorma=49719",
  decreto47705Siam:
    "http://www.siam.mg.gov.br/sla/download.pdf?idNorma=49498",
  consultaOutorgas:
    "https://sistemas.meioambiente.mg.gov.br/licenciamento/site/lista-outorgas",
} as const;

export type OutorgaModoCategoria =
  | "superficial"
  | "subterranea"
  | "estrutura"
  | "efluente"
  | "coletivo"
  | "administrativo"
  | "correlato";

export type OutorgaTipoServico =
  | "outorga"
  | "renovacao"
  | "retificacao"
  | "preventiva"
  | "drdh"
  | "coletiva"
  | "uso_insignificante"
  | "uso_isento"
  | "autorizacao_perfuracao"
  | "emergencial";

export type OutorgaEtapaProcesso =
  | "rascunho"
  | "elaboracao_estudos"
  | "documentacao"
  | "taxa_paga"
  | "protocolado"
  | "analise"
  | "exigencia"
  | "deferido"
  | "indeferido"
  | "publicado";

export const OUTORGA_ETAPAS_ORDEM: OutorgaEtapaProcesso[] = [
  "rascunho",
  "elaboracao_estudos",
  "documentacao",
  "taxa_paga",
  "protocolado",
  "analise",
  "exigencia",
  "deferido",
  "indeferido",
  "publicado",
];

export const OUTORGA_ETAPA_LABELS: Record<OutorgaEtapaProcesso, string> = {
  rascunho: "Rascunho",
  elaboracao_estudos: "Elaboração dos estudos",
  documentacao: "Documentação",
  taxa_paga: "Taxa paga",
  protocolado: "Protocolado (SOUT)",
  analise: "Análise técnica",
  exigencia: "Exigência / complementação",
  deferido: "Deferido",
  indeferido: "Indeferido",
  publicado: "Portaria publicada",
};

/** Tabela 03 — Finalidade do uso (Portaria IGAM 48/2019 / Tabelas de apoio IGAM). */
export type OutorgaFinalidadeTabela03 = {
  id: string;
  label: string;
};

export const OUTORGA_TABELA03_FINALIDADES: OutorgaFinalidadeTabela03[] = [
  { id: "abastecimento_publico", label: "Abastecimento público" },
  { id: "clarificacao", label: "Clarificação de água" },
  { id: "consumo_agroindustrial", label: "Consumo agroindustrial" },
  { id: "consumo_humano", label: "Consumo humano" },
  { id: "consumo_industrial", label: "Consumo industrial" },
  { id: "contencao_sedimentos", label: "Contenção de sedimentos" },
  { id: "contencao_taludes", label: "Contenção de taludes" },
  { id: "controle_cheias", label: "Controle de cheias" },
  { id: "depuracao_efluentes", label: "Depuração de efluentes" },
  { id: "desassoreamento_limpeza", label: "Desassoreamento e/ou limpeza" },
  { id: "dessedentacao_animais", label: "Dessedentação de animais" },
  { id: "disposicao_rejeitos", label: "Disposição de rejeitos" },
  { id: "extracao_mineral", label: "Extração mineral" },
  { id: "geracao_energia", label: "Geração de energia" },
  { id: "irrigacao", label: "Irrigação" },
  { id: "lavagem_veiculos", label: "Lavagem de veículos" },
  { id: "paisagismo", label: "Paisagismo" },
  { id: "pesquisa_mineral", label: "Pesquisa mineral" },
  { id: "pesquisa_hidrogeologica", label: "Pesquisa hidrogeológica" },
  { id: "rebaixamento_nivel", label: "Rebaixamento de nível d'água" },
  { id: "recirculacao", label: "Recirculação de água" },
  { id: "recreacao", label: "Recreação" },
  { id: "regularizacao_vazao", label: "Regularização de vazão" },
  { id: "remediacao_agua", label: "Remediação de água contaminada" },
  { id: "transposicao_corpo", label: "Transposição de corpo de água" },
  { id: "outras", label: "Outras — definir" },
];

export function getFinalidadeTabela03Label(idOrLabel: string): string {
  const trimmed = idOrLabel.trim();
  if (!trimmed) return "";
  const byId = OUTORGA_TABELA03_FINALIDADES.find((f) => f.id === trimmed);
  if (byId) return byId.label;
  const byLabel = OUTORGA_TABELA03_FINALIDADES.find(
    (f) => f.label.toLowerCase() === trimmed.toLowerCase(),
  );
  return byLabel?.label ?? trimmed;
}

export function resolveFinalidadeTabela03Value(
  stored?: string | null,
): string {
  const v = (stored ?? "").trim();
  if (!v) return "";
  if (OUTORGA_TABELA03_FINALIDADES.some((f) => f.id === v)) return v;
  const match = OUTORGA_TABELA03_FINALIDADES.find(
    (f) => f.label.toLowerCase() === v.toLowerCase(),
  );
  return match?.id ?? v;
}

export type OutorgaChecklistItemDef = {
  id: string;
  label: string;
  obrigatorio: boolean;
  grupo?: "geral" | "tecnico" | "taxa" | "protocolo";
};

/** Documentos comuns — Decreto 47.705/2019, art. 21 e Portaria 48/2019 */
export const OUTORGA_CHECKLIST_GERAL: OutorgaChecklistItemDef[] = [
  {
    id: "requerimento",
    label: "Requerimento de outorga (modelo IGAM)",
    obrigatorio: true,
    grupo: "geral",
  },
  {
    id: "cpf_cnpj",
    label: "Comprovante CPF/CNPJ e documentos cadastrais",
    obrigatorio: true,
    grupo: "geral",
  },
  {
    id: "posse_imovel",
    label: "Declaração de posse do imóvel ou anuência do proprietário",
    obrigatorio: true,
    grupo: "geral",
  },
  {
    id: "art",
    label: "ART do responsável técnico (CREA)",
    obrigatorio: true,
    grupo: "tecnico",
  },
  {
    id: "formulario_tecnico",
    label: "Formulário técnico padrão — intervenção em recursos hídricos",
    obrigatorio: true,
    grupo: "tecnico",
  },
  {
    id: "relatorio_tecnico",
    label: "Relatório técnico (profissional habilitado)",
    obrigatorio: true,
    grupo: "tecnico",
  },
  {
    id: "carta_croqui",
    label: "Carta geográfica / croqui do ponto de intervenção",
    obrigatorio: true,
    grupo: "tecnico",
  },
  {
    id: "comprovante_taxa",
    label: "Comprovante de pagamento da taxa (DAE)",
    obrigatorio: true,
    grupo: "taxa",
  },
  {
    id: "declaracao_urbana_rural",
    label: "Declaração outorga área urbana ou rural (quando aplicável)",
    obrigatorio: false,
    grupo: "geral",
  },
];

export type OutorgaModoUsoDef = {
  codigo: string;
  label: string;
  categoria: OutorgaModoCategoria;
  tipoServico: OutorgaTipoServico;
  trPdfUrl?: string;
  taxaAnaliseBrl?: number;
  taxaInsignificanteBrl?: number;
  formularioTecnico?: string;
  checklistExtra?: OutorgaChecklistItemDef[];
  selecionavelNovaOutorga: boolean;
};

const IGAM_DOC = "https://igam.mg.gov.br/documents/d/igam";

/** Tabela 01 — modos de uso outorgáveis (Portaria IGAM 48/2019) */
export const OUTORGA_MODOS_USO_MG: OutorgaModoUsoDef[] = [
  {
    codigo: "01",
    label: "Captação em corpo de água (rios, lagoas naturais, etc.)",
    categoria: "superficial",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_01-captacao_em_corpo_de_agua_set_2023-pdf`,
    taxaAnaliseBrl: 724.72,
    taxaInsignificanteBrl: 24.72,
    formularioTecnico: "Água Superficial",
    checklistExtra: [
      {
        id: "fluxograma_balanco",
        label: "Fluxograma do balanço hídrico",
        obrigatorio: true,
        grupo: "tecnico",
      },
      {
        id: "memorial_vazao",
        label: "Memorial de cálculo da vazão legalmente disponível",
        obrigatorio: true,
        grupo: "tecnico",
      },
    ],
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "02",
    label: "Captação em barramento — sem regularização de vazão",
    categoria: "superficial",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_02-captacao_barramento_sem_regularizacao_set_2023-pdf`,
    taxaAnaliseBrl: 957.31,
    taxaInsignificanteBrl: 24.72,
    formularioTecnico: "Água Superficial",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "03",
    label:
      "Captação em barramento com regularização de vazão (área inundada ≤ 5 ha)",
    categoria: "superficial",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_03-captacao_barramento_com_regularizacao_ate_5ha_set_2023-pdf`,
    taxaAnaliseBrl: 1656.19,
    taxaInsignificanteBrl: 24.72,
    formularioTecnico: "Água Superficial",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "04",
    label:
      "Captação em barramento com regularização de vazão (área inundada > 5 ha)",
    categoria: "superficial",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_04-captacao_barramento_com_regularizacao_maior_5ha_set_2023-pdf`,
    taxaAnaliseBrl: 2821.36,
    formularioTecnico: "Água Superficial",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "05",
    label: "Barramento em curso de água, sem captação",
    categoria: "superficial",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_05-barramento_sem_captacao_set_2023-pdf`,
    taxaAnaliseBrl: 957.31,
    taxaInsignificanteBrl: 24.72,
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "06",
    label: "Barramento sem captação — regularização de vazão",
    categoria: "superficial",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_06-barramento_sem_captacao_regularizacao_set_2023-pdf`,
    taxaAnaliseBrl: 957.31,
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "07",
    label: "Perfuração de poço tubular profundo",
    categoria: "subterranea",
    tipoServico: "autorizacao_perfuracao",
    trPdfUrl: `${IGAM_DOC}/cod_07-autorizacao_poco_tubular_set_2023-pdf`,
    taxaAnaliseBrl: 77.53,
    formularioTecnico: "Água Subterrânea",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "08",
    label: "Captação em poço tubular já existente",
    categoria: "subterranea",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_08-captacao_agua_subterranea_poco_tubular_set_2023-pdf`,
    taxaAnaliseBrl: 724.72,
    formularioTecnico: "Água Subterrânea",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "09",
    label: "Captação de água subterrânea — poço manual / cisterna",
    categoria: "subterranea",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_09-captacao_agua_subterranea_poco_manual_set_2023-pdf`,
    taxaAnaliseBrl: 724.72,
    taxaInsignificanteBrl: 24.72,
    formularioTecnico: "Água Subterrânea",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "10",
    label: "Captação subterrânea — rebaixamento de nível (mineração)",
    categoria: "subterranea",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_10-captacao_subterranea_rebaixamento_mineracao_set_2023-pdf`,
    taxaAnaliseBrl: 7518.31,
    formularioTecnico: "Água Subterrânea",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "10.1",
    label: "Captação subterrânea — remediação de água contaminada",
    categoria: "subterranea",
    tipoServico: "outorga",
    taxaAnaliseBrl: 7518.31,
    formularioTecnico: "Água Subterrânea",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "10.2",
    label: "Captação subterrânea — bateria de poços tubulares",
    categoria: "subterranea",
    tipoServico: "outorga",
    taxaAnaliseBrl: 7518.31,
    formularioTecnico: "Água Subterrânea",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "11",
    label: "Captação em nascente / surgência",
    categoria: "subterranea",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_11-captacao_agua_subterranea_surgencia_set_2023-pdf`,
    taxaAnaliseBrl: 724.72,
    formularioTecnico: "Água Subterrânea",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "12",
    label: "Desvio parcial ou total de curso de água",
    categoria: "estrutura",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_12-desvio_curso_agua_set_2023-pdf`,
    taxaAnaliseBrl: 724.72,
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "14",
    label: "Dragagem de curso de água para mineração",
    categoria: "estrutura",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_14-dragagem_mineracao_set_2023-pdf`,
    taxaAnaliseBrl: 724.72,
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "15",
    label: "Canalização e/ou retificação de curso de água",
    categoria: "estrutura",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_15-canalizacao_retificacao_set_2023-pdf`,
    taxaAnaliseBrl: 724.72,
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "16",
    label: "Travessia rodoferroviária (pontes e bueiros)",
    categoria: "estrutura",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_16-travessia_rodoferroviaria_set_2023-pdf`,
    taxaAnaliseBrl: 957.31,
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "17",
    label: "Estrutura de transposição de nível (eclusa)",
    categoria: "estrutura",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_17-transposicao_nivel_set_2023-pdf`,
    taxaAnaliseBrl: 957.31,
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "18",
    label: "Lançamento de efluente em corpo de água",
    categoria: "efluente",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_18-lancamento_de_efluentes_ago_2023-pdf`,
    taxaAnaliseBrl: 2223.6,
    formularioTecnico: "Água Superficial",
    checklistExtra: [
      {
        id: "memorial_diluicao",
        label: "Memorial de cálculo de vazão de diluição (Portaria IGAM 48/2019)",
        obrigatorio: true,
        grupo: "tecnico",
      },
    ],
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "20",
    label: "Aproveitamento de potencial hidrelétrico",
    categoria: "estrutura",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_20-aproveitamento_hidreletrico_set_2023-pdf`,
    taxaAnaliseBrl: 5684.35,
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "23",
    label: "Captação subterrânea — pesquisa hidrogeológica",
    categoria: "subterranea",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_23-pesquisa_hidrogeologica_set_2023-pdf`,
    taxaAnaliseBrl: 5346.51,
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "24",
    label: "Rebaixamento de nível — obras civis",
    categoria: "subterranea",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_24-rebaixamento_obras_civis_set_2023-pdf`,
    taxaAnaliseBrl: 875.36,
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "25",
    label: "Processo único de outorga — uso coletivo",
    categoria: "coletivo",
    tipoServico: "coletiva",
    trPdfUrl: `${IGAM_DOC}/25-processo_unico_outorga-pdf`,
    checklistExtra: [
      {
        id: "formulario_por_usuario",
        label: "Formulário técnico por ponto de captação ou por usuário",
        obrigatorio: true,
        grupo: "tecnico",
      },
      {
        id: "mapa_usuarios_bacia",
        label: "Croqui com distribuição dos usuários na bacia",
        obrigatorio: true,
        grupo: "tecnico",
      },
    ],
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "26",
    label: "Dragagem em cava aluvionar — extração mineral",
    categoria: "estrutura",
    tipoServico: "outorga",
    trPdfUrl: `${IGAM_DOC}/cod_26-dragagem_cava_aluvionar_set_2023-pdf`,
    taxaAnaliseBrl: 875.36,
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "30",
    label: "Retificação / reanálise de informações",
    categoria: "administrativo",
    tipoServico: "retificacao",
    taxaAnaliseBrl: 624.32,
    taxaInsignificanteBrl: 104.49,
    selecionavelNovaOutorga: false,
  },
];

/** Retificação / reanálise (serviço administrativo IGAM — tabela de custos). */
export const OUTORGA_TAXA_RETIFICACAO_REANALISE_BRL = 1719.75;

/** Processo único coletivo (código 25) — faixas IGAM, exercício 2026. */
export const OUTORGA_COLETIVO_FAIXAS_2026: {
  qtdeInicial: number;
  qtdeFinal: number;
  valorAnaliseBrl: number;
}[] = [
  { qtdeInicial: 3, qtdeFinal: 5, valorAnaliseBrl: 3633.19 },
  { qtdeInicial: 6, qtdeFinal: 10, valorAnaliseBrl: 4168.45 },
  { qtdeInicial: 11, qtdeFinal: 15, valorAnaliseBrl: 7266.41 },
  { qtdeInicial: 16, qtdeFinal: 20, valorAnaliseBrl: 7801.68 },
  { qtdeInicial: 21, qtdeFinal: 25, valorAnaliseBrl: 10899.61 },
  { qtdeInicial: 26, qtdeFinal: 30, valorAnaliseBrl: 11434.88 },
  { qtdeInicial: 31, qtdeFinal: 35, valorAnaliseBrl: 14532.8 },
  { qtdeInicial: 36, qtdeFinal: 40, valorAnaliseBrl: 15068.09 },
  { qtdeInicial: 41, qtdeFinal: 45, valorAnaliseBrl: 18165.99 },
  { qtdeInicial: 46, qtdeFinal: 50, valorAnaliseBrl: 18701.29 },
  { qtdeInicial: 51, qtdeFinal: 55, valorAnaliseBrl: 19401.22 },
  { qtdeInicial: 56, qtdeFinal: 60, valorAnaliseBrl: 19877.61 },
  { qtdeInicial: 61, qtdeFinal: 65, valorAnaliseBrl: 25432.41 },
  { qtdeInicial: 66, qtdeFinal: 70, valorAnaliseBrl: 23111.15 },
  { qtdeInicial: 71, qtdeFinal: 75, valorAnaliseBrl: 29065.6 },
  { qtdeInicial: 76, qtdeFinal: 80, valorAnaliseBrl: 29600.89 },
  { qtdeInicial: 81, qtdeFinal: 85, valorAnaliseBrl: 32698.8 },
  { qtdeInicial: 86, qtdeFinal: 90, valorAnaliseBrl: 33234.09 },
  { qtdeInicial: 91, qtdeFinal: 95, valorAnaliseBrl: 36331.57 },
  { qtdeInicial: 96, qtdeFinal: 100, valorAnaliseBrl: 36911.45 },
];

/** Serviços correlatos exibidos no picker (fluxos distintos) */
export const OUTORGA_SERVICOS_CORRELATOS: OutorgaModoUsoDef[] = [
  {
    codigo: "REN",
    label: "Renovação de outorga",
    categoria: "administrativo",
    tipoServico: "renovacao",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "PREV",
    label: "Outorga preventiva / DRDH",
    categoria: "correlato",
    tipoServico: "preventiva",
    selecionavelNovaOutorga: true,
  },
  {
    codigo: "EMER",
    label: "Notificação de intervenção emergencial",
    categoria: "correlato",
    tipoServico: "emergencial",
    selecionavelNovaOutorga: true,
  },
];

export const OUTORGA_CATEGORIA_LABELS: Record<OutorgaModoCategoria, string> = {
  superficial: "Superficial",
  subterranea: "Subterrânea",
  estrutura: "Estruturas / intervenções",
  efluente: "Efluentes",
  coletivo: "Coletivo",
  administrativo: "Administrativo",
  correlato: "Serviços correlatos",
};

export function getModoUsoByCodigo(
  codigo: string,
): OutorgaModoUsoDef | undefined {
  return (
    OUTORGA_MODOS_USO_MG.find((m) => m.codigo === codigo) ??
    OUTORGA_SERVICOS_CORRELATOS.find((m) => m.codigo === codigo)
  );
}

export function buildChecklistForModo(codigo: string): OutorgaChecklistItemDef[] {
  return buildChecklistFromTr(codigo);
}

/** Links oficiais IGAM/SEMAD para o código escolhido (sem campos undefined). */
export function buildOutorgaLinksExternos(codigo: string): Record<string, string> {
  const modo = getModoUsoByCodigo(codigo);
  const links: Record<string, string | undefined> = {
    trPdfUrl: modo?.trPdfUrl,
    trTitulo: modo?.trPdfUrl
      ? `TR IGAM — Cód. ${modo.codigo}: ${modo.label}`
      : modo
        ? `Modo de uso ${modo.codigo} — consulte formulários IGAM`
        : undefined,
    formularios: OUTORGA_MG_LINKS.formularios,
    custosOutorga: OUTORGA_MG_LINKS.custosOutorga,
    taxasProcessos: OUTORGA_MG_LINKS.taxasProcessosOutorga,
    tabelasApoio: OUTORGA_MG_LINKS.tabelasApoio,
    sout: OUTORGA_MG_LINKS.orientacoesSout,
    consultaPublica: OUTORGA_MG_LINKS.consultaOutorgas,
    legislacaoDecreto: OUTORGA_MG_LINKS.decreto47705Almg,
    portariaTabela01: OUTORGA_MG_LINKS.portaria48Siam,
  };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(links)) {
    if (typeof v === "string" && v.length > 0) out[k] = v;
  }
  return out;
}

export const OUTORGA_LINKS_LABELS: Record<string, string> = {
  trPdfUrl: "Termo de referência (PDF — IGAM)",
  trTitulo: "Descrição do TR",
  formularios: "Formulários e TRs (portal IGAM)",
  custosOutorga: "Custos de outorga (IGAM)",
  taxasProcessos: "Taxas de processos (IGAM)",
  tabelasApoio: "Tabelas de apoio — Tabela 01 a 04 (PDF)",
  sout: "Orientações SOUT — obtenção de outorga",
  consultaPublica: "Consulta de outorgas (SEMAD / licenciamento MG)",
  legislacaoDecreto: "Decreto 47.705/2019 (ALMG)",
  portariaTabela01: "Portaria IGAM 48/2019 — Tabela 01 (SIAM)",
};

export function formatTaxaBrl(valor?: number): string {
  if (valor == null) return "Consultar tabela IGAM";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function listModosParaNovaOutorga(): OutorgaModoUsoDef[] {
  return [
    ...OUTORGA_MODOS_USO_MG.filter((m) => m.selecionavelNovaOutorga),
    ...OUTORGA_SERVICOS_CORRELATOS.filter((m) => m.selecionavelNovaOutorga),
  ];
}
