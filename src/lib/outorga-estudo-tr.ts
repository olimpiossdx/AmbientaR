import type { OutorgaModoCategoria } from "@/lib/outorga-mg-catalog";
import { getModoUsoByCodigo } from "@/lib/outorga-mg-catalog";

export type OutorgaEstudoTrFieldType =
  | "text"
  | "textarea"
  | "number"
  | "finalidade_tabela03";

export type OutorgaEstudoTrFieldDef = {
  id: string;
  label: string;
  type?: OutorgaEstudoTrFieldType;
  placeholder?: string;
  hint?: string;
  rows?: number;
};

export type OutorgaEstudoTrSectionDef = {
  id: string;
  title: string;
  description?: string;
  fields: OutorgaEstudoTrFieldDef[];
};

/** Conteúdo editável do estudo / formulário técnico (chave = id do campo). */
export type OutorgaEstudoTr = Record<string, string>;

const SECOES_COMUNS: OutorgaEstudoTrSectionDef[] = [
  {
    id: "requerimento",
    title: "1. Requerimento e responsável técnico",
    description:
      "Dados do requerente e do profissional habilitado (ART), conforme requerimento IGAM.",
    fields: [
      { id: "requerente_razao", label: "Requerente (razão social / nome)", type: "text" },
      { id: "requerente_cpf_cnpj", label: "CPF/CNPJ", type: "text" },
      { id: "requerente_endereco", label: "Endereço para correspondência", type: "textarea", rows: 2 },
      { id: "requerente_contato", label: "Telefone e e-mail", type: "text" },
      { id: "rt_nome_crea", label: "Responsável técnico (nome e CREA)", type: "text" },
      { id: "art_numero", label: "Nº da ART", type: "text" },
    ],
  },
  {
    id: "empreendimento",
    title: "2. Empreendimento e localização",
    description: "Caracterização do empreendimento e do ponto de intervenção.",
    fields: [
      { id: "nome_empreendimento", label: "Nome do empreendimento / propriedade", type: "text" },
      { id: "municipio_uf", label: "Município / UF", type: "text", placeholder: "Ex.: Unaí — MG" },
      { id: "coordenadas_ponto", label: "Coordenadas do ponto (SIRGAS 2000)", type: "text" },
      { id: "bacia_hidrografica", label: "Bacia hidrográfica", type: "text" },
      { id: "denominacao_corpo_hidrico", label: "Denominação do corpo hídrico / aquífero", type: "text" },
      { id: "trecho_intervencao", label: "Trecho / local da intervenção", type: "textarea", rows: 2 },
    ],
  },
  {
    id: "finalidade_uso",
    title: "3. Finalidade e parâmetros do uso",
    description: "Conforme Tabela 03 (Portaria IGAM 48/2019) e TR do código.",
    fields: [
      {
        id: "finalidade_tabela03",
        label: "Finalidade do uso da água (Tabela 03)",
        type: "finalidade_tabela03",
      },
      { id: "vazao_requerida", label: "Vazão requerida", type: "text", placeholder: "Ex.: 2,5 L/s" },
      { id: "regime_captacao", label: "Regime de captação / operação", type: "textarea", rows: 2 },
      { id: "horario_periodo_uso", label: "Horário ou período de uso", type: "text" },
    ],
  },
  {
    id: "hidrologia",
    title: "4. Caracterização hidrológica / hidrogeológica",
    description: "Vazão disponível, método e memorial de cálculo (TR).",
    fields: [
      { id: "metodo_vazao_disponivel", label: "Método de determinação da vazão disponível", type: "textarea", rows: 2 },
      { id: "vazao_referencia", label: "Vazão de referência (Q95, Q70, etc.)", type: "text" },
      {
        id: "memorial_vazao",
        label: "Memorial de cálculo da vazão legalmente disponível",
        type: "textarea",
        rows: 4,
      },
    ],
  },
  {
    id: "intervencao",
    title: "5. Descrição da intervenção e obras",
    fields: [
      { id: "descricao_intervencao", label: "Descrição da intervenção", type: "textarea", rows: 4 },
      { id: "obras_instalacoes", label: "Obras e instalações (captação, barramento, etc.)", type: "textarea", rows: 3 },
      { id: "area_intervencao", label: "Área de intervenção / instalação", type: "text" },
    ],
  },
  {
    id: "balanco",
    title: "6. Balanço hídrico e fluxograma",
    fields: [
      {
        id: "balanco_hidrico",
        label: "Balanço hídrico (entradas, usos, perdas, devoluções)",
        type: "textarea",
        rows: 5,
        hint: "Incluir fluxograma em anexo no checklist quando exigido pelo TR.",
      },
      { id: "consumo_estimado", label: "Consumo estimado (m³/mês ou m³/dia)", type: "text" },
    ],
  },
  {
    id: "impactos",
    title: "7. Impactos e medidas mitigadoras",
    fields: [
      { id: "impactos_ambientais", label: "Impactos ambientais identificados", type: "textarea", rows: 3 },
      { id: "medidas_mitigadoras", label: "Medidas mitigadoras / condicionantes propostas", type: "textarea", rows: 3 },
    ],
  },
  {
    id: "sintese",
    title: "8. Síntese para o requerimento (SOUT/SEI)",
    description: "Texto consolidado para colar no requerimento ou relatório técnico.",
    fields: [
      {
        id: "sintese_requerimento",
        label: "Síntese do pedido de outorga",
        type: "textarea",
        rows: 6,
      },
      { id: "observacoes_finais", label: "Observações complementares", type: "textarea", rows: 3 },
    ],
  },
];

const SECOES_POR_CATEGORIA: Partial<
  Record<OutorgaModoCategoria, OutorgaEstudoTrSectionDef[]>
> = {
  superficial: [
    {
      id: "superficial_tr",
      title: "Específico — água superficial",
      fields: [
        { id: "tipo_corpo_agua", label: "Tipo (rio, lago, reservatório)", type: "text" },
        { id: "sistema_captacao", label: "Sistema de captação", type: "textarea", rows: 2 },
        { id: "area_inundada_barramento", label: "Área inundada / barramento (se aplicável)", type: "text" },
      ],
    },
  ],
  subterranea: [
    {
      id: "subterranea_tr",
      title: "Específico — água subterrânea",
      fields: [
        { id: "aquifero", label: "Aquífero", type: "text" },
        { id: "profundidade_poco", label: "Profundidade do poço (m)", type: "text" },
        { id: "niveis_poco", label: "Nível estático / dinâmico", type: "text" },
        { id: "teste_bombeamento", label: "Teste de bombeamento / produção", type: "textarea", rows: 2 },
      ],
    },
  ],
  efluente: [
    {
      id: "efluente_tr",
      title: "Específico — lançamento de efluentes",
      fields: [
        { id: "caracterizacao_efluente", label: "Caracterização do efluente", type: "textarea", rows: 3 },
        { id: "vazao_efluente", label: "Vazão do lançamento", type: "text" },
        {
          id: "memorial_diluicao",
          label: "Memorial de vazão de diluição (Portaria 48/2019)",
          type: "textarea",
          rows: 4,
        },
        { id: "parametros_lancamento", label: "Parâmetros e padrões de lançamento", type: "textarea", rows: 3 },
      ],
    },
  ],
  estrutura: [
    {
      id: "estrutura_tr",
      title: "Específico — estruturas em curso d'água",
      fields: [
        { id: "tipo_estrutura", label: "Tipo de estrutura (desvio, travessia, etc.)", type: "text" },
        { id: "dimensoes_estrutura", label: "Dimensões / extensão", type: "textarea", rows: 2 },
        { id: "metodo_execucao", label: "Método construtivo / execução", type: "textarea", rows: 2 },
      ],
    },
  ],
  coletivo: [
    {
      id: "coletivo_tr",
      title: "Específico — uso coletivo",
      fields: [
        { id: "num_beneficiarios", label: "Número de beneficiários", type: "text" },
        { id: "distribuicao_usuarios", label: "Distribuição dos usuários na bacia", type: "textarea", rows: 3 },
      ],
    },
  ],
};

export function getEstudoTrSections(codigo: string): OutorgaEstudoTrSectionDef[] {
  const modo = getModoUsoByCodigo(codigo);
  const cat = modo?.categoria;
  const extras = cat ? (SECOES_POR_CATEGORIA[cat] ?? []) : [];
  const insertAt = 3;
  return [
    ...SECOES_COMUNS.slice(0, insertAt),
    ...extras,
    ...SECOES_COMUNS.slice(insertAt),
  ];
}

export function buildEmptyEstudoTr(codigo: string): OutorgaEstudoTr {
  const out: OutorgaEstudoTr = {};
  for (const sec of getEstudoTrSections(codigo)) {
    for (const f of sec.fields) {
      out[f.id] = "";
    }
  }
  return out;
}

export function mergeEstudoTr(
  codigo: string,
  saved?: OutorgaEstudoTr | null,
): OutorgaEstudoTr {
  return { ...buildEmptyEstudoTr(codigo), ...(saved ?? {}) };
}

export function estudoTrProgress(
  codigo: string,
  values: OutorgaEstudoTr,
): { preenchidos: number; total: number; percentual: number } {
  const sections = getEstudoTrSections(codigo);
  const ids = sections.flatMap((s) => s.fields.map((f) => f.id));
  const total = ids.length;
  const preenchidos = ids.filter((id) => (values[id] ?? "").trim().length > 0).length;
  return {
    preenchidos,
    total,
    percentual: total > 0 ? Math.round((preenchidos / total) * 100) : 0,
  };
}

/** Campos mínimos para considerar estudo apto a avançar para documentação. */
const CAMPOS_MINIMOS = [
  "requerente_razao",
  "denominacao_corpo_hidrico",
  "finalidade_tabela03",
  "vazao_requerida",
  "descricao_intervencao",
  "sintese_requerimento",
];

export function estudoTrMinimoPreenchido(values: OutorgaEstudoTr): boolean {
  return CAMPOS_MINIMOS.every((id) => (values[id] ?? "").trim().length > 0);
}
