import type { AppUser } from "@/lib/types";

/** Heartbeat enquanto a sessão está ativa (ms). */
export const PRESENCE_HEARTBEAT_MS = 60_000;

/** Sem heartbeat neste período → offline na UI (ms). */
export const PRESENCE_TTL_MS = 180_000;

export type UserPresenceFields = Pick<AppUser, "isOnline" | "lastSeenAt">;

export function presenceTimestampToMillis(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "object") {
    const ts = value as { toMillis?: () => number; seconds?: number };
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.seconds === "number") return ts.seconds * 1000;
  }
  return null;
}

/** Online só com heartbeat recente; ignora `isOnline` preso sem `lastSeenAt`. */
export function isUserConsideredOnline(
  user: UserPresenceFields | null | undefined,
  now = Date.now(),
): boolean {
  if (!user) return false;
  const lastSeen = presenceTimestampToMillis(user.lastSeenAt);
  if (lastSeen != null) {
    return now - lastSeen <= PRESENCE_TTL_MS;
  }
  return false;
}
