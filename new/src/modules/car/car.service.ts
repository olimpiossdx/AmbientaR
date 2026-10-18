import { api, API_BASE_URL } from "../../service/api";
import type { HttpClient } from "../../service/http/client";
import type { ApiResponse } from "../../service/http/types";
import type { CarFile, CarInput, CarProjectOption, CarRecord } from "./car.types";

export class CarApiError extends Error {
  readonly httpStatus: number;
  constructor(message: string, httpStatus: number) { super(message); this.httpStatus = httpStatus; }
}
function data(response: ApiResponse<unknown>): unknown {
  if (!response.ok || response.data === null) {
    const messages: Record<number, string> = { 0: "API indisponível.", 401: "Sua sessão expirou.", 403: "Você não possui permissão para esta operação.", 404: "Registro ou empreendimento não encontrado.", 409: "O registro mudou ou este empreendimento já possui um CAR ativo. Recarregue." };
    throw new CarApiError(response.error?.message ?? messages[response.httpStatus] ?? "Não foi possível concluir.", response.httpStatus);
  }
  return response.data;
}
function record(value: unknown): CarRecord {
  if (!value || typeof value !== "object") throw new Error("Registro CAR inválido.");
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || !Number.isSafeInteger(item.version) || Number(item.version) < 1 || typeof item.projectId !== "string" || typeof item.projectName !== "string" || typeof item.receiptNumber !== "string") throw new Error("Registro CAR inválido.");
  return { ...item, files: Array.isArray(item.files) ? item.files as CarFile[] : [] } as CarRecord;
}
function carFile(value: unknown): CarFile {
  if (!value || typeof value !== "object") throw new Error("Anexo CAR inválido.");
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.name !== "string" || !["pdf", "geometry"].includes(String(item.kind)) || !Number.isSafeInteger(item.size)) throw new Error("Anexo CAR inválido.");
  return item as CarFile;
}
export function createCarService(client: HttpClient) {
  return {
    async list(search: string, page: number, signal?: AbortSignal) {
      const result = data(await client.get<unknown>("/car-records", { params: { search, page, size: 10 }, signal }));
      if (!result || typeof result !== "object") throw new Error("Listagem CAR inválida.");
      const payload = result as Record<string, unknown>;
      if (!Array.isArray(payload.items) || !Number.isSafeInteger(payload.total) || Number(payload.total) < 0) throw new Error("Listagem CAR inválida.");
      return { items: payload.items.map(record), total: Number(payload.total) };
    },
    async projects(signal?: AbortSignal): Promise<CarProjectOption[]> {
      const result = data(await client.get<unknown>("/car-records/projects", { signal }));
      if (!Array.isArray(result)) throw new Error("Lista de empreendimentos inválida.");
      return result as CarProjectOption[];
    },
    async get(id: string, signal?: AbortSignal) { return record(data(await client.get<unknown>(`/car-records/${encodeURIComponent(id)}`, { signal }))); },
    async create(input: CarInput) { return record(data(await client.post<unknown, CarInput>("/car-records", input))); },
    async update(id: string, version: number, input: CarInput) { return record(data(await client.patch<unknown, CarInput>(`/car-records/${encodeURIComponent(id)}`, input, { params: { version } }))); },
    async remove(id: string, version: number) { data(await client.delete(`/car-records/${encodeURIComponent(id)}`, { params: { version } })); },
    async uploadFile(id: string, kind: CarFile["kind"], file: File) {
      const form = new FormData(); form.append("kind", kind); form.append("file", file);
      return carFile(data(await client.post<unknown, FormData>(`/car-records/${encodeURIComponent(id)}/files`, form)));
    },
    async removeFile(id: string, fileId: string) {
      data(await client.delete(`/car-records/${encodeURIComponent(id)}/files/${encodeURIComponent(fileId)}`));
    },
    async downloadFile(id: string, file: CarFile) {
      const response = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}/car-records/${encodeURIComponent(id)}/files/${encodeURIComponent(file.id)}`, { credentials: "include" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: { message?: string }; message?: string } | null;
        throw new CarApiError(payload?.error?.message ?? payload?.message ?? "Não foi possível baixar o anexo.", response.status);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = file.name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  };
}
export const carService = createCarService(api);
