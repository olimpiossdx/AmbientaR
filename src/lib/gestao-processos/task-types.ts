import type { OfficeProcessPrioridade } from "@/lib/gestao-processos/types";

export type OfficeTaskStatus =
  | "pendente"
  | "em_andamento"
  | "aguardando"
  | "concluida"
  | "cancelada";

export type OfficeTaskCategoria =
  | "mapa"
  | "correcao_dados"
  | "procuracao"
  | "ligacao_cliente"
  | "documento"
  | "campo"
  | "outro";

export type OfficeTask = {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: OfficeTaskCategoria;
  status: OfficeTaskStatus;
  prioridade?: OfficeProcessPrioridade;
  /** ISO date (YYYY-MM-DD) */
  prazo?: string;
  assigneeUid?: string;
  assigneeName?: string;
  demandanteUid?: string;
  demandanteName?: string;
  /** Tarefa criada pelo próprio usuário para organizar o dia. */
  isOrganizacaoPessoal?: boolean;
  createdByUid?: string;
  createdByName?: string;
  empreendedorId?: string;
  consultoriaProjectId?: string;
  officeProcessId?: string;
  conclusaoNota?: string;
  /** ISO date when marked done */
  concluidaEm?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export const OFFICE_TASK_STATUS_LABELS: Record<OfficeTaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  aguardando: "Aguardando",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const OFFICE_TASK_CATEGORIA_LABELS: Record<OfficeTaskCategoria, string> = {
  mapa: "Mapa",
  correcao_dados: "Correção de dados",
  procuracao: "Procuração",
  ligacao_cliente: "Ligação ao cliente",
  documento: "Documento",
  campo: "Campo / vistoria",
  outro: "Outro",
};

export const OFFICE_TASK_CATEGORIA_OPTIONS = (
  Object.entries(OFFICE_TASK_CATEGORIA_LABELS) as [OfficeTaskCategoria, string][]
).map(([value, label]) => ({ value, label }));

export const OFFICE_TASK_STATUS_OPTIONS = (
  Object.entries(OFFICE_TASK_STATUS_LABELS) as [OfficeTaskStatus, string][]
).map(([value, label]) => ({ value, label }));

export const OFFICE_TASK_ACTIVE_STATUSES: OfficeTaskStatus[] = [
  "pendente",
  "em_andamento",
  "aguardando",
];

export type OfficeTaskFilterTab =
  | "todas"
  | "minhas"
  | "atrasadas"
  | "hoje"
  | "concluidas";

export const OFFICE_TASK_FILTER_TAB_LABELS: Record<OfficeTaskFilterTab, string> = {
  todas: "Todas",
  minhas: "Minhas",
  atrasadas: "Atrasadas",
  hoje: "Hoje",
  concluidas: "Concluídas",
};
