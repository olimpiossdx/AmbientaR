import assert from "node:assert/strict";
import test from "node:test";
import type { HttpClient } from "../service/http/client";
import { createOrganizationService } from "../modules/organization/organization.service";

test("empresa atual vem da API e não de um identificador escolhido no navegador", async () => {
 let called = "";
 const service = createOrganizationService({ get: async (url: string) => {
  called = url;
  return { ok: true, data: { organization: { id: "company-a", name: "Empresa A" } } };
 } } as unknown as HttpClient);
 assert.deepEqual(await service.current(), { id: "company-a", name: "Empresa A" });
 assert.equal(called, "/organizations/current");
});

test("conta sem vínculo é diferente de falha de autorização", async () => {
 const unlinked = createOrganizationService({ get: async () => ({ ok: true, data: { organization: null } }) } as unknown as HttpClient);
 assert.equal(await unlinked.current(), null);
 const denied = createOrganizationService({ get: async () => ({ ok: false, httpStatus: 403, error: { message: "Empresa indisponível" } }) } as unknown as HttpClient);
 await assert.rejects(() => denied.current(), /Empresa indisponível/);
});

test("criação normaliza nome sem enviar usuário, tenant ou permissões", async () => {
 let body: unknown;
 const service = createOrganizationService({ post: async (_url: string, input: unknown) => {
  body = input;
  return { ok: true, data: { id: "company-a", name: "Empresa A" } };
 } } as unknown as HttpClient);
 await service.create("  Empresa A  ");
 assert.deepEqual(body, { name: "Empresa A" });
 await assert.rejects(() => service.create(" x "), /nome entre/);
});
