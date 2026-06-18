export type OfficeProcessTipo = "sei" | "sla";

export type OfficeProcessFase =
  | "elaboracao"
  | "protocolado"
  | "em_analise"
  | "exigencia"
  | "concluido"
  | "arquivado";

export type OfficeProcessFonte = "excel" | "app" | "licenciamento";

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
  statusDetalhe?: string;
  prazo?: string;
  empreendedorId?: string;
  projectId?: string;
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
  rowNumber: number;
};

export type OfficeProcessImportPreview = {
  rows: OfficeProcessExcelRow[];
  errors: { rowNumber: number; message: string }[];
  duplicatesInFile: string[];
};
