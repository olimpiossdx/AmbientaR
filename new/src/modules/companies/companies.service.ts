import { api } from "../../service/api";
import type { HttpClient } from "../../service/http/client";
import type { ApiResponse } from "../../service/http/types";
import { emptyCompany, type Company, type CompanyInput } from "./companies.types";

export class CompanyApiError extends Error {
  readonly httpStatus: number;
  constructor(message: string, httpStatus: number) { super(message); this.httpStatus = httpStatus; }
}
function data(response: ApiResponse<unknown>): unknown {
  if (!response.ok || response.data === null) {
    const messages: Record<number, string> = {
      0: "API indisponível. Tente novamente.",
      401: "Sua sessão expirou. Entre novamente.",
      403: "Você não possui permissão para esta operação.",
      404: "Empresa não encontrada nesta organização.",
      409: "Empresa alterada ou CNPJ já cadastrado. Recarregue e revise os dados.",
    };
    throw new CompanyApiError(response.error?.message ?? messages[response.httpStatus] ?? "Não foi possível concluir a operação.", response.httpStatus);
  }
  return response.data;
}
export function parseCompany(value: unknown): Company {
  if (!value || typeof value !== "object") throw new Error("Empresa inválida retornada pela API.");
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || !item.id || !Number.isSafeInteger(item.version) || Number(item.version) < 1 ||
      typeof item.name !== "string" || typeof item.cnpj !== "string") throw new Error("Empresa inválida retornada pela API.");
  return { ...emptyCompany, ...item, id: item.id, version: Number(item.version) } as Company;
}
export function createCompaniesService(client: HttpClient) {
  return {
    async list(search: string, page: number, signal?: AbortSignal) {
      const response = await client.get<unknown>("/empresas-responsaveis", { params: { search, page, size: 10 }, signal });
      const result = data(response);
      if (!result || typeof result !== "object") throw new Error("Listagem de empresas inválida.");
      const payload = result as Record<string, unknown>;
      if (!Array.isArray(payload.items) || !Number.isSafeInteger(payload.total) || Number(payload.total) < 0) throw new Error("Listagem de empresas inválida.");
      return { items: payload.items.map(parseCompany), total: Number(payload.total) };
    },
    async get(id: string, signal?: AbortSignal) { return parseCompany(data(await client.get<unknown>(`/empresas-responsaveis/${encodeURIComponent(id)}`, { signal }))); },
    async create(input: CompanyInput) { return parseCompany(data(await client.post<unknown, CompanyInput>("/empresas-responsaveis", input))); },
    async update(id: string, version: number, input: CompanyInput) { return parseCompany(data(await client.patch<unknown, CompanyInput>(`/empresas-responsaveis/${encodeURIComponent(id)}`, input, { params: { version } }))); },
    async remove(id: string, version: number) { data(await client.delete(`/empresas-responsaveis/${encodeURIComponent(id)}`, { params: { version } })); },
  };
}
export const companiesService = createCompaniesService(api);
