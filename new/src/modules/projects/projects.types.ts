export const PROJECT_CLAIMS = {
 view: { claimType: "recurso.empreendimento", claimValue: "visualizar" },
 create: { claimType: "recurso.empreendimento", claimValue: "criar" },
 edit: { claimType: "recurso.empreendimento", claimValue: "editar" },
 remove: { claimType: "recurso.empreendimento", claimValue: "excluir" },
} as const;
export type Project = {
 id: string; version: number; empreendedorId: string; activity: string; propertyName: string;
 status?: string; fantasyName?: string; address?: string; numero?: string; municipio?: string; uf?: string;
 cep?: string; matricula?: string; comarca?: string; [key: string]: unknown;
};

export type ProjectUsage = {
 packageId: string;
 used: number;
 limit: number;
 remaining: number;
};
export type ProjectInput = {
 empreendedorId: string; activity: string; propertyName: string; status?: string; fantasyName?: string; address?: string; numero?: string; municipio?: string; uf?: string; cep?: string; matricula?: string; comarca?: string; [key: string]: unknown;
};
export const projectStatuses = ["Em Andamento", "Válida", "Vencida", "Em Renovação", "Suspensa", "Cancelada"] as const;
