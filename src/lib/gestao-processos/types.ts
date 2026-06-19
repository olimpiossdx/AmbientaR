export type OfficeProcessTipo = "sei" | "sla";

export type OfficeProcessFase =
  | "elaboracao"
  | "protocolado"
  | "em_analise"
  | "exigencia"
  | "concluido"
  | "arquivado";

export type OfficeProcessFonte = "excel" | "app" | "licenciamento";

export type OfficeProcessPipeline = "consultoria" | "orgao" | "encerrado";

export type ConsultoriaEtapa =
  | "entrada"
  | "analise_documental"
  | "analise_tecnica_inicial"
  | "vistoria_campo"
  | "relatorio_estudos"
  | "aprovacao_despacho"
  | "concluido_protocolo";

export type OrgaoEtapa =
  | "entrada_protocolo"
  | "analise_documental"
  | "analise_tecnica"
  | "vistoria_campo"
  | "parecer_tecnico"
  | "aprovacao_despacho"
  | "concluido_arquivado";

export type OfficeProcessPrioridade = "baixa" | "media" | "alta";

export type OfficeProcessProcessGroup =
  | "licenciamento"
  | "outorga"
  | "intervencao"
  | "outros";

export type OfficeProcess = {
  id: string;
  externalKey: string;
  tipoProcesso: OfficeProcessTipo;
  numeroProcesso: string;
  empreendedorName: string;
  empreendimentoName: string;
  municipio?: string;
  tipoIntervencao?: string;
  orgao?: string;
  fase: OfficeProcessFase;
  /** Pipeline kanban: consultoria (pré-protocolo) ou órgão (pós-protocolo). */
  pipeline?: OfficeProcessPipeline;
  /** Etapa dentro do pipeline ativo (7 valores por pipeline). */
  etapa?: ConsultoriaEtapa | OrgaoEtapa;
  processGroup?: OfficeProcessProcessGroup;
  prioridade?: OfficeProcessPrioridade;
  dataProtocolo?: string;
  statusDetalhe?: string;
  prazo?: string;
  empreendedorId?: string;
  projectId?: string;
  /** Projeto de consultoria (`consultoriaProjects/{id}`). */
  consultoriaProjectId?: string;
  requestId?: string;
  fonte: OfficeProcessFonte;
  seedValidation?: boolean;
  responsavelUid?: string;
  responsavelName?: string;
  observacoes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type OfficeProcessEventTipo =
  | "solicitacao"
  | "recebimento"
  | "atendimento"
  | "nota"
  | "mudanca_status";

export type OfficeProcessEvent = {
  id: string;
  tipo: OfficeProcessEventTipo;
  titulo: string;
  descricao?: string;
  data?: unknown;
  autorUid?: string;
  autorName?: string;
  relatedEventId?: string;
  createdAt?: unknown;
};

export type OfficeProcessExcelRow = {
  numeroProcesso: string;
  tipoProcesso: OfficeProcessTipo;
  empreendedorName: string;
  empreendimentoName: string;
  municipio?: string;
  tipoIntervencao?: string;
  statusDetalhe?: string;
  prazo?: string;
  fase?: OfficeProcessFase;
  /** Código, nome ou id do projeto de consultoria (coluna PROJETO). */
  projetoRef?: string;
  rowNumber: number;
};

export type OfficeProcessImportPreview = {
  rows: OfficeProcessExcelRow[];
  errors: { rowNumber: number; message: string }[];
  duplicatesInFile: string[];
};

/** Projeto de consultoria (caso) — coleção Firestore `consultoriaProjects`. */
export type ConsultoriaProjectStatus =
  | "ativo"
  | "suspenso"
  | "concluido"
  | "cancelado";

export type ConsultoriaProject = {
  id: string;
  code?: string;
  name: string;
  description?: string;
  status: ConsultoriaProjectStatus;
  empreendedorId?: string;
  empreendedorName?: string;
  /** Empreendimento cadastral (`projects/{id}`). */
  projectId?: string;
  empreendimentoName?: string;
  municipio?: string;
  tipoAtividade?: string;
  area?: string;
  managerUid?: string;
  managerName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};
