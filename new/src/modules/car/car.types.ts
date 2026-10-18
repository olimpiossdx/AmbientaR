export const CAR_CLAIMS = {
  view: { claimType: "recurso.car", claimValue: "visualizar" },
  create: { claimType: "recurso.car", claimValue: "criar" },
  edit: { claimType: "recurso.car", claimValue: "editar" },
  remove: { claimType: "recurso.car", claimValue: "excluir" },
} as const;
export type CarProjectOption = { id: string; propertyName: string; municipio?: string; uf?: string };
export type CarFile = { id: string; kind: "pdf" | "geometry"; name: string; contentType: string; size: number; uploadedAt: string };
export type CarRecord = { id: string; version: number; projectId: string; projectName: string; municipio?: string; uf?: string; receiptNumber: string; files: CarFile[] };
export type CarInput = { projectId: string; receiptNumber: string };
