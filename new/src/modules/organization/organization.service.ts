import { api } from "../../service/api";
import type { HttpClient } from "../../service/http/client";
export type Organization = { id: string; name: string; packageId?: string };
function parseOrganization(value: unknown): Organization {
 if (!value || typeof value !== "object" || !("id" in value) || !("name" in value) || typeof value.id !== "string" || typeof value.name !== "string") throw new Error("A API retornou uma empresa inválida.");
 const data = value as Record<string, unknown>;
 return { id: value.id, name: value.name, ...(typeof data.packageId === "string" ? { packageId: data.packageId } : {}) };
}
export function createOrganizationService(client: HttpClient = api) {
 return {
  async current(signal?: AbortSignal): Promise<Organization | null> {
   const response = await client.get<unknown>("/organizations/current", { signal });
   if (!response.ok) throw new Error(response.error?.message || "Não foi possível consultar sua empresa.");
   if (!response.data || typeof response.data !== "object" || !("organization" in response.data)) throw new Error("Resposta de empresa inválida.");
   return response.data.organization === null ? null : parseOrganization(response.data.organization);
  },
  async create(name: string): Promise<Organization> {
   const normalized = name.trim();
   if (normalized.length < 3 || normalized.length > 160) throw new Error("Informe um nome entre 3 e 160 caracteres.");
   const response = await client.post<unknown, { name: string }>("/organizations", { name: normalized });
   if (!response.ok) throw new Error(response.error?.message || "Não foi possível criar sua empresa.");
   return parseOrganization(response.data);
  },
 };
}
export const organizationService = createOrganizationService();
