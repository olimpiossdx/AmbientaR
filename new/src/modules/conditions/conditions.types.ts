export const CONDITION_CLAIMS = {
  view: { claimType: "recurso.condicionante", claimValue: "visualizar" },
  create: { claimType: "recurso.condicionante", claimValue: "criar" },
  edit: { claimType: "recurso.condicionante", claimValue: "editar" },
  remove: { claimType: "recurso.condicionante", claimValue: "excluir" },
  fulfill: { claimType: "recurso.condicionante", claimValue: "cumprir" },
} as const;
export type ConditionStatus = "Pendente" | "Em execução" | "Cumprida" | "Atrasada" | "Não Aplicável";
export type ConditionRecurrence = "Única" | "Mensal" | "Trimestral" | "Semestral" | "Anual";
export type ConditionReferenceType = "licenca" | "outorga" | "intervencao" | "tac";
export type ConditionFile = { id: string; name: string; contentType: string; size: number; uploadedAt: string };
export type Condition = { id: string; version: number; referenceId: string; referenceType: ConditionReferenceType; referenceLabel: string; description: string; dueDate: string; status: ConditionStatus; recurrence: ConditionRecurrence; files: ConditionFile[]; completedAt?: string };
export type ConditionInput = Omit<Condition, "id" | "version" | "status" | "files" | "completedAt">;
export const emptyCondition: ConditionInput = { referenceId: "", referenceType: "licenca", referenceLabel: "", description: "", dueDate: "", recurrence: "Única" };
