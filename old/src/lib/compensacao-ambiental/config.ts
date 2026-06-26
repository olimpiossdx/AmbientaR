/**
 * Compensação ambiental (IEF/MG) — metadados e checklists para juntada SEI.
 * Ver docs/COMPENSACAO-AMBIENTAL-CHECKLIST.md
 */

export type CompensacaoTipo =
  | "especies"
  | "snuc"
  | "mata-atlantica"
  | "mineraria"
  | "app";

export type CompensacaoChecklistPhase =
  | "comum"
  | "formalizacao"
  | "especifico"
  | "pos_analise"
  | "sei";

export type CompensacaoChecklistItem = {
  id: string;
  label: string;
  phase: CompensacaoChecklistPhase;
  required: boolean;
  note?: string;
  source?: string;
  /** Slot para upload do modelo Word oficial do IEF */
  templateWord?: boolean;
  seiOrder?: number;
};

export type CompensacaoTipoMeta = {
  tipo: CompensacaoTipo;
  label: string;
  shortLabel: string;
  description: string;
  faseImplementacao: number;
  processoSei?: string;
  referenciaIef: string;
  legislacao: string[];
};

export const COMPENSACAO_PHASE_LABELS: Record<CompensacaoChecklistPhase, string> = {
  comum: "Comum (todo processo)",
  formalizacao: "Formalização / documentação",
  especifico: "Específico do tipo",
  pos_analise: "Pós-análise / encerramento",
  sei: "Tramitação SEI",
};

const IEF_HUB = "https://www.ief.mg.gov.br/compensacao-ambiental";

function item(
  id: string,
  label: string,
  phase: CompensacaoChecklistPhase,
  required: boolean,
  extra?: Partial<CompensacaoChecklistItem>
): CompensacaoChecklistItem {
  return { id, label, phase, required, ...extra };
}

export const COMPENSACAO_COMMON_CHECKLIST: CompensacaoChecklistItem[] = [
  item("C01", "Cadastro de usuário externo no SEI!MG", "comum", true, {
    note: "Manual do usuário externo no site do IEF",
    seiOrder: 0,
  }),
  item("C02", "Habilitação SEI para compensação minerária (se aplicável)", "comum", false, {
    note: "suportesei.ief@meioambiente.mg.gov.br",
  }),
  item("C03", "Vínculo no AmbientaR: cliente / projeto / empreendimento", "comum", true, {
    seiOrder: 1,
  }),
  item("C04", "Nº processo de licenciamento ou intervenção (PA / SEI)", "comum", true, {
    seiOrder: 2,
  }),
  item("C05", "Trecho da condicionante que impõe a compensação", "comum", true, {
    seiOrder: 3,
  }),
  item("C06", "Cadastro / autorização Sinaflor (supressão de vegetação nativa)", "comum", false),
  item("C07", "Índice de juntada para peticionamento", "comum", true, {
    note: "Gerado pelo app na exportação",
    seiOrder: 99,
  }),
  item("C08", "Peticionamento intercorrente (complementação)", "comum", false, {
    phase: "sei",
  }),
];

export const COMPENSACAO_TIPOS: CompensacaoTipoMeta[] = [
  {
    tipo: "especies",
    label: "Espécies protegidas e ameaçadas",
    shortLabel: "Espécies",
    description:
      "Compensação por corte ou supressão de espécies com proteção legal específica ou ameaçadas (Lista MMA). Tramita no processo de intervenção ambiental.",
    faseImplementacao: 1,
    referenciaIef: IEF_HUB,
    legislacao: [
      "Res. Conj. SEMAD/IEF 3.102/2021",
      "Decreto MG 47.749/2019",
      "DN COPAM 114/2008",
      "Portaria MMA 443/2014",
    ],
  },
  {
    tipo: "snuc",
    label: "Compensação Ambiental SNUC",
    shortLabel: "SNUC",
    description:
      "Art. 36 da Lei 9.985/2000 — apoio a UC de Proteção Integral. Processo próprio na GCARF com planilha VR ou VCL.",
    faseImplementacao: 2,
    processoSei: "IEF – Processo de Compensação Ambiental SNUC",
    referenciaIef: "https://www.ief.mg.gov.br/w/compensacao-ambiental-snuc",
    legislacao: [
      "Lei 9.985/2000 art. 36",
      "Portaria IEF 55/2012",
      "Portaria IEF 77/2020",
      "Res. CONAMA 371/2006",
    ],
  },
  {
    tipo: "mata-atlantica",
    label: "Compensação Florestal Mata Atlântica",
    shortLabel: "Mata Atlântica",
    description:
      "Corte/supressão de vegetação no bioma Mata Atlântica. Requerimento + PECF perante o Escritório Regional do IEF.",
    faseImplementacao: 3,
    referenciaIef:
      "https://www.ief.mg.gov.br/w/compensacao-ambiental-florestal-mata-atlantica-em-unidades-de-conservacao",
    legislacao: ["Lei 11.428/2006", "Portaria IEF 30/2015"],
  },
  {
    tipo: "mineraria",
    label: "Compensação Florestal Minerária",
    shortLabel: "Minerária",
    description:
      "Art. 75 Lei 20.922/2013 — doação de área ou implantação em UC. Processo na URFBio competente.",
    faseImplementacao: 4,
    processoSei: "IEF – Processo de Compensação Minerária",
    referenciaIef: "https://www.ief.mg.gov.br/w/compensacao-ambiental-florestal-mineraria",
    legislacao: ["Lei 20.922/2013 art. 75", "Portaria IEF 27/2017"],
  },
  {
    tipo: "app",
    label: "Intervenção em APP",
    shortLabel: "APP",
    description:
      "Compensação por intervenção em Área de Preservação Permanente (Res. CONAMA 369/2006). Proposta no SEI da intervenção, área mínima 1×1.",
    faseImplementacao: 5,
    referenciaIef:
      "https://semad.mg.gov.br/w/compensacoes-por-intervencoes-ambientais",
    legislacao: ["Res. CONAMA 369/2006", "Res. Conj. SEMAD/IEF 3.102/2021"],
  },
];

const ESPECIES_CHECKLIST: CompensacaoChecklistItem[] = [
  item("E01", "Requerimento de intervenção ambiental (modelo IEF/Semad)", "formalizacao", true, {
    templateWord: true,
    source: "Res. 3.102/2021 art. 6",
    seiOrder: 10,
  }),
  item("E02", "RG/CPF e comprovante de endereço — requerente", "formalizacao", true, { seiOrder: 11 }),
  item("E03", "RG/CPF e comprovante de endereço — proprietário/possuidor", "formalizacao", true, {
    seiOrder: 12,
  }),
  item("E04", "Procuração e identificação do procurador", "formalizacao", false, { seiOrder: 13 }),
  item("E05", "Certidão de matrícula ou documento de justa posse", "formalizacao", true, { seiOrder: 14 }),
  item("E06", "Recibo de inscrição no CAR", "formalizacao", true, { seiOrder: 15 }),
  item("E07", "Contrato de locação, arrendamento ou comodato", "formalizacao", false),
  item("E08", "Carta de anuência do proprietário/posseiro", "formalizacao", false),
  item("E09", "Planta topográfica (PDF + vetorial) e ART", "formalizacao", true, { seiOrder: 16 }),
  item("E10", "PIA ou PIA simplificado e ART", "formalizacao", true, { seiOrder: 17 }),
  item(
    "E11",
    "Proposta de medidas compensatórias (espécies / MA / APP, quando cabível)",
    "formalizacao",
    true,
    { templateWord: true, source: "Res. 3.102/2021 art. 6 XI", seiOrder: 18 }
  ),
  item("E12", "DAE — Taxa de Expediente", "formalizacao", true, { seiOrder: 19 }),
  item("E13", "DAE — Taxa Florestal", "formalizacao", false),
  item(
    "E14",
    "Estudo de inexistência de alternativa técnica e locacional + ART",
    "formalizacao",
    false,
    { note: "APP ou supressão no bioma Mata Atlântica" }
  ),
  item(
    "E15",
    "Laudo técnico — espécie ameaçada essencial à viabilidade + ART",
    "formalizacao",
    false,
    { templateWord: true, source: "Res. 3.102/2021 art. 6 §5" }
  ),
  item("E16", "Planilha Excel — árvores isoladas (modelo IEF)", "formalizacao", false, {
    templateWord: true,
  }),
  item("E17", "Cadastro Sinaflor", "formalizacao", false),
  item("E20", "Levantamento / inventário com espécies ameaçadas", "especifico", true, {
    source: "art. 16 Res. 3.102/2021",
  }),
  item("E21", "Proposta de medidas compensatórias e mitigadoras (conservação in situ)", "especifico", true),
  item("E22", "ART do responsável técnico", "especifico", true),
  item("E30", "Memorial de cálculo de mudas por espécie/indivíduo", "especifico", true, {
    source: "art. 29 Dec. 47.749",
  }),
  item("E31", "Projeto de plantio / compensação (local, espécies, cronograma)", "especifico", true),
  item("E32", "ART — projeto de plantio", "especifico", true),
  item("E33", "Declaração de enquadramento (lei específica ou MMA 443)", "especifico", true, {
    templateWord: true,
  }),
  item(
    "E40",
    "Laudo técnico justificando supressão (Portaria IEF 191/2005)",
    "especifico",
    false,
    { templateWord: true }
  ),
  item("E41", "Anuência do Gerente de Núcleo (quando exigido)", "especifico", false),
  item("E42", "Alternativa locacional (mapa + memorial)", "especifico", false),
  item("E50", "Proposta alinhada à DN COPAM 114/2008", "especifico", false),
  item("E51", "Termo de Compromisso de Recuperação Ambiental", "pos_analise", false),
  item("E52", "PTRF vinculado (recuperação)", "especifico", false),
  item("E60", "Compensação como condicionante do DAIA (se sem TCCF)", "pos_analise", true),
  item("E61", "TCCF (se averbação em matrícula)", "pos_analise", false),
  item("E62", "Pacote PDF/Word para anexar ao SEI da intervenção", "pos_analise", true, { seiOrder: 90 }),
];

const SNUC_CHECKLIST: CompensacaoChecklistItem[] = [
  item("S01", "Empreendimento com impacto significativo (EIA/RIMA ou equivalente)", "formalizacao", true),
  item("S02", "Condicionante de compensação SNUC na licença", "formalizacao", true),
  item("S03", "Enquadramento: implantado antes de 18/07/2000? (VCL vs VR)", "formalizacao", true),
  item("S04", "Pessoa jurídica ou física", "formalizacao", true),
  item("S10", "Requerimento padrão (Portaria IEF 55/2012)", "formalizacao", true, {
    templateWord: true,
    seiOrder: 10,
  }),
  item("S11", "Declarações padrão (Portaria IEF 55/2012)", "formalizacao", true, {
    templateWord: true,
    seiOrder: 11,
  }),
  item("S12", "Documentos de identificação do empreendedor", "formalizacao", true, { seiOrder: 12 }),
  item("S13", "Procuração específica e ID do procurador", "formalizacao", false, { templateWord: true }),
  item("S14", "Cópia da licença com condicionante SNUC", "formalizacao", true, { seiOrder: 13 }),
  item("S15", "Cópia do parecer (PU/PT) e rol de condicionantes", "formalizacao", true, { seiOrder: 14 }),
  item("S16", "Cópia dos estudos ambientais (referência de impactos)", "formalizacao", false),
  item("S17", "Planilha de Valor de Referência (VR) — ramo de atividade", "formalizacao", true, {
    templateWord: true,
    note: "Planilhas 01 a 26 no site do IEF",
    seiOrder: 15,
  }),
  item("S18", "Justificativa de itens zerados na VR", "formalizacao", false),
  item("S19", "Atualização dos valores pela tabela do TJMG", "formalizacao", true),
  item("S20", "ART e assinatura do responsável técnico (VR/VCL)", "formalizacao", true, { seiOrder: 16 }),
  item("S21", "Assinatura do responsável pelo empreendimento", "formalizacao", true, { seiOrder: 17 }),
  item("S25", "Valor Contábil Líquido (VCL) — balanço patrimonial", "especifico", false, {
    templateWord: true,
    note: "PJ com implantação anterior à Lei 9.985/2000",
  }),
  item("S26", "Memória de cálculo e Declaração de VCL", "especifico", false, { templateWord: true }),
  item("S27", "ART ou certidão de regularidade do contador", "especifico", false),
  item("S28", "VR com justificativa de não apresentação de VCL", "especifico", false),
  item("S29", "PF pré-2000: VR, DITR, comprovante e memória", "especifico", false),
  item("S42", "TCCA assinado", "pos_analise", true),
  item("S43", "PTCA (execução direta)", "pos_analise", false),
  item("S44", "DAE / comprovante de recolhimento (conforme TCCA)", "pos_analise", false),
  item("S45", "Publicação do extrato do TCCA no DOE", "pos_analise", false),
];

const MATA_ATLANTICA_CHECKLIST: CompensacaoChecklistItem[] = [
  item("M01", "Requerimento (Anexo I — Portaria IEF 30/2015)", "formalizacao", true, {
    templateWord: true,
    seiOrder: 10,
  }),
  item("M02", "Documentos de identificação do empreendedor", "formalizacao", true, { seiOrder: 11 }),
  item("M03", "Procuração específica (assinatura TCCF)", "formalizacao", false),
  item("M04", "Licença e/ou APEF/DAIA com condicionante Mata Atlântica", "formalizacao", true, {
    seiOrder: 12,
    note: "Dispensado em LP sem PU/licença (§1º art. 1)",
  }),
  item("M05", "Parecer Único ou Técnico + condicionantes", "formalizacao", true, { seiOrder: 13 }),
  item("M06", "PECF conforme Anexo II (TR Portaria 30/2015)", "formalizacao", true, {
    templateWord: true,
    seiOrder: 14,
  }),
  item("M10", "Memorial da modalidade compensatória + justificativa", "especifico", false),
  item("M11", "Polígonos supressão/compensação (shapefile SIRGAS 2000 UTM)", "especifico", true),
  item("M12", "Planta planimétrica + ART", "especifico", true, { seiOrder: 15 }),
  item("M13", "Documentação do imóvel para doação (modalidade II)", "especifico", false),
  item("M21", "TCCF firmado (máx. 60 dias da decisão CPB)", "pos_analise", true),
  item("M22", "Cumprimento das obrigações do TCCF", "pos_analise", true),
];

const MINERARIA_CHECKLIST: CompensacaoChecklistItem[] = [
  item("N01", "Requerimento (Anexo I — Portaria IEF 27/2017)", "formalizacao", true, {
    templateWord: true,
    seiOrder: 10,
  }),
  item("N02", "Documentos de identificação do empreendedor", "formalizacao", true, { seiOrder: 11 }),
  item("N03", "Procuração específica (assinatura TCCFM)", "formalizacao", false),
  item("N04", "Licença e/ou APEF/DAIA/AIA com condicionante minerária", "formalizacao", true, { seiOrder: 12 }),
  item("N05", "Parecer Único SUPRAM ou Parecer Técnico IEF", "formalizacao", true, { seiOrder: 13 }),
  item("N06", "PECFM conforme Anexo II (TR Portaria 27/2017)", "formalizacao", true, {
    templateWord: true,
    seiOrder: 14,
  }),
  item("N10", "Planta planimétrica da ADA + declaração do responsável legal", "especifico", true, {
    seiOrder: 15,
  }),
  item("N11", "CD com polígonos (kml + shapefile, SIRGAS 2000 UTM)", "especifico", true, { seiOrder: 16 }),
  item("N12", "Declaração do Gerente da UC (Anexo A)", "especifico", false, { templateWord: true }),
  item("N13", "Documentação do imóvel (matrícula, ITR, ônus)", "especifico", false),
  item("N15", "Enquadramento Lei 14.309/2002 (regularização antes 17/10/2013)", "especifico", false),
  item("N21", "TCCFM firmado", "pos_analise", true),
];

const APP_CHECKLIST: CompensacaoChecklistItem[] = [
  item("A01", "Proposta de compensação APP no processo SEI da intervenção", "formalizacao", true, {
    templateWord: true,
    source: "Res. 3.102/2021 art. 6 XI",
    seiOrder: 10,
  }),
  item("A02", "Estudo de inexistência de alternativa técnica e locacional + ART", "formalizacao", false),
  item("A03", "Memorial e polígonos da área de intervenção em APP", "formalizacao", true, { seiOrder: 11 }),
  item("A04", "Memorial da área de compensação (≥ área de intervenção — 1×1)", "formalizacao", true, {
    seiOrder: 12,
    source: "Res. CONAMA 369/2006",
  }),
  item("A10", "Projeto Técnico de Reconstituição da Flora (PTR) + ART", "especifico", false, {
    templateWord: true,
    note: "Modalidade: recuperação de APP na mesma sub-bacia",
  }),
  item("A11", "TR do PTR (modelo IEF)", "especifico", false, { templateWord: true }),
  item("A12", "Declaração de ciência e aceite do proprietário/posseiro", "especifico", false),
  item("A13", "Documentação de propriedade/posse do imóvel de compensação", "especifico", false),
  item("A14", "Planta e shapefile da área de recuperação", "especifico", true, { seiOrder: 13 }),
  item("A15", "Cronograma físico de recuperação", "especifico", true, { seiOrder: 14 }),
  item("A21", "TCCF ou condicionante no DAIA", "pos_analise", true),
];

export const SNUC_VR_RAMOS: { code: string; label: string }[] = [
  { code: "VR01", label: "Aeroporto" },
  { code: "VR02", label: "Aterro sanitário / industrial" },
  { code: "VR03", label: "Barragens de rejeito" },
  { code: "VR04", label: "Barragens saneamento / abastecimento" },
  { code: "VR05", label: "Beneficiamento minerais / pedras ornamentais" },
  { code: "VR06", label: "Biodiesel industrial" },
  { code: "VR07", label: "Canalização" },
  { code: "VR08", label: "Destilaria álcool / produção açúcar" },
  { code: "VR09", label: "Distrito industrial" },
  { code: "VR10", label: "Construção de estradas novas" },
  { code: "VR11", label: "Empreendimentos agrícolas e silviculturais" },
  { code: "VR12", label: "Extração de areia" },
  { code: "VR13", label: "Ferrovia" },
  { code: "VR14", label: "Gasoduto" },
  { code: "VR15", label: "Barragens / hidrelétricos" },
  { code: "VR16", label: "Indústria cimenteira" },
  { code: "VR17", label: "Indústria em geral" },
  { code: "VR18", label: "Indústria química / tratamento de minérios" },
  { code: "VR19", label: "Transformação de metais" },
  { code: "VR20", label: "Linhas de transmissão" },
  { code: "VR21", label: "Mineração" },
  { code: "VR22", label: "Mineração — argila" },
  { code: "VR23", label: "Parcelamento do solo urbano" },
  { code: "VR24", label: "Posto de combustível" },
  { code: "VR25", label: "Siderurgia e similares" },
  { code: "VR26", label: "Suinocultura e bovinocultura" },
];

const TIPO_CHECKLISTS: Record<CompensacaoTipo, CompensacaoChecklistItem[]> = {
  especies: ESPECIES_CHECKLIST,
  snuc: SNUC_CHECKLIST,
  "mata-atlantica": MATA_ATLANTICA_CHECKLIST,
  mineraria: MINERARIA_CHECKLIST,
  app: APP_CHECKLIST,
};

export function isCompensacaoTipo(value: string): value is CompensacaoTipo {
  return COMPENSACAO_TIPOS.some((t) => t.tipo === value);
}

export function getCompensacaoTipoMeta(tipo: CompensacaoTipo): CompensacaoTipoMeta {
  const meta = COMPENSACAO_TIPOS.find((t) => t.tipo === tipo);
  if (!meta) throw new Error(`Tipo de compensação inválido: ${tipo}`);
  return meta;
}

/** Checklist completo: itens comuns + específicos do tipo */
export function getFullChecklist(tipo: CompensacaoTipo): CompensacaoChecklistItem[] {
  return [...COMPENSACAO_COMMON_CHECKLIST, ...TIPO_CHECKLISTS[tipo]];
}

export function groupChecklistByPhase(
  items: CompensacaoChecklistItem[]
): { phase: CompensacaoChecklistPhase; label: string; items: CompensacaoChecklistItem[] }[] {
  const order: CompensacaoChecklistPhase[] = [
    "comum",
    "formalizacao",
    "especifico",
    "pos_analise",
    "sei",
  ];
  return order
    .map((phase) => ({
      phase,
      label: COMPENSACAO_PHASE_LABELS[phase],
      items: items.filter((i) => i.phase === phase),
    }))
    .filter((g) => g.items.length > 0);
}

export function computeChecklistProgress(
  items: CompensacaoChecklistItem[],
  checkedIds: Set<string>
): { done: number; total: number; requiredDone: number; requiredTotal: number; percent: number } {
  const required = items.filter((i) => i.required);
  const requiredDone = required.filter((i) => checkedIds.has(i.id)).length;
  const done = items.filter((i) => checkedIds.has(i.id)).length;
  const total = items.length;
  const requiredTotal = required.length;
  const percent = requiredTotal > 0 ? Math.round((requiredDone / requiredTotal) * 100) : 0;
  return { done, total, requiredDone, requiredTotal, percent };
}

export function buildSeiJuntadaIndex(
  items: CompensacaoChecklistItem[],
  checkedIds: Set<string>,
  meta: { titulo?: string; sei?: string }
): string {
  const ordered = [...items]
    .filter((i) => i.seiOrder != null || i.required)
    .sort((a, b) => (a.seiOrder ?? 50) - (b.seiOrder ?? 50));

  const lines = [
    "ÍNDICE DE JUNTADA — COMPENSAÇÃO AMBIENTAL",
    meta.titulo ? `Processo: ${meta.titulo}` : "",
    meta.sei ? `SEI: ${meta.sei}` : "",
    `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    "",
  ].filter(Boolean);

  ordered.forEach((item, idx) => {
    const mark = checkedIds.has(item.id) ? "[x]" : "[ ]";
    const req = item.required ? " (obrig.)" : "";
    lines.push(`${idx + 1}. ${mark} ${item.id} — ${item.label}${req}`);
  });

  return lines.join("\n");
}
