import { api } from "../../service/api";
import type { HttpClient } from "../../service/http/client";
import type { ApiResponse } from "../../service/http/types";
import { entityTypes, optionalFields, type Entrepreneur, type EntrepreneurInput } from "./entrepreneurs.types";
export class EntrepreneurApiError extends Error {
 readonly httpStatus: number;
 constructor(message: string, httpStatus: number) { super(message); this.httpStatus = httpStatus; }
}
function data(response: ApiResponse<unknown>): unknown {
 if (!response.ok || response.data === null) {
  const message = ({ 0: "API indisponível. Tente novamente.", 401: "Sua sessão expirou. Entre novamente.", 403: "Você não possui permissão para esta operação.", 404: "Empreendedor não encontrado nesta empresa.", 409: "O registro foi alterado ou o CPF/CNPJ já está cadastrado. Recarregue e revise os dados." } as Record<number, string>)[response.httpStatus];
  throw new EntrepreneurApiError(message ?? response.error?.message ?? "Não foi possível concluir a operação.", response.httpStatus);
 }
 return response.data;
}
export function parseEntrepreneur(value: unknown): Entrepreneur {
 if (!value || typeof value !== "object") throw new Error("Cadastro inválido retornado pela API.");
 const p = value as Record<string, unknown>;
 if (typeof p.id !== "string" || !p.id || !Number.isSafeInteger(p.version) || Number(p.version) < 1 || ["name", "cpfCnpj", "phone", "email", ...optionalFields].some(key => typeof p[key] !== "string") || !Array.isArray(p.entityType) || !p.entityType.length || p.entityType.some(type => !entityTypes.includes(type))) throw new Error("Cadastro inválido retornado pela API.");
 return { ...inputOnly(p as unknown as EntrepreneurInput), id: p.id, version: Number(p.version) };
}
export function inputOnly(value: EntrepreneurInput): EntrepreneurInput {
 return { name: value.name.trim(), cpfCnpj: value.cpfCnpj.trim(), entityType: [...value.entityType], phone: value.phone.trim(), email: value.email.trim(), ...Object.fromEntries(optionalFields.map(field => [field, value[field].trim()])) } as EntrepreneurInput;
}
export function createEntrepreneursService(client: HttpClient) {
 return {
  async list(search: string, page: number, signal?: AbortSignal, size = 10) {
   const response = await client.get<unknown>("/empreendedores", { params: { search, page, size: Math.min(100, Math.max(1, size)) }, signal });
   const result = data(response);
   if (Array.isArray(result)) {
    if (!Number.isSafeInteger(response.total) || Number(response.total) < 0) throw new Error("Listagem inválida.");
    return { items: result.map(parseEntrepreneur), total: Number(response.total) };
   }
   if (!result || typeof result !== "object") throw new Error("Listagem inválida.");
   const p = result as Record<string, unknown>;
   if (!Array.isArray(p.items) || !Number.isSafeInteger(p.total) || Number(p.total) < 0) throw new Error("Listagem inválida.");
   return { items: p.items.map(parseEntrepreneur), total: Number(p.total) };
  },
  async get(id: string, signal?: AbortSignal) { return parseEntrepreneur(data(await client.get<unknown>(`/empreendedores/${encodeURIComponent(id)}`, { signal }))); },
  async create(input: EntrepreneurInput) { return parseEntrepreneur(data(await client.post("/empreendedores", inputOnly(input)))); },
  async update(id: string, version: number, input: EntrepreneurInput) { return parseEntrepreneur(data(await client.patch(`/empreendedores/${encodeURIComponent(id)}`, inputOnly(input), { params: { version } }))); },
  async remove(id: string, version: number) { data(await client.delete(`/empreendedores/${encodeURIComponent(id)}`, { params: { version } })); },
 };
}
export const entrepreneursService = createEntrepreneursService(api);
