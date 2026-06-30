import type { AuthSessionData } from "./auth.types";
import { isAuthSessionData } from "./auth.types";

const AUTH_STORAGE_KEY = "new_arq.auth.known_session.v1";

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

export function loadKnownSession(): AuthSessionData | null {
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
  return isAuthSessionData(parsed) ? parsed : null;
 } catch {
  return null;
 }
}

export function saveKnownSession(session: AuthSessionData): void {
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
