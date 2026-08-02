import { api } from "../../service/api";
import type { ApiRequestConfig, ApiResponse } from "../../service/http/types";
import type {
 AuthorizationClaim,
 AuthorizationGroup,
 AuthorizationGroupInput,
 UserCreateInput,
 UserListItem,
 UserUpdateInput,
 UsersListParams,
 UsersListResult,
} from "./users.types";

type RequestConfig = Omit<ApiRequestConfig, "method" | "body">;
type UsersHttpClient = {
 get<TResponse>(url: string, config?: RequestConfig): Promise<ApiResponse<TResponse>>;
 post<TResponse, TBody>(url: string, body?: TBody, config?: RequestConfig): Promise<ApiResponse<TResponse>>;
 put<TResponse, TBody>(url: string, body?: TBody, config?: RequestConfig): Promise<ApiResponse<TResponse>>;
 patch<TResponse, TBody>(url: string, body?: TBody, config?: RequestConfig): Promise<ApiResponse<TResponse>>;
 delete<TResponse>(url: string, config?: RequestConfig): Promise<ApiResponse<TResponse>>;
};

export class UsersApiError extends Error {
 readonly httpStatus: number;
 readonly code?: string;
 readonly fieldErrors: Readonly<Record<string, string>>;

 constructor(message: string, httpStatus: number, code?: string, fieldErrors: Readonly<Record<string, string>> = {}) {
  super(message);
  this.name = "UsersApiError";
  this.httpStatus = httpStatus;
  this.code = code;
  this.fieldErrors = fieldErrors;
 }
}

export function usersErrorMessage(httpStatus: number, apiMessage?: string): string {
 if (apiMessage?.trim()) return apiMessage;
 if (httpStatus === 0) return "A API de usuários está indisponível. Verifique sua conexão e tente novamente.";
 if (httpStatus === 401) return "Sua sessão expirou. Entre novamente para acessar os usuários.";
 if (httpStatus === 403) return "Você não possui permissão para esta operação.";
 if (httpStatus === 404) return "O usuário ou grupo não existe mais ou está fora do seu escopo.";
 if (httpStatus === 409) return "O registro foi alterado ou já existe. Atualize os dados e tente novamente.";
 if (httpStatus === 400 || httpStatus === 422) return "Os dados informados são inválidos. Revise os campos e tente novamente.";
 if (httpStatus >= 500) return "A API de usuários está temporariamente indisponível. Tente novamente em instantes.";
 return "Não foi possível concluir a operação.";
}

function dataOrThrow<T>(response: ApiResponse<T>, fallback: string): T {
 if (!response.ok || response.data === null) {
  const fieldErrors = Object.fromEntries(response.notifications.filter((item) => item.status === "error" && item.field).map((item) => [item.field as string, item.message]));
  const notificationMessage = response.notifications.find((item) => item.status === "error")?.message;
  const apiMessage = response.error?.message || notificationMessage || (response.httpStatus === 200 ? fallback : undefined);
  throw new UsersApiError(usersErrorMessage(response.httpStatus, apiMessage), response.httpStatus, response.error?.code, fieldErrors);
 }
 return response.data;
}

function idString(value: unknown): string | null {
 return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function parseUser(value: unknown): UserListItem {
 if (!value || typeof value !== "object") throw new Error("Usuário inválido retornado pela API.");
 const user = value as Record<string, unknown>;
 if ("passwordHash" in user || "password" in user) throw new Error("A API retornou credenciais que não podem ser expostas.");
 const id = idString(user.id);
 if (!id || typeof user.nome !== "string" || typeof user.email !== "string" || typeof user.telefone !== "string" || typeof user.cpfCnpj !== "string" || typeof user.tipo !== "string") {
  throw new Error("Usuário inválido retornado pela API.");
 }
 const optional = (key: string) => typeof user[key] === "string" ? user[key] as string : undefined;
 return {
  id, nome: user.nome, email: user.email, telefone: user.telefone,
  cpfCnpj: user.cpfCnpj, tipo: user.tipo,
  entityType: optional("entityType"), onboardingStatus: optional("onboardingStatus"),
  municipio: optional("municipio"), uf: optional("uf"), cep: optional("cep"),
  logradouro: optional("logradouro"), numero: optional("numero"), bairro: optional("bairro"),
  rg: optional("rg"), emissor: optional("emissor"), nacionalidade: optional("nacionalidade"),
  estadoCivil: optional("estadoCivil"), dataNascimento: optional("dataNascimento"), ctfIbama: optional("ctfIbama"),
 };
}

function parseGroup(value: unknown): AuthorizationGroup {
 if (!value || typeof value !== "object") throw new Error("Grupo inválido retornado pela API.");
 const group = value as Record<string, unknown>;
 const id = idString(group.id);
 const claimIds = Array.isArray(group.claimIds) ? group.claimIds.map(idString) : [];
 if (!id || typeof group.name !== "string" || typeof group.version !== "number" || claimIds.some((item) => item === null)) {
  throw new Error("Grupo inválido retornado pela API.");
 }
 return { id, name: group.name, version: group.version, claimIds: claimIds as string[], description: typeof group.description === "string" ? group.description : null };
}

function parseClaim(value: unknown): AuthorizationClaim {
 if (!value || typeof value !== "object") throw new Error("Claim inválida retornada pela API.");
 const claim = value as Record<string, unknown>;
 const id = idString(claim.id);
 if (!id || typeof claim.type !== "string" || typeof claim.value !== "string") throw new Error("Claim inválida retornada pela API.");
 return { id, type: claim.type, value: claim.value };
}

export function createUsersService(client: UsersHttpClient = api) {
 return {
  async list(params: UsersListParams): Promise<UsersListResult> {
   const page = Math.max(1, Math.trunc(params.page));
   const size = Math.min(100, Math.max(1, Math.trunc(params.size)));
   const response = await client.get<unknown[]>("/user", { params: { search: params.search?.trim() ?? "", page, size }, signal: params.signal });
   if (response.httpStatus === 401 || response.httpStatus === 403) return { status: "forbidden", message: usersErrorMessage(response.httpStatus, response.error?.message) };
   if (!response.ok) return { status: "error", message: usersErrorMessage(response.httpStatus, response.error?.message) };
   try {
    if (!Array.isArray(response.data)) throw new Error();
    const items = response.data.map(parseUser);
    return { status: "success", page: { items, page, size, total: typeof response.total === "number" ? response.total : items.length } };
   } catch {
    return { status: "error", message: "A API retornou uma lista de usuários em formato inválido." };
   }
  },
  async get(id: string, signal?: AbortSignal) {
   return parseUser(dataOrThrow(await client.get<unknown>(`/user/${encodeURIComponent(id)}`, { signal }), "Não foi possível carregar o usuário."));
  },
  async create(input: UserCreateInput) {
   return parseUser(dataOrThrow(await client.post<unknown, UserCreateInput>("/user", input), "Não foi possível criar o usuário."));
  },
  async update(id: string, input: UserUpdateInput) {
   return parseUser(dataOrThrow(await client.put<unknown, UserUpdateInput>(`/user/${encodeURIComponent(id)}`, input), "Não foi possível atualizar o usuário."));
  },
  async remove(id: string) {
   const response = await client.delete<unknown>(`/user/${encodeURIComponent(id)}`);
   if (!response.ok) throw new UsersApiError(usersErrorMessage(response.httpStatus, response.error?.message), response.httpStatus, response.error?.code);
  },
  async listGroups(signal?: AbortSignal) {
   const data = dataOrThrow(await client.get<unknown[]>("/authorization/groups", { signal }), "Não foi possível carregar os grupos.");
   if (!Array.isArray(data)) throw new Error("Lista de grupos inválida.");
   return data.map(parseGroup);
  },
  async listGroupUserIds(id: string, signal?: AbortSignal) {
   const data = dataOrThrow(await client.get<unknown[]>(`/authorization/groups/${encodeURIComponent(id)}/users`, { signal }), "Não foi possível carregar os usuários do grupo.");
   if (!Array.isArray(data) || data.some((value) => idString(value) === null)) throw new Error("Lista de usuários do grupo inválida.");
   return data.map((value) => String(value));
  },
  async listUsersForGroups(signal?: AbortSignal) {
   const response = await client.get<unknown[]>("/user", { params: { search: "", page: 1, size: 250 }, signal });
   const data = dataOrThrow(response, "Não foi possível carregar os usuários para associação.");
   if (!Array.isArray(data)) throw new Error("Lista de usuários inválida.");
   return data.map(parseUser);
  },
  async createGroup(input: AuthorizationGroupInput) {
   return parseGroup(dataOrThrow(await client.post<unknown, AuthorizationGroupInput>("/authorization/groups", input), "Não foi possível criar o grupo."));
  },
  async updateGroup(id: string, version: number, input: Omit<AuthorizationGroupInput, "claimIds">) {
   return parseGroup(dataOrThrow(await client.patch<unknown, typeof input>(`/authorization/groups/${encodeURIComponent(id)}`, input, { params: { version } }), "Não foi possível atualizar o grupo."));
  },
  async replaceGroupClaims(id: string, version: number, claimIds: string[]) {
   return parseGroup(dataOrThrow(await client.put<unknown, { claimIds: string[] }>(`/authorization/groups/${encodeURIComponent(id)}/claims`, { claimIds }, { params: { version } }), "Não foi possível atualizar as claims do grupo."));
  },
  async replaceGroupUsers(id: string, version: number, userIds: string[]) {
   const data = dataOrThrow(await client.put<unknown, { userIds: string[] }>(`/authorization/groups/${encodeURIComponent(id)}/users`, { userIds }, { params: { version } }), "Não foi possível atualizar os usuários do grupo.");
   if (!data || typeof data !== "object" || !("group" in data)) throw new Error("Resposta de vínculo de usuários inválida.");
   return parseGroup((data as { group: unknown }).group);
  },
  async deleteGroup(id: string, version: number) {
   const response = await client.delete<unknown>(`/authorization/groups/${encodeURIComponent(id)}`, { params: { version } });
   if (!response.ok) throw new UsersApiError(usersErrorMessage(response.httpStatus, response.error?.message), response.httpStatus, response.error?.code);
  },
  async listClaims(signal?: AbortSignal) {
   const data = dataOrThrow(await client.get<unknown[]>("/authorization/claims", { signal }), "Não foi possível carregar as claims.");
   if (!Array.isArray(data)) throw new Error("Catálogo de claims inválido.");
   return data.map(parseClaim);
  },
 };
}

export const usersService = createUsersService();
