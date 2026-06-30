import { authStore } from "./auth-store";
import { authService } from "./auth-service";
import { extractAuthSessionData, type AuthSnapshot } from "./auth.types";

export type AuthRouterContext = {
 getSnapshot: typeof authStore.getSnapshot;
 ensureSession: () => Promise<AuthSnapshot>;
 lock: typeof authStore.lock;
 setPendingLocation: typeof authStore.setPendingLocation;
};

export async function ensureRouterSession(): Promise<AuthSnapshot> {
 const current = authStore.getSnapshot();

 if (current.status === "authenticated" || current.status === "locked") {
  return current;
 }

 const hydrated = authStore.hydrateFromPersistence();

 if (!hydrated.hasKnownUser) {
  authStore.clearToAnonymous();
  return authStore.getSnapshot();
 }

 const response = await authService.session();
 const session = response.ok ? extractAuthSessionData(response) : null;

 if (session) {
  authStore.setAuthenticated(session);
  return authStore.getSnapshot();
 }

 authStore.lock("session-unavailable");
 return authStore.getSnapshot();
}

export const authRouterContext: AuthRouterContext = {
 getSnapshot: authStore.getSnapshot,
 ensureSession: ensureRouterSession,
 lock: authStore.lock.bind(authStore),
 setPendingLocation: authStore.setPendingLocation.bind(authStore),
};
