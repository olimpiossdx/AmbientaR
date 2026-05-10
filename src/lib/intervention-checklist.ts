export type InterventionChecklistAttachment = {
  name: string;
  url: string;
  uploadedAt: string;
};

export type InterventionChecklistItem = {
  id: string;
  phase: string;
  title: string;
  note?: string;
  required: boolean;
  status: "not_started" | "collecting" | "not_applicable" | "completed";
  attachments: InterventionChecklistAttachment[];
};

export const IEF_INTERVENTION_REFERENCE_DOCS = [
  {
    title: "IEF-MG - Documentos de formalizacao",
    url: "https://ief.mg.gov.br/documents/38374/7221759/DOCS_FORMALIZACAO-2/9936183f-2758-b40a-5fec-2431e61bf1cd?t=1723581836479&version=1.0",
    type: "PDF",
  },
  {
    title: "IEF-MG - Termo de referencia (PIA simplificado)",
    url: "https://ief.mg.gov.br/documents/d/ief/termo_de_referencia_de_elaboracao_de_projeto_de_intervencao_ambiental_simplificado-pdf",
    type: "PDF",
  },
  {
    title: "IEF-MG - Manual do usuario externo",
    url: "https://ief.mg.gov.br/documents/d/ief/manual_usuario_externo_-_ief_v2-pdf-1",
    type: "PDF",
  },
] as const;

export const INTERVENTION_SERVICE_LABEL =
  "Autorização para Intervenção Ambiental";

const TEMPLATE: Omit<InterventionChecklistItem, "status" | "attachments">[] = [
  { id: "f1_requerimento", phase: "Fase 1 - Documentacao base", title: "Requerimento do processo no SEI", required: true },
  { id: "f1_docs_requerente", phase: "Fase 1 - Documentacao base", title: "Documentos do requerente (CPF/CNPJ e endereco)", required: true },
  { id: "f1_docs_imovel", phase: "Fase 1 - Documentacao base", title: "Comprovacao de propriedade/posse do imovel e CAR", required: true },
  { id: "f1_procuracao", phase: "Fase 1 - Documentacao base", title: "Procuracao e documentos do procurador (quando aplicavel)", required: false },
  { id: "f2_planta", phase: "Fase 2 - Cartografia", title: "Planta topografica/croqui com ART", required: true },
  { id: "f2_mapa_uso", phase: "Fase 2 - Cartografia", title: "Mapa de uso e ocupacao do solo", required: true },
  { id: "f3_pia", phase: "Fase 3 - Estudos tecnicos", title: "Projeto de Intervencao Ambiental (PIA/simplificado)", required: true },
  { id: "f3_inventario", phase: "Fase 3 - Estudos tecnicos", title: "Inventario florestal (quando exigivel)", required: false },
  { id: "f3_compensacao", phase: "Fase 3 - Estudos tecnicos", title: "Medidas compensatorias aplicaveis", required: false },
  { id: "f4_taxas", phase: "Fase 4 - Protocolo", title: "Comprovantes de taxas/documentos finais para protocolo", required: true },
  { id: "f4_envio", phase: "Fase 4 - Protocolo", title: "Submissao no SEI com anexos individuais (sem .zip)", required: true },
];

export function createInterventionChecklist(): InterventionChecklistItem[] {
  return TEMPLATE.map((item) => ({
    ...item,
    status: "not_started",
    attachments: [],
  }));
}

export function getChecklistStatusLabel(status: InterventionChecklistItem["status"]): string {
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

