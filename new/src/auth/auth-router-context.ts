import { authStore } from "./auth-store";
import type { AuthSnapshot } from "./auth.types";

export type AuthRouterContext = {
 getSnapshot: typeof authStore.getSnapshot;
 ensureSession: () => Promise<AuthSnapshot>;
 lock: typeof authStore.lock;
 setPendingLocation: typeof authStore.setPendingLocation;
};

let ensureSessionPromise: Promise<AuthSnapshot> | null = null;

export function ensureRouterSession(): Promise<AuthSnapshot> {
 const current = authStore.checkExpiration();

 if (current.status === "refreshing") {
  return authStore.waitForSettled();
 }

 if (current.status !== "unknown") {
  return Promise.resolve(current);
 }

 if (!ensureSessionPromise) {
  ensureSessionPromise = Promise.resolve()
   .then(() => authStore.hydrateFromPersistence())
   .finally(() => {
    ensureSessionPromise = null;
   });
 }

 return ensureSessionPromise;
}

export const authRouterContext: AuthRouterContext = {
 getSnapshot: authStore.getSnapshot,
 ensureSession: ensureRouterSession,
 lock: authStore.lock.bind(authStore),
 setPendingLocation: authStore.setPendingLocation.bind(authStore),
};
