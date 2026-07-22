import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { AuthorizationCache } from "../app/authorization/authorization-cache";
import { installAuthInterceptors } from "../auth/auth-interceptors";
import { AuthStore } from "../auth/auth-store";
import type { AuthSessionData } from "../auth/auth.types";
import { HttpClient } from "../service/http/client";
import type { ApiResponse } from "../service/http/types";

class TestStorage implements Storage {
 private values = new Map<string, string>();
 get length() { return this.values.size; }
 clear() { this.values.clear(); }
 getItem(key: string) { return this.values.get(key) ?? null; }
 key(index: number) { return [...this.values.keys()][index] ?? null; }
 removeItem(key: string) { this.values.delete(key); }
 setItem(key: string, value: string) { this.values.set(key, value); }
}

const storage = new TestStorage();
Object.defineProperty(globalThis, "window", {
 configurable: true,
 value: { localStorage: storage, setTimeout, clearTimeout },
});

function createSession(claimValue = "visualizar"): AuthSessionData {
 return {
  user: { id: "user-1", nome: "Usuário", username: "user@ambientar.com" },
  claims: [{ claimType: "recurso.usuario", claimValue }],
  accessTokenExpiresAt: Date.now() + 60_000,
  refreshTokenExpiresAt: Date.now() + 120_000,
 };
}

function refreshResponse(ok: boolean, session = createSession("editar")): ApiResponse<AuthSessionData> {
 return {
  ok,
  status: ok ? "success" : "error",
  httpStatus: ok ? 200 : 401,
  data: ok ? session : null,
  error: ok ? null : { code: "401", message: "Unauthorized" },
  notifications: [],
  headers: new Headers(),
  request: { url: "/auth/refresh", method: "POST", attempts: 1, retried: false },
 };
}

function jsonResponse(body: unknown, status = 200) {
 return new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
 });
}

describe("interceptores de autenticação", () => {
 let originalFetch: typeof fetch;
 let store: AuthStore;

 beforeEach(() => {
  originalFetch = globalThis.fetch;
  storage.clear();
  store = new AuthStore(new AuthorizationCache());
 });

 afterEach(() => {
  globalThis.fetch = originalFetch;
  store.resetForTests();
  storage.clear();
 });

 it("força credentials include", async () => {
  let credentials: RequestCredentials | undefined;
  globalThis.fetch = async (_input, init) => {
   credentials = init?.credentials;
   return jsonResponse({ ok: true, data: null });
  };

  const client = new HttpClient({ baseURL: "https://api.test" });
  installAuthInterceptors(client, {
   store,
   service: { refresh: async () => refreshResponse(true) },
  });
  await client.get("/clientes");
  assert.equal(credentials, "include");
 });

 it("faz um refresh, substitui as claims e repete o request", async () => {
  store.setAuthenticated(createSession("visualizar"));
  let fetchCalls = 0;
  let refreshCalls = 0;
  globalThis.fetch = async () => {
   fetchCalls += 1;
   return fetchCalls === 1
    ? jsonResponse({ ok: false }, 401)
    : jsonResponse({ ok: true, data: [{ id: 1 }] });
  };

  const client = new HttpClient({ baseURL: "https://api.test" });
  installAuthInterceptors(client, {
   store,
   service: {
    refresh: async () => {
     refreshCalls += 1;
     return refreshResponse(true);
    },
   },
  });

  const response = await client.get<Array<{ id: number }>>("/clientes");
  assert.equal(refreshCalls, 1);
  assert.equal(fetchCalls, 2);
  assert.equal(response.data?.[0]?.id, 1);
  assert.equal(store.getSnapshot().claims[0]?.claimValue, "editar");
 });

 it("persiste o bloqueio quando o refresh falha", async () => {
  store.setAuthenticated(createSession());
  globalThis.fetch = async () => jsonResponse({ ok: false }, 401);

  const client = new HttpClient({ baseURL: "https://api.test" });
  installAuthInterceptors(client, {
   store,
   service: { refresh: async () => refreshResponse(false) },
  });
  await client.get("/clientes");

  assert.equal(store.getSnapshot().status, "locked");
  assert.equal(store.getSnapshot().requiresRelogin, true);
 });

 it("compartilha um único refresh entre requests concorrentes", async () => {
  store.setAuthenticated(createSession());
  let fetchCalls = 0;
  let refreshCalls = 0;
  globalThis.fetch = async () => {
   fetchCalls += 1;
   return fetchCalls <= 2
    ? jsonResponse({ ok: false }, 401)
    : jsonResponse({ ok: true, data: [] });
  };

  const client = new HttpClient({ baseURL: "https://api.test" });
  installAuthInterceptors(client, {
   store,
   service: {
    refresh: async () => {
     refreshCalls += 1;
     await Promise.resolve();
     return refreshResponse(true);
    },
   },
  });

  await Promise.all([client.get("/clientes"), client.get("/usuarios")]);
  assert.equal(refreshCalls, 1);
  assert.equal(fetchCalls, 4);
 });

 it("não tenta refresh em endpoint de autenticação", async () => {
  let refreshCalls = 0;
  globalThis.fetch = async () => jsonResponse({ ok: false }, 401);
  const client = new HttpClient({ baseURL: "https://api.test" });
  installAuthInterceptors(client, {
   store,
   service: {
    refresh: async () => {
     refreshCalls += 1;
     return refreshResponse(true);
    },
   },
  });

  await client.post("/auth/login", { username: "user@test", password: "secret" });
  assert.equal(refreshCalls, 0);
 });
});
