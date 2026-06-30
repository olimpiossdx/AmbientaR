import { clearKnownSession, loadKnownSession, saveKnownSession } from "./auth-persistence";
import type { AuthLockedReason, AuthSessionData, AuthSnapshot } from "./auth.types";

const initialSnapshot: AuthSnapshot = {
 status: "unknown",
 user: null,
 accessTokenExpiresAt: null,
 refreshTokenExpiresAt: null,
 hasKnownUser: false,
 canUseApp: false,
 isRefreshing: false,
 isLocked: false,
 lockedReason: null,
 pendingLocation: null,
};

type Listener = () => void;

export class AuthStore {
 private snapshot: AuthSnapshot = initialSnapshot;
 private listeners = new Set<Listener>();
 private expirationTimer: number | null = null;

 getSnapshot = (): AuthSnapshot => this.snapshot;

 subscribe = (listener: Listener): (() => void) => {
  this.listeners.add(listener);

  return () => {
   this.listeners.delete(listener);
  };
 };

 hydrateFromPersistence(): AuthSnapshot {
  const knownSession = loadKnownSession();

  if (!knownSession) {
   this.setSnapshot({ ...initialSnapshot, status: "anonymous" });
   return this.snapshot;
  }

  this.setSnapshot({
   ...initialSnapshot,
   status: "locked",
   user: knownSession.user,
   accessTokenExpiresAt: knownSession.accessTokenExpiresAt,
   refreshTokenExpiresAt: knownSession.refreshTokenExpiresAt,
   hasKnownUser: true,
   canUseApp: false,
   isLocked: true,
   lockedReason: "session-unavailable",
  });

  return this.snapshot;
 }

 setAuthenticated(session: AuthSessionData): void {
  saveKnownSession(session);

  this.setSnapshot({
   status: "authenticated",
   user: session.user,
   accessTokenExpiresAt: session.accessTokenExpiresAt,
   refreshTokenExpiresAt: session.refreshTokenExpiresAt,
   hasKnownUser: true,
   canUseApp: true,
   isRefreshing: false,
   isLocked: false,
   lockedReason: null,
   pendingLocation: null,
  });

  this.scheduleAccessExpiration(session.accessTokenExpiresAt);
 }

 setRefreshing(): void {
  if (this.snapshot.status === "anonymous") {
   return;
  }

  this.clearExpirationTimer();
  this.setSnapshot({
   ...this.snapshot,
   status: "refreshing",
   canUseApp: false,
   isRefreshing: true,
   isLocked: false,
   lockedReason: null,
  });
 }

 lock(reason: Exclude<AuthLockedReason, null>, pendingLocation?: string | null): void {
  this.clearExpirationTimer();

  const knownSession = loadKnownSession();
  const user = this.snapshot.user ?? knownSession?.user ?? null;

  this.setSnapshot({
   ...this.snapshot,
   status: "locked",
   user,
   accessTokenExpiresAt: this.snapshot.accessTokenExpiresAt ?? knownSession?.accessTokenExpiresAt ?? null,
   refreshTokenExpiresAt: this.snapshot.refreshTokenExpiresAt ?? knownSession?.refreshTokenExpiresAt ?? null,
   hasKnownUser: Boolean(user),
   canUseApp: false,
   isRefreshing: false,
   isLocked: true,
   lockedReason: reason,
   pendingLocation: pendingLocation ?? this.snapshot.pendingLocation,
  });
 }

 setPendingLocation(location: string | null): void {
  this.setSnapshot({
   ...this.snapshot,
   pendingLocation: location,
  });
 }

 clearToAnonymous(): void {
  clearKnownSession();
  this.clearExpirationTimer();
  this.setSnapshot({ ...initialSnapshot, status: "anonymous" });
 }

 resetForTests(): void {
  this.clearExpirationTimer();
  this.snapshot = { ...initialSnapshot };
  this.listeners.clear();
  clearKnownSession();
 }

 private scheduleAccessExpiration(expiresAt: number): void {
  this.clearExpirationTimer();

  const delay = expiresAt - Date.now();

  if (delay <= 0) {
   this.lock("access-expired");
   return;
  }

  this.expirationTimer = window.setTimeout(() => {
   if (this.snapshot.status === "authenticated") {
    this.lock("access-expired");
   }
  }, delay);
 }

 private clearExpirationTimer(): void {
  if (this.expirationTimer === null) {
   return;
  }

  window.clearTimeout(this.expirationTimer);
  this.expirationTimer = null;
 }

 private setSnapshot(snapshot: AuthSnapshot): void {
  this.snapshot = snapshot;
  this.listeners.forEach((listener) => listener());
 }
}

export const authStore = new AuthStore();
