import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createUsersService, UsersApiError, usersErrorMessage } from "../modules/users/users.service";
import type { ApiResponse } from "../service/http/types";

function apiResponse<T>(overrides: Partial<ApiResponse<T>>): ApiResponse<T> {
 return {
  ok: true,
  status: "success",
  httpStatus: 200,
  data: null,
  error: null,
  notifications: [],
  headers: new Headers(),
  request: { url: "/user", method: "GET", attempts: 1, retried: false },
  ...overrides,
 };
}

describe("usersService", () => {
 it("consulta /user com busca normalizada e paginação", async () => {
  let request: { url: string; params?: Record<string, unknown> } | undefined;
  const service = createUsersService({
   async get(url, config) {
    request = { url, params: config?.params };
    return apiResponse({
     data: [{ id: 42, nome: "Ana", email: "ana@exemplo.com", telefone: "31999999999", cpfCnpj: "123", tipo: "FISICA" }],
     total: 31,
    });
   },
  });

  const result = await service.list({ search: "  Ana  ", page: 2, size: 10 });

  assert.deepEqual(request, { url: "/user", params: { search: "Ana", page: 2, size: 10 } });
  assert.equal(result.status, "success");
  if (result.status === "success") {
   assert.equal(result.page.items[0]?.id, "42");
   assert.equal(result.page.total, 31);
  }
 });

 it("representa 403 separadamente dos demais erros", async () => {
  const service = createUsersService({
   async get() {
    return apiResponse({ ok: false, status: "error", httpStatus: 403 });
   },
  });

  const result = await service.list({ page: 1, size: 10 });
  assert.equal(result.status, "forbidden");
 });

 it("rejeita payload de usuário inválido", async () => {
  const service = createUsersService({
   async get() {
    return apiResponse({ data: [{ id: "1", nome: "Sem campos obrigatórios" }] });
   },
  });

  const result = await service.list({ page: 1, size: 10 });
  assert.equal(result.status, "error");
 });

 it("rejeita respostas que exponham senha ou hash", async () => {
  const service = createUsersService({
   async get() {
    return apiResponse({ data: [{ id: "1", nome: "Ana Silva", email: "ana@exemplo.com", telefone: "31999999999", cpfCnpj: "52998224725", tipo: "FISICA", passwordHash: "segredo" }] });
   },
  });

  const result = await service.list({ page: 1, size: 10 });
  assert.deepEqual(result, { status: "error", message: "A API retornou uma lista de usuários em formato inválido." });
 });

 it("preserva erros de campo retornados nas notificações da API", async () => {
  const service = createUsersService({
   get: async () => apiResponse({ data: [] }),
   post: async () => apiResponse({
    ok: false,
    status: "error",
    httpStatus: 200,
    notifications: [{ status: "error", field: "email", message: "Introduza um e-mail válido." }],
   }),
  });

  await assert.rejects(
   () => service.create({
    tipo: "FISICA", cpfCnpj: "52998224725", entityType: "CLIENTE", nome: "Ana Silva",
    email: "invalido", telefone: "31999999999", cep: "30100000", logradouro: "Rua A",
    numero: "1", bairro: "Centro", municipio: "Belo Horizonte", uf: "MG",
    nacionalidade: "Brasileira", dataNascimento: "1990-01-01", estadoCivil: "SOLTEIRO",
   }),
   (error: unknown) => {
    assert.ok(error instanceof UsersApiError);
    assert.deepEqual(error.fieldErrors, { email: "Introduza um e-mail válido." });
    return true;
   },
  );
 });

 it("traduz estados HTTP sem mensagem fornecida pela API", () => {
  assert.match(usersErrorMessage(0), /indisponível/);
  assert.match(usersErrorMessage(401), /sessão expirou/);
  assert.match(usersErrorMessage(404), /não existe mais/);
  assert.match(usersErrorMessage(409), /alterado ou já existe/);
  assert.match(usersErrorMessage(503), /temporariamente indisponível/);
 });

 it("não envia senha ou hash ao criar usuário", async () => {
  let body: Record<string, unknown> | undefined;
  const created = { id: "1", nome: "Ana", email: "ana@exemplo.com", telefone: "31999999999", cpfCnpj: "123", tipo: "FISICA" };
  const service = createUsersService({
   get: async () => apiResponse({ data: [] }),
   post: async (_url, value) => { body = value as Record<string, unknown>; return apiResponse({ data: created }); },
   put: async () => apiResponse({ data: created }), patch: async () => apiResponse({ data: created }),
   delete: async () => apiResponse({ data: { deleted: true } }),
  });

  await service.create({
   tipo: "FISICA", cpfCnpj: "123", entityType: "CLIENTE", nome: "Ana",
   email: "ana@exemplo.com", telefone: "31999999999", cep: "30100000",
   logradouro: "Rua A", numero: "1", bairro: "Centro", municipio: "Belo Horizonte",
   uf: "MG", nacionalidade: "Brasileira",
  });

  assert.equal("password" in (body ?? {}), false);
  assert.equal("passwordHash" in (body ?? {}), false);
 });

 it("envia version ao atualizar detalhes e vínculos de claims", async () => {
  const calls: Array<{ method: string; url: string; version: unknown }> = [];
  const group = { id: "group-1", name: "Gestores", description: null, claimIds: [], version: 4 };
  const service = createUsersService({
   get: async () => apiResponse({ data: [] }), post: async () => apiResponse({ data: group }),
   put: async (url, _body, config) => { calls.push({ method: "PUT", url, version: config?.params?.version }); return apiResponse({ data: { ...group, version: 5 } }); },
   patch: async (url, _body, config) => { calls.push({ method: "PATCH", url, version: config?.params?.version }); return apiResponse({ data: group }); },
   delete: async () => apiResponse({ data: { deleted: true } }),
  });

  await service.updateGroup("group-1", 3, { name: "Gestores" });
  await service.replaceGroupClaims("group-1", 4, ["claim-1"]);
  assert.deepEqual(calls, [
   { method: "PATCH", url: "/authorization/groups/group-1", version: 3 },
   { method: "PUT", url: "/authorization/groups/group-1/claims", version: 4 },
  ]);
 });

 it("consulta e substitui usuários do grupo com version", async () => {
  const calls: Array<{ method: string; url: string; body?: unknown; version?: unknown }> = [];
  const group = { id: "group-1", name: "Gestores", description: null, claimIds: [], version: 7 };
  const service = createUsersService({
   get: async (url) => { calls.push({ method: "GET", url }); return apiResponse({ data: ["user-1"] }); },
   post: async () => apiResponse({ data: group }), patch: async () => apiResponse({ data: group }),
   put: async (url, body, config) => {
    calls.push({ method: "PUT", url, body, version: config?.params?.version });
    return apiResponse({ data: { group, added: 1, removed: 0 } });
   },
   delete: async () => apiResponse({ data: { deleted: true } }),
  });

  assert.deepEqual(await service.listGroupUserIds("group-1"), ["user-1"]);
  const updated = await service.replaceGroupUsers("group-1", 6, ["user-1", "user-2"]);
  assert.equal(updated.version, 7);
  assert.deepEqual(calls, [
   { method: "GET", url: "/authorization/groups/group-1/users" },
   { method: "PUT", url: "/authorization/groups/group-1/users", body: { userIds: ["user-1", "user-2"] }, version: 6 },
  ]);
 });

 it("preserva conflito 409 como erro tipado", async () => {
  const service = createUsersService({
   get: async () => apiResponse({ data: [] }), post: async () => apiResponse({ data: null }),
   put: async () => apiResponse({ data: null }),
   patch: async () => apiResponse({ ok: false, status: "error", httpStatus: 409, error: { code: "CONFLICT", message: "Versão desatualizada" } }),
   delete: async () => apiResponse({ data: { deleted: true } }),
  });

  await assert.rejects(() => service.updateGroup("group-1", 1, { name: "Gestores" }), (error: unknown) => {
   assert.ok(error instanceof UsersApiError);
   assert.equal(error.httpStatus, 409);
   return true;
  });
 });
});
