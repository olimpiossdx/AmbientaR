import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAuthGuard } from "../app/router/auth-guards";
import type { AppRouterContext } from "../app/router/router-context";
import type { AuthSnapshot, AuthStatus } from "../auth/auth.types";

function snapshot(status: AuthStatus): AuthSnapshot {
 return {
  status,
  user: status === "anonymous" ? null : { id: "1", nome: "Usuário", username: "user@test" },
  claims: [],
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
  requiresRelogin: status === "locked",
  hasKnownUser: status !== "anonymous",
  canUseApp: status === "authenticated",
  isRefreshing: status === "refreshing",
  isLocked: status === "locked",
  lockedReason: status === "locked" ? "access-expired" : null,
  pendingLocation: null,
  revision: 1,
 };
}

function options(status: AuthStatus, allowed: boolean) {
 let pendingLocation: string | null = null;
 const context: AppRouterContext = {
  auth: {
   getSnapshot: () => snapshot(status),
   ensureSession: async () => snapshot(status),
   lock: () => undefined,
   setPendingLocation: (location) => { pendingLocation = location; },
  },
  authorization: {
   hasClaim: () => allowed,
   satisfies: () => allowed,
  },
 };

 return {
  guardOptions: {
   context,
   location: { href: "/app/usuarios", pathname: "/app/usuarios" },
  },
  pending: () => pendingLocation,
 };
}

describe("guards de autenticação", () => {
 it("permite sessão autenticada com claim", async () => {
  const fixture = options("authenticated", true);
  await createAuthGuard({ claimType: "recurso.usuario", claimValue: "visualizar" })(
   fixture.guardOptions,
  );
  assert.equal(fixture.pending(), null);
 });

 it("nega claim ausente", async () => {
  const fixture = options("authenticated", false);
  await assert.rejects(() => createAuthGuard({
   claimType: "recurso.usuario",
   claimValue: "visualizar",
  })(fixture.guardOptions));
 });

 it("bloqueia loader de rota e preserva localização quando locked", async () => {
  const fixture = options("locked", true);
  await assert.rejects(() => createAuthGuard()(fixture.guardOptions));
  assert.equal(fixture.pending(), "/app/usuarios");
 });
});
