import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AuthorizationCache } from "../app/authorization/authorization-cache";
import { createClaimIndex, hasClaim } from "../app/authorization/claim-index";
import { AUTH_STORAGE_KEY } from "../auth/auth-persistence";
import { AuthStore } from "../auth/auth-store";
import type { AuthSessionData } from "../auth/auth.types";
import { parseAuthSessionData } from "../auth/auth.types";

class MemoryStorage implements Storage {
 private values = new Map<string, string>();

 get length(): number {
  return this.values.size;
 }

 clear(): void {
  this.values.clear();
 }

 getItem(key: string): string | null {
  return this.values.get(key) ?? null;
 }

 key(index: number): string | null {
  return [...this.values.keys()][index] ?? null;
 }

 removeItem(key: string): void {
  this.values.delete(key);
 }

 setItem(key: string, value: string): void {
  this.values.set(key, value);
 }
}

const storage = new MemoryStorage();

Object.defineProperty(globalThis, "window", {
 configurable: true,
 value: {
  localStorage: storage,
  setTimeout,
  clearTimeout,
 },
});

function createSession(overrides: Partial<AuthSessionData> = {}): AuthSessionData {
 return {
  user: {
   id: "user-1",
   nome: "Usuário",
   username: "usuario@ambientar.com",
  },
  claims: [
   { claimType: "Recurso.Usuario", claimValue: "Visualizar" },
   { claimType: "recurso.usuario", claimValue: "CRIAR" },
  ],
  accessTokenExpiresAt: Date.now() + 60_000,
  refreshTokenExpiresAt: Date.now() + 120_000,
  ...overrides,
 };
}

describe("índice de claims", () => {
 it("normaliza caixa, mescla types e remove duplicidades", () => {
  const index = createClaimIndex([
   { claimType: " Recurso.Usuario ", claimValue: "Visualizar" },
   { claimType: "recurso.usuario", claimValue: "VISUALIZAR" },
   { claimType: "RECURSO.USUARIO", claimValue: "Criar" },
  ]);

  assert.equal(hasClaim(index, { claimType: "recurso.usuario", claimValue: "visualizar" }), true);
  assert.equal(hasClaim(index, { claimType: "Recurso.Usuario", claimValue: "CRIAR" }), true);
  assert.equal(index.get("recurso.usuario")?.size, 2);
 });

 it("adapta o formato agrupado atual da API para pares internos", () => {
  const session = parseAuthSessionData({
   user: { id: "1", nome: "Usuário", username: "user@test" },
   claims: [{ type: "recurso.usuario", values: ["visualizar", "criar"] }],
   accessTokenExpiresAt: Date.now() + 60_000,
   refreshTokenExpiresAt: Date.now() + 120_000,
  });

  assert.deepEqual(session?.claims, [
   { claimType: "recurso.usuario", claimValue: "visualizar" },
   { claimType: "recurso.usuario", claimValue: "criar" },
  ]);
 });
});

describe("snapshot persistido e cache em memória", () => {
 beforeEach(() => {
  storage.clear();
 });

 it("restaura F5 válido sem bloquear e reconstrói o cache", () => {
  const firstCache = new AuthorizationCache();
  const firstStore = new AuthStore(firstCache);
  firstStore.setAuthenticated(createSession());

  const restoredCache = new AuthorizationCache();
  const restoredStore = new AuthStore(restoredCache);
  const snapshot = restoredStore.hydrateFromPersistence();

  assert.equal(snapshot.status, "authenticated");
  assert.equal(snapshot.canUseApp, true);
  assert.equal(restoredCache.has({ claimType: "RECURSO.USUARIO", claimValue: "criar" }), true);
  firstStore.resetForTests();
  restoredStore.resetForTests();
 });

 it("mantém o modal após F5 quando a sessão foi bloqueada", () => {
  const firstStore = new AuthStore(new AuthorizationCache());
  firstStore.setAuthenticated(createSession());
  firstStore.setPendingLocation("/app/usuarios/42");
  firstStore.lock("request-unauthorized");

  const persisted = JSON.parse(storage.getItem(AUTH_STORAGE_KEY) ?? "null") as {
   requiresRelogin?: boolean;
  };
  assert.equal(persisted.requiresRelogin, true);

  const restoredStore = new AuthStore(new AuthorizationCache());
  const snapshot = restoredStore.hydrateFromPersistence();
  assert.equal(snapshot.status, "locked");
  assert.equal(snapshot.requiresRelogin, true);
  assert.equal(snapshot.pendingLocation, "/app/usuarios/42");
  firstStore.resetForTests();
  restoredStore.resetForTests();
 });

 it("bloqueia no F5 quando o access token expirou", () => {
  const firstStore = new AuthStore(new AuthorizationCache());
  firstStore.setAuthenticated(createSession({ accessTokenExpiresAt: Date.now() + 10_000 }));

  const persisted = JSON.parse(storage.getItem(AUTH_STORAGE_KEY) ?? "null") as AuthSessionData & {
   requiresRelogin: boolean;
   lockedReason: null;
  };
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
   ...persisted,
   accessTokenExpiresAt: Date.now() - 1,
  }));

  const restoredStore = new AuthStore(new AuthorizationCache());
  const snapshot = restoredStore.hydrateFromPersistence();
  assert.equal(snapshot.status, "locked");
  assert.equal(snapshot.lockedReason, "access-expired");
  firstStore.resetForTests();
  restoredStore.resetForTests();
 });

 it("substitui claims e não conserva permissões anteriores", () => {
  const cache = new AuthorizationCache();
  const store = new AuthStore(cache);
  store.setAuthenticated(createSession());
  store.setAuthenticated(createSession({
   claims: [{ claimType: "recurso.cliente", claimValue: "visualizar" }],
  }));

  assert.equal(cache.has({ claimType: "recurso.usuario", claimValue: "visualizar" }), false);
  assert.equal(cache.has({ claimType: "RECURSO.CLIENTE", claimValue: "VISUALIZAR" }), true);
  store.resetForTests();
 });

 it("logout limpa persistência e cache", () => {
  const cache = new AuthorizationCache();
  const store = new AuthStore(cache);
  store.setAuthenticated(createSession());
  store.clearToAnonymous();

  assert.equal(store.getSnapshot().status, "anonymous");
  assert.equal(storage.getItem(AUTH_STORAGE_KEY), null);
  assert.equal(cache.has({ claimType: "recurso.usuario", claimValue: "visualizar" }), false);
  store.resetForTests();
 });

 it("consultas ao cache não notificam a store", () => {
  const cache = new AuthorizationCache();
  const store = new AuthStore(cache);
  let notifications = 0;
  store.subscribe(() => { notifications += 1; });
  store.setAuthenticated(createSession());
  assert.equal(notifications, 1);

  cache.has({ claimType: "recurso.usuario", claimValue: "visualizar" });
  cache.has({ claimType: "recurso.usuario", claimValue: "criar" });
  assert.equal(notifications, 1);
  store.resetForTests();
 });
});
