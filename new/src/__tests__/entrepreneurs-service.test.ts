import assert from "node:assert/strict";
import test from "node:test";
import type { HttpClient } from "../service/http/client";
import { createEntrepreneursService, parseEntrepreneur } from "../modules/entrepreneurs/entrepreneurs.service";
import { emptyEntrepreneur } from "../modules/entrepreneurs/entrepreneurs.types";
const item = { ...emptyEntrepreneur(), name: "Pessoa Teste", cpfCnpj: "12345678901", email: "pessoa@example.test", phone: "31999999999", id: "a", version: 2 };
test("consome paginação real no envelope da API", async () => {
 const service = createEntrepreneursService({ get: async () => ({ ok: true, data: [item], total: 41 }) } as unknown as HttpClient);
 assert.deepEqual(await service.list("Teste", 2), { items: [item], total: 41 });
});
test("recusa listagem sem total e registros sem versão", async () => {
 const service = createEntrepreneursService({ get: async () => ({ ok: true, data: [item] }) } as unknown as HttpClient);
 await assert.rejects(() => service.list("", 1), /Listagem inválida/);
 assert.throws(() => parseEntrepreneur({ ...item, version: undefined }), /Cadastro inválido/);
});
test("salva apenas campos comerciais e envia versão fora do corpo", async () => {
 let captured: unknown[] = [];
 const service = createEntrepreneursService({ patch: async (...args: unknown[]) => { captured = args; return { ok: true, data: item }; } } as unknown as HttpClient);
 await service.update(item.id, 2, { ...item, organizationId: "injected", password: "injected" } as typeof item);
 assert.equal(captured[0], "/empreendedores/a");
 const body = captured[1] as Record<string, unknown>;
 for (const key of ["organizationId", "password", "id", "version"]) assert.equal(key in body, false);
 assert.deepEqual(captured[2], { params: { version: 2 } });
});
test("propaga falhas de permissão, conflito e indisponibilidade sem falso sucesso", async () => {
 for (const status of [0, 403, 404, 409]) {
  const service = createEntrepreneursService({ delete: async () => ({ ok: false, httpStatus: status, data: null }) } as unknown as HttpClient);
  await assert.rejects(() => service.remove("a", 1), (error: unknown) => error instanceof Error && "httpStatus" in error && error.httpStatus === status);
 }
});
