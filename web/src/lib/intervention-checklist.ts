import { sortByLabelPt } from "@/lib/sort-pt-br";

export type InterventionChecklistAttachment = {
  name: string;
  url: string;
  uploadedAt: string;
};

export type InterventionChecklistLinkType = "upload" | "internal_route" | "external";

/** Chave para botões que abrem módulos vinculados ao processo. */
export type InterventionChecklistLinkKey =
  | "pia"
  | "inventory"
  | "mapas"
  | "georef"
  | "prada"
  | "ptrf"
  | "fauna";

export type InterventionChecklistItem = {
  id: string;
  phase: string;
  title: string;
  note?: string;
  required: boolean;
  status: "not_started" | "collecting" | "not_applicable" | "completed";
  attachments: InterventionChecklistAttachment[];
  linkType?: InterventionChecklistLinkType;
  linkKey?: InterventionChecklistLinkKey;
  externalUrl?: string;
};

export type TipoIntervencaoAia =
  | "SUPRESSAO"
  | "CONSTRUCAO"
  | "AGRICULTURA"
  | "MINERACAO";

export const TIPO_INTERVENCAO_AIA_OPTIONS: {
  id: TipoIntervencaoAia;
  label: string;
}[] = sortByLabelPt(
  [
    { id: "SUPRESSAO", label: "Supressão de vegetação" },
    { id: "CONSTRUCAO", label: "Construção" },
    { id: "AGRICULTURA", label: "Agricultura" },
    { id: "MINERACAO", label: "Mineração" },
  ],
  (o) => o.label,
);

export const DEFAULT_AIA_PROFILE = {
  orgao: "IEF-MG",
  uf: "MG",
} as const;

export type AiaImovelSnapshot = {
  areaTotalHa?: number;
  codigoCar?: string;
  multiplosProprietarios?: boolean;
  realocacaoRlPrevista?: boolean;
};

export type AiaChecklistContext = {
  subservices: InterventionSubserviceId[];
  imovel: AiaImovelSnapshot;
  orgao?: string;
  uf?: string;
  tipoIntervencao?: TipoIntervencaoAia;
};

export const IEF_INTERVENTION_REFERENCE_DOCS = sortByLabelPt(
  [
    {
      title: "IEF-MG - Documentos de formalização",
      url: "https://ief.mg.gov.br/documents/38374/7221759/DOCS_FORMALIZACAO-2/9936183f-2758-b40a-5fec-2431e61bf1cd?t=1723581836479&version=1.0",
      type: "PDF",
    },
    {
      title: "IEF-MG - Termo de referência (PIA simplificado)",
      url: "https://ief.mg.gov.br/documents/d/ief/termo_de_referencia_de_elaboracao_de_projeto_de_intervencao_ambiental_simplificado-pdf",
      type: "PDF",
    },
    {
      title: "IEF-MG - Manual do usuário externo",
      url: "https://ief.mg.gov.br/documents/d/ief/manual_usuario_externo_-_ief_v2-pdf-1",
      type: "PDF",
    },
  ],
  (d) => d.title,
);

export const INTERVENTION_SERVICE_LABEL =
  "Autorização para Intervenção Ambiental";

export const INTERVENTION_SUBSERVICES = sortByLabelPt(
  [
    { id: "inventario_florestal", label: "Inventário florestal" },
    { id: "censo_florestal", label: "Censo Florestal" },
    { id: "pup_simplificado", label: "PUP Simplificado" },
    { id: "corte_arvores_isoladas", label: "Corte de Árvores isoladas" },
  ],
  (s) => s.label,
) as readonly {
  id: "inventario_florestal" | "censo_florestal" | "pup_simplificado" | "corte_arvores_isoladas";
  label: string;
}[];

export type InterventionSubserviceId =
  (typeof INTERVENTION_SUBSERVICES)[number]["id"];

const INTERVENTION_SUBSERVICE_ID_SET = new Set<string>(
  INTERVENTION_SUBSERVICES.map((s) => s.id),
);

export function normalizeInterventionSubserviceIds(
  ids: unknown,
): InterventionSubserviceId[] {
  if (!Array.isArray(ids)) return [];
  return ids.filter(
    (id): id is InterventionSubserviceId =>
      typeof id === "string" && INTERVENTION_SUBSERVICE_ID_SET.has(id),
  );
}

export const AIA_PHASES = [
  "Fase 1 — Reunir documentos",
  "Fase 2 — Mapa de uso e ocupação do solo",
  "Fase 3 — Inventário florestal",
  "Fase 4 — Mapas complementares (QGIS)",
  "Fase 5 — Estudos",
  "Fase 6 — Outros",
  "Fase 7 — Protocolo",
] as const;

type ChecklistDef = Omit<
  InterventionChecklistItem,
  "status" | "attachments"
> & {
  visible?: (ctx: AiaChecklistContext) => boolean;
};

function needsInventory(ctx: AiaChecklistContext): boolean {
  return (
    ctx.subservices.includes("inventario_florestal") ||
    ctx.subservices.includes("censo_florestal")
  );
}

function isSimplifiedAia(ctx: AiaChecklistContext): boolean {
  const subs = ctx.subservices;
  if (subs.length === 0) return false;
  const simplifiedIds: InterventionSubserviceId[] = [
    "pup_simplificado",
    "corte_arvores_isoladas",
  ];
  return subs.every((s) => simplifiedIds.includes(s));
}

function areaOver100(ctx: AiaChecklistContext): boolean {
  return (ctx.imovel.areaTotalHa ?? 0) > 100;
}

const AIA_CHECKLIST_DEFS: ChecklistDef[] = [
  // Fase 1
  {
    id: "f1_multa",
    phase: AIA_PHASES[0],
    title: "Comprovante de pagamento (ao menos 1ª parcela da multa, se houver)",
    required: false,
    linkType: "upload",
  },
  {
    id: "f1_liminar",
    phase: AIA_PHASES[0],
    title: "Liminar (quando aplicável)",
    required: false,
    linkType: "upload",
  },
  {
    id: "f1_auto_infracao",
    phase: AIA_PHASES[0],
    title: "Auto de infração",
    required: false,
    linkType: "upload",
  },
  {
    id: "f1_art",
    phase: AIA_PHASES[0],
    title: "ART(s) do responsável técnico",
    required: true,
    linkType: "upload",
  },
  {
    id: "f1_docs_empreendedor",
    phase: AIA_PHASES[0],
    title: "Documentos pessoais do empreendedor",
    required: true,
    linkType: "upload",
  },
  {
    id: "f1_endereco_empreendedor",
    phase: AIA_PHASES[0],
    title: "Comprovante de endereço do empreendedor",
    required: true,
    linkType: "upload",
  },
  {
    id: "f1_docs_procurador",
    phase: AIA_PHASES[0],
    title: "Documentos pessoais do procurador",
    required: false,
    linkType: "upload",
  },
  {
    id: "f1_endereco_procurador",
    phase: AIA_PHASES[0],
    title: "Comprovante de endereço do procurador",
    required: false,
    linkType: "upload",
  },
  {
    id: "f1_procuracao",
    phase: AIA_PHASES[0],
    title: "Procuração",
    required: false,
    linkType: "upload",
  },
  {
    id: "f1_carta_anuencia",
    phase: AIA_PHASES[0],
    title: "Carta de anuência dos proprietários",
    note: "Obrigatória quando o empreendimento tem mais de um proprietário.",
    required: false,
    linkType: "upload",
    visible: (ctx) => ctx.imovel.multiplosProprietarios === true,
  },
  {
    id: "f1_matriculas",
    phase: AIA_PHASES[0],
    title: "Matrículas do imóvel",
    required: true,
    linkType: "upload",
  },
  {
    id: "f1_rl_croqui",
    phase: AIA_PHASES[0],
    title: "Termo de averbação da RL + croqui da Reserva Legal",
    required: true,
    linkType: "upload",
  },
  {
    id: "f1_car",
    phase: AIA_PHASES[0],
    title: "Cadastro Ambiental Rural (CAR)",
    required: true,
    linkType: "upload",
  },
  // Fase 2
  {
    id: "f2_perimetro",
    phase: AIA_PHASES[1],
    title: "Definir o perímetro do imóvel",
    required: true,
    linkType: "internal_route",
    linkKey: "georef",
  },
  {
    id: "f2_feições",
    phase: AIA_PHASES[1],
    title: "Desenhar as feições (APP, RL, IA, etc.)",
    note: "Verificar se haverá realocação de Reserva Legal.",
    required: true,
    linkType: "internal_route",
    linkKey: "georef",
  },
  {
    id: "f2_realocacao_rl",
    phase: AIA_PHASES[1],
    title: "Análise de realocação de Reserva Legal",
    required: false,
    visible: (ctx) => ctx.imovel.realocacaoRlPrevista === true,
  },
  {
    id: "f2_hachuras",
    phase: AIA_PHASES[1],
    title: "Colocar hachuras no mapa de uso e ocupação",
    required: true,
    linkType: "internal_route",
    linkKey: "mapas",
  },
  {
    id: "f2_areas",
    phase: AIA_PHASES[1],
    title: "Quadro de áreas e polígonos (POL_PROP, POL_APP, POL_RL, POL_IA, POL_HIDRO)",
    required: true,
    linkType: "internal_route",
    linkKey: "mapas",
  },
  {
    id: "f2_pol_comp",
    phase: AIA_PHASES[1],
    title: "POL_COMP (2% — compensação em áreas > 100 ha)",
    note: "Obs.: exigível em imóveis com mais de 100 hectares.",
    required: true,
    visible: areaOver100,
    linkType: "internal_route",
    linkKey: "mapas",
  },
  {
    id: "f2_pol_ptrf",
    phase: AIA_PHASES[1],
    title: "POL_PTRF (reposição florestal, quando aplicável)",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "internal_route",
    linkKey: "ptrf",
  },
  {
    id: "f2_pto_sede",
    phase: AIA_PHASES[1],
    title: "PTO_SEDE e demais pontos de referência",
    required: false,
    linkType: "internal_route",
    linkKey: "georef",
  },
  {
    id: "f2_confrontantes",
    phase: AIA_PHASES[1],
    title: "Confrontantes, escala, rosa dos ventos e legendas",
    required: true,
    linkType: "upload",
  },
  {
    id: "f2_mapa_uso_pdf",
    phase: AIA_PHASES[1],
    title: "Mapa de uso e ocupação do solo (PDF final)",
    required: true,
    linkType: "upload",
  },
  // Fase 3
  {
    id: "f3_campo",
    phase: AIA_PHASES[2],
    title: "Ir a campo / levantamento",
    required: true,
    visible: needsInventory,
  },
  {
    id: "f3_resultados",
    phase: AIA_PHASES[2],
    title: "Resultados do inventário florestal",
    required: true,
    visible: needsInventory,
    linkType: "internal_route",
    linkKey: "inventory",
  },
  {
    id: "f3_mapa_nativa",
    phase: AIA_PHASES[2],
    title: "Projeto no mapa de vegetação nativa",
    required: true,
    visible: needsInventory,
    linkType: "internal_route",
    linkKey: "mapas",
  },
  {
    id: "f3_erro_amostragem",
    phase: AIA_PHASES[2],
    title: "Verificar erro de amostragem (< 10%)",
    required: true,
    visible: needsInventory,
    linkType: "internal_route",
    linkKey: "inventory",
  },
  {
    id: "f3_planilhas_pia",
    phase: AIA_PHASES[2],
    title: "Gerar planilhas para o PIA",
    required: true,
    visible: needsInventory,
    linkType: "internal_route",
    linkKey: "pia",
  },
  {
    id: "f3_volumes_taxas",
    phase: AIA_PHASES[2],
    title: "Calcular volumes para taxas e gerar taxas",
    required: true,
    visible: needsInventory,
    linkType: "upload",
  },
  // Fase 4
  {
    id: "f4_bioma",
    phase: AIA_PHASES[3],
    title: "Mapa de bioma",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "internal_route",
    linkKey: "mapas",
  },
  {
    id: "f4_declividade",
    phase: AIA_PHASES[3],
    title: "Mapa de declividade",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "internal_route",
    linkKey: "mapas",
  },
  {
    id: "f4_hidro",
    phase: AIA_PHASES[3],
    title: "Mapa hidrográfico",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "internal_route",
    linkKey: "mapas",
  },
  {
    id: "f4_hipsometrico",
    phase: AIA_PHASES[3],
    title: "Mapa hipsométrico",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "internal_route",
    linkKey: "mapas",
  },
  {
    id: "f4_solos",
    phase: AIA_PHASES[3],
    title: "Mapa de solos",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "internal_route",
    linkKey: "mapas",
  },
  {
    id: "f4_roteiro",
    phase: AIA_PHASES[3],
    title: "Roteiro de acesso",
    required: false,
    linkType: "internal_route",
    linkKey: "mapas",
  },
  {
    id: "f4_ada",
    phase: AIA_PHASES[3],
    title: "Mapa da ADA (área de influência direta)",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "internal_route",
    linkKey: "mapas",
  },
  // Fase 5
  {
    id: "f5_pia",
    phase: AIA_PHASES[4],
    title: "Projeto de Intervenção Ambiental (PIA)",
    note: "Incluir mapas, tabelas do inventário e conferir volumes/taxas.",
    required: true,
    linkType: "internal_route",
    linkKey: "pia",
  },
  {
    id: "f5_preservacao_2pct",
    phase: AIA_PHASES[4],
    title: "Projeto de preservação da vegetação nativa (2%)",
    note: "Áreas acima de 100 hectares.",
    required: true,
    visible: areaOver100,
    linkType: "upload",
  },
  {
    id: "f5_ptrf",
    phase: AIA_PHASES[4],
    title: "Projeto de plantio para reposição florestal (PTRF)",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "internal_route",
    linkKey: "ptrf",
  },
  {
    id: "f5_alternativa_locacional",
    phase: AIA_PHASES[4],
    title: "Alternativa locacional para corte de espécies ameaçadas",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "upload",
  },
  {
    id: "f5_compensacao",
    phase: AIA_PHASES[4],
    title: "Proposta de compensação por intervenção ambiental",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "upload",
  },
  {
    id: "f5_prada",
    phase: AIA_PHASES[4],
    title: "PRADA — Recuperação de áreas degradadas",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "internal_route",
    linkKey: "prada",
  },
  {
    id: "f5_fauna_relatorio",
    phase: AIA_PHASES[4],
    title: "Relatório de fauna",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "internal_route",
    linkKey: "fauna",
  },
  {
    id: "f5_fauna_monitoramento",
    phase: AIA_PHASES[4],
    title: "Programa de monitoramento e afugentamento de fauna",
    required: false,
    visible: (ctx) => !isSimplifiedAia(ctx),
    linkType: "upload",
  },
  // Fase 6
  {
    id: "f6_sinaflor",
    phase: AIA_PHASES[5],
    title: "SINAFLOR — cadastro / autorização",
    required: false,
    linkType: "external",
    externalUrl: "https://www.gov.br/ibama/pt-br/assuntos/servicos/sinaflor",
  },
  {
    id: "f6_taxas",
    phase: AIA_PHASES[5],
    title: "Comprovante de pagamento das taxas",
    required: true,
    linkType: "upload",
  },
  {
    id: "f6_requerimento",
    phase: AIA_PHASES[5],
    title: "Requerimento formal",
    required: true,
    linkType: "upload",
  },
  // Fase 7
  {
    id: "f7_dossie",
    phase: AIA_PHASES[6],
    title: "Montagem do dossiê (documentos e estudos reunidos)",
    required: true,
    linkType: "upload",
  },
  {
    id: "f7_protocolo",
    phase: AIA_PHASES[6],
    title: "Protocolo no órgão ambiental (SEI / presencial)",
    note: "Anexos individuais, sem arquivo .zip quando exigido pelo órgão.",
    required: true,
    linkType: "upload",
  },
];

function resolveRequired(def: ChecklistDef, ctx: AiaChecklistContext): boolean {
  if (def.id === "f1_carta_anuencia" && ctx.imovel.multiplosProprietarios) {
    return true;
  }
  return def.required;
}

export function buildInterventionChecklist(
  ctx: Partial<AiaChecklistContext> = {},
): InterventionChecklistItem[] {
  const fullCtx: AiaChecklistContext = {
    subservices: ctx.subservices ?? [],
    imovel: ctx.imovel ?? {},
    orgao: ctx.orgao ?? DEFAULT_AIA_PROFILE.orgao,
    uf: ctx.uf ?? DEFAULT_AIA_PROFILE.uf,
    tipoIntervencao: ctx.tipoIntervencao,
  };

  return AIA_CHECKLIST_DEFS.filter(
    (def) => !def.visible || def.visible(fullCtx),
  ).map((def) => {
    const { visible: _v, ...rest } = def;
    return {
      ...rest,
      required: resolveRequired(def, fullCtx),
      status: "not_started" as const,
      attachments: [],
    };
  });
}

/** Compatibilidade: checklist padrão sem contexto (uso legado). */
export function createInterventionChecklist(
  ctx?: Partial<AiaChecklistContext>,
): InterventionChecklistItem[] {
  return buildInterventionChecklist(ctx);
}

/** Mescla checklist salvo com template atual (preserva status e anexos). */
export function mergeInterventionChecklist(
  saved: InterventionChecklistItem[],
  ctx: Partial<AiaChecklistContext>,
): InterventionChecklistItem[] {
  const fresh = buildInterventionChecklist(ctx);
  const savedById = new Map(saved.map((i) => [i.id, i]));
  return fresh.map((item) => {
    const prev = savedById.get(item.id);
    if (!prev) return item;
    return {
      ...item,
      required: item.required,
      status: prev.status,
      attachments: prev.attachments ?? [],
    };
  });
}

/** Checklist completo para gravar (inclui itens condicionais do contexto atual). */
export function resolveAiaChecklistForSave(
  saved: InterventionChecklistItem[],
  ctx: Partial<AiaChecklistContext>,
): InterventionChecklistItem[] {
  const base =
    saved.length === 0 ? buildInterventionChecklist(ctx) : saved;
  return mergeInterventionChecklist(base, ctx);
}

export function getChecklistPhases(
  items: InterventionChecklistItem[],
): string[] {
  const seen = new Set<string>();
  const phases: string[] = [];
  for (const item of items) {
    if (!seen.has(item.phase)) {
      seen.add(item.phase);
      phases.push(item.phase);
    }
  }
  return phases;
}

export function getChecklistProgress(items: InterventionChecklistItem[]): {
  total: number;
  required: number;
  requiredDone: number;
  completed: number;
  byPhase: Record<string, { total: number; done: number }>;
} {
  const requiredItems = items.filter((i) => i.required);
  const byPhase: Record<string, { total: number; done: number }> = {};
  for (const item of items) {
    if (!byPhase[item.phase]) byPhase[item.phase] = { total: 0, done: 0 };
    byPhase[item.phase].total += 1;
    if (item.status === "completed" || item.status === "not_applicable") {
      byPhase[item.phase].done += 1;
    }
  }
  return {
    total: items.length,
    required: requiredItems.length,
    requiredDone: requiredItems.filter(
      (i) => i.status === "completed" || i.status === "not_applicable",
    ).length,
    completed: items.filter(
      (i) => i.status === "completed" || i.status === "not_applicable",
    ).length,
    byPhase,
  };
}

export function imovelSnapshotFromProject(project: {
  car?: { receiptNumber?: string };
  projectArea?: { totalArea?: number };
  ownerCondition?: string[];
} | null | undefined): AiaImovelSnapshot {
  if (!project) return {};
  const owners = project.ownerCondition ?? [];
  return {
    areaTotalHa: project.projectArea?.totalArea,
    codigoCar: project.car?.receiptNumber,
    multiplosProprietarios: owners.length > 1,
  };
}

export function getChecklistStatusLabel(
  status: InterventionChecklistItem["status"],
): string {
  const labels = {
    not_started: "Não iniciado",
    collecting: "Juntando",
    not_applicable: "Não se aplica",
    completed: "Concluído",
  };
  return labels[status];
}

export function getChecklistStatusBadgeClass(
  status: InterventionChecklistItem["status"],
): string {
  const classes = {
    not_started:
      "bg-slate-500/20 text-slate-700 border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300",
    collecting:
      "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-300",
    not_applicable:
      "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
    completed:
      "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  };
  return classes[status];
}
