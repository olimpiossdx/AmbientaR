import { api } from "../../service/api";
import type { HttpClient } from "../../service/http/client";
import type { ApiResponse } from "../../service/http/types";
import type { Project, ProjectInput, ProjectUsage } from "./projects.types";
export class ProjectApiError extends Error {
 readonly httpStatus: number;
 constructor(message: string, httpStatus: number) { super(message); this.httpStatus = httpStatus; }
}
function data(response: ApiResponse<unknown>): unknown {
 if (!response.ok || response.data === null) {
  const known: Record<number,string> = { 0: "API indisponível.", 401: "Sua sessão expirou.", 403: "Você não possui permissão para esta operação.", 404: "Empreendimento ou empreendedor não encontrado nesta empresa.", 409: "O empreendimento foi alterado por outra pessoa. Recarregue e tente novamente." };
  throw new ProjectApiError(response.error?.message ?? known[response.httpStatus] ?? "Não foi possível concluir a operação.", response.httpStatus);
 }
 return response.data;
}
export function parseProject(value: unknown): Project {
 if (!value || typeof value !== "object") throw new Error("Empreendimento inválido retornado pela API.");
 const p = value as Record<string,unknown>;
 if (typeof p.id !== "string" || !p.id || !Number.isSafeInteger(p.version) || Number(p.version) < 1 || typeof p.empreendedorId !== "string" || typeof p.activity !== "string" || typeof p.propertyName !== "string") throw new Error("Empreendimento inválido retornado pela API.");
 return p as Project;
}
export function createProjectsService(client: HttpClient) {
 return {
  async list(search: string, page: number, signal?: AbortSignal, status?: string) {
   const response = await client.get<unknown>("/empreendimentos", { params: { search, page, size: 10, ...(status ? { status } : {}) }, signal });
   const payload = data(response);
   if (Array.isArray(payload)) {
    if (!Number.isSafeInteger(response.total) || Number(response.total) < 0) throw new Error("Listagem inválida.");
    return { items: payload.map(parseProject), total: Number(response.total) };
   }
   if (!payload || typeof payload !== "object") throw new Error("Listagem inválida.");
   const result = payload as Record<string,unknown>;
   if (!Array.isArray(result.items) || !Number.isSafeInteger(result.total) || Number(result.total) < 0) throw new Error("Listagem inválida.");
   return { items: result.items.map(parseProject), total: Number(result.total) };
  },
  async get(id: string, signal?: AbortSignal) { return parseProject(data(await client.get<unknown>(`/empreendimentos/${encodeURIComponent(id)}`, { signal }))); },
  async usage(signal?: AbortSignal): Promise<ProjectUsage> {
   const value = data(await client.get<unknown>("/empreendimentos/usage", { signal }));
   if (!value || typeof value !== "object") throw new Error("Uso do plano inválido.");
   const usage = value as Record<string, unknown>;
   if (typeof usage.packageId !== "string" || !Number.isSafeInteger(usage.used) || Number(usage.used) < 0 || !Number.isSafeInteger(usage.limit) || Number(usage.limit) < 1 || !Number.isSafeInteger(usage.remaining) || Number(usage.remaining) < 0) throw new Error("Uso do plano inválido.");
   return { packageId: usage.packageId, used: Number(usage.used), limit: Number(usage.limit), remaining: Number(usage.remaining) };
  },
  async create(input: ProjectInput) { return parseProject(data(await client.post<unknown,ProjectInput>("/empreendimentos", input))); },
  async update(id: string, version: number, input: ProjectInput) {
   const { id: _id, version: _version, ...body } = input as ProjectInput & { id?: unknown; version?: unknown };
   void _id; void _version;
   return parseProject(data(await client.patch<unknown, ProjectInput>(`/empreendimentos/${encodeURIComponent(id)}`, body, { params: { version } })));
  },
  async remove(id: string, version: number) { data(await client.delete(`/empreendimentos/${encodeURIComponent(id)}`, { params: { version } })); },
 };
}
export const projectsService = createProjectsService(api);
