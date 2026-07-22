import { authorizationCache, type AuthorizationCache } from "../app/authorization/authorization-cache";
import { clearKnownSession, loadKnownSession, saveKnownSession } from "./auth-persistence";
import type {
 AuthLockedReason,
 AuthSessionData,
 AuthSnapshot,
 PersistedAuthSnapshot,
} from "./auth.types";

function createInitialSnapshot(revision = 0): AuthSnapshot {
 return {
  status: "unknown",
  user: null,
  claims: [],
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
  requiresRelogin: false,
  hasKnownUser: false,
  canUseApp: false,
  isRefreshing: false,
  isLocked: false,
  lockedReason: null,
  pendingLocation: null,
  revision,
 };
}

type Listener = () => void;

export class AuthStore {
 private snapshot: AuthSnapshot = createInitialSnapshot();
 private listeners = new Set<Listener>();
 private expirationTimer: number | null = null;
 private readonly cache: AuthorizationCache;

 constructor(cache: AuthorizationCache = authorizationCache) {
  this.cache = cache;
 }

 getSnapshot = (): AuthSnapshot => this.snapshot;

 subscribe = (listener: Listener): (() => void) => {
  this.listeners.add(listener);
  return () => this.listeners.delete(listener);
 };

 hydrateFromPersistence(): AuthSnapshot {
  const persisted = loadKnownSession();

  if (!persisted) {
   this.cache.clear();
   this.replaceSnapshot({ ...createInitialSnapshot(), status: "anonymous" });
   return this.snapshot;
  }

  this.cache.replace(persisted.claims);

  if (persisted.requiresRelogin || persisted.accessTokenExpiresAt <= Date.now()) {
   const lockedReason = persisted.lockedReason ?? "access-expired";
   this.persistLocked(persisted, lockedReason);
   this.replaceSnapshot(this.lockedSnapshotFrom(persisted, lockedReason));
   return this.snapshot;
  }

  this.restoreAuthenticated(persisted);
  return this.snapshot;
 }

 setAuthenticated(session: AuthSessionData): void {
  const persisted: PersistedAuthSnapshot = {
   ...session,
   requiresRelogin: false,
   lockedReason: null,
   pendingLocation: null,
  };

  saveKnownSession(persisted);
  this.cache.replace(session.claims);
  this.replaceSnapshot({
   status: "authenticated",
   user: session.user,
   claims: session.claims,
   accessTokenExpiresAt: session.accessTokenExpiresAt,
   refreshTokenExpiresAt: session.refreshTokenExpiresAt,
   requiresRelogin: false,
   hasKnownUser: true,
   canUseApp: true,
   isRefreshing: false,
   isLocked: false,
   lockedReason: null,
   pendingLocation: null,
   revision: this.snapshot.revision + 1,
  });
  this.scheduleAccessExpiration(session.accessTokenExpiresAt);
 }

 setRefreshing(): void {
  if (this.snapshot.status === "anonymous" || this.snapshot.status === "locked") {
   return;
  }

  this.clearExpirationTimer();
  this.replaceSnapshot({
   ...this.snapshot,
   status: "refreshing",
   canUseApp: false,
   isRefreshing: true,
   isLocked: false,
   lockedReason: null,
   revision: this.snapshot.revision + 1,
  });
 }

 lock(reason: Exclude<AuthLockedReason, null>, pendingLocation?: string | null): void {
  this.clearExpirationTimer();
  const persisted = loadKnownSession();
  const user = this.snapshot.user ?? persisted?.user ?? null;
  const claims = this.snapshot.claims.length > 0 ? this.snapshot.claims : persisted?.claims ?? [];

  if (persisted) {
   this.persistLocked(
    persisted,
    reason,
    pendingLocation ?? this.snapshot.pendingLocation ?? persisted.pendingLocation,
   );
  }

  this.cache.replace(claims);
  this.replaceSnapshot({
   ...this.snapshot,
   status: "locked",
   user,
   claims,
   accessTokenExpiresAt: this.snapshot.accessTokenExpiresAt ?? persisted?.accessTokenExpiresAt ?? null,
   refreshTokenExpiresAt: this.snapshot.refreshTokenExpiresAt ?? persisted?.refreshTokenExpiresAt ?? null,
   requiresRelogin: true,
   hasKnownUser: Boolean(user),
   canUseApp: false,
   isRefreshing: false,
   isLocked: true,
   lockedReason: reason,
   pendingLocation: pendingLocation ?? this.snapshot.pendingLocation ?? persisted?.pendingLocation ?? null,
   revision: this.snapshot.revision + 1,
  });
 }

 checkExpiration(): AuthSnapshot {
  if (
   this.snapshot.status === "authenticated" &&
   this.snapshot.accessTokenExpiresAt !== null &&
   this.snapshot.accessTokenExpiresAt <= Date.now()
  ) {
   this.lock("access-expired");
  }

  return this.snapshot;
 }

 waitForSettled(): Promise<AuthSnapshot> {
  if (this.snapshot.status !== "refreshing" && this.snapshot.status !== "unknown") {
   return Promise.resolve(this.snapshot);
  }

  return new Promise((resolve) => {
   const unsubscribe = this.subscribe(() => {
    if (this.snapshot.status === "refreshing" || this.snapshot.status === "unknown") {
     return;
    }

    unsubscribe();
    resolve(this.snapshot);
   });
  });
 }

 setPendingLocation(location: string | null): void {
  if (this.snapshot.pendingLocation === location) {
   return;
  }

  const persisted = loadKnownSession();
  if (persisted) {
   saveKnownSession({ ...persisted, pendingLocation: location });
  }

  this.replaceSnapshot({
   ...this.snapshot,
   pendingLocation: location,
   revision: this.snapshot.revision + 1,
  });
 }

 syncFromPersistence(): void {
  this.clearExpirationTimer();
  this.hydrateFromPersistence();
 }

 clearToAnonymous(): void {
  clearKnownSession();
  this.clearExpirationTimer();
  this.cache.clear();
  this.replaceSnapshot({
   ...createInitialSnapshot(this.snapshot.revision + 1),
   status: "anonymous",
  });
 }

 resetForTests(): void {
  this.clearExpirationTimer();
  this.cache.clear();
  this.snapshot = createInitialSnapshot();
  this.listeners.clear();
  clearKnownSession();
 }

 private restoreAuthenticated(session: PersistedAuthSnapshot): void {
  this.cache.replace(session.claims);
  this.replaceSnapshot({
   status: "authenticated",
   user: session.user,
   claims: session.claims,
   accessTokenExpiresAt: session.accessTokenExpiresAt,
   refreshTokenExpiresAt: session.refreshTokenExpiresAt,
   requiresRelogin: false,
   hasKnownUser: true,
   canUseApp: true,
   isRefreshing: false,
   isLocked: false,
   lockedReason: null,
   pendingLocation: session.pendingLocation,
   revision: this.snapshot.revision + 1,
  });
  this.scheduleAccessExpiration(session.accessTokenExpiresAt);
 }

 private lockedSnapshotFrom(
  session: PersistedAuthSnapshot,
  reason: Exclude<AuthLockedReason, null>,
 ): AuthSnapshot {
  return {
   status: "locked",
   user: session.user,
   claims: session.claims,
   accessTokenExpiresAt: session.accessTokenExpiresAt,
   refreshTokenExpiresAt: session.refreshTokenExpiresAt,
   requiresRelogin: true,
   hasKnownUser: true,
   canUseApp: false,
   isRefreshing: false,
   isLocked: true,
   lockedReason: reason,
   pendingLocation: session.pendingLocation,
   revision: this.snapshot.revision + 1,
  };
 }

 private persistLocked(
  session: PersistedAuthSnapshot,
  reason: Exclude<AuthLockedReason, null>,
  pendingLocation = this.snapshot.pendingLocation ?? session.pendingLocation,
 ): void {
  saveKnownSession({
   ...session,
   requiresRelogin: true,
   lockedReason: reason,
   pendingLocation,
  });
 }

 private scheduleAccessExpiration(expiresAt: number): void {
  this.clearExpirationTimer();
  const delay = expiresAt - Date.now();

  if (delay <= 0) {
   this.lock("access-expired");
   return;
  }

  if (typeof window === "undefined") {
   return;
  }

  this.expirationTimer = window.setTimeout(() => {
   const snapshot = this.checkExpiration();

   if (snapshot.status === "authenticated" && snapshot.accessTokenExpiresAt !== null) {
    this.scheduleAccessExpiration(snapshot.accessTokenExpiresAt);
   }
  }, Math.min(delay, 2_147_483_647));
 }

 private clearExpirationTimer(): void {
  if (this.expirationTimer === null || typeof window === "undefined") {
   return;
  }

  window.clearTimeout(this.expirationTimer);
  this.expirationTimer = null;
 }

 private replaceSnapshot(snapshot: AuthSnapshot): void {
  this.snapshot = snapshot;
  this.listeners.forEach((listener) => listener());
 }
}

export const authStore = new AuthStore();
