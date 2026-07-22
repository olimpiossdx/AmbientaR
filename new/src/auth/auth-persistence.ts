import type { PersistedAuthSnapshot } from "./auth.types";
import { isAuthSessionData } from "./auth.types";

export const AUTH_STORAGE_KEY = "ambientar.auth.session.v2";

function getStorage(): Storage | null {
 if (typeof window === "undefined") {
  return null;
 }

 try {
  return window.localStorage;
 } catch {
  return null;
 }
}

export function isPersistedAuthSnapshot(value: unknown): value is PersistedAuthSnapshot {
 if (!isAuthSessionData(value)) {
  return false;
 }

 const snapshot = value as Partial<PersistedAuthSnapshot>;
 return (
  typeof snapshot.requiresRelogin === "boolean" &&
  (snapshot.pendingLocation === null || typeof snapshot.pendingLocation === "string")
 );
}

export function loadKnownSession(): PersistedAuthSnapshot | null {
 const storage = getStorage();

 if (!storage) {
  return null;
 }

 const raw = storage.getItem(AUTH_STORAGE_KEY);

 if (!raw) {
  return null;
 }

 try {
  const parsed = JSON.parse(raw) as unknown;
  if (isPersistedAuthSnapshot(parsed)) {
   return parsed;
  }

  storage.removeItem(AUTH_STORAGE_KEY);
  return null;
 } catch {
  storage.removeItem(AUTH_STORAGE_KEY);
  return null;
 }
}

export function saveKnownSession(session: PersistedAuthSnapshot): void {
 const storage = getStorage();

 if (!storage) {
  return;
 }

 storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearKnownSession(): void {
 const storage = getStorage();

 if (!storage) {
  return;
 }

 storage.removeItem(AUTH_STORAGE_KEY);
}
