"use client";

import { useEffect, useState } from "react";
import {
  isUserConsideredOnline,
  PRESENCE_TTL_MS,
  type UserPresenceFields,
} from "@/lib/user-presence";

const PRESENCE_UI_TICK_MS = Math.min(30_000, PRESENCE_TTL_MS / 4);

/** Relógio local para expirar TTL na UI sem novo snapshot do Firestore. */
export function usePresenceClock(
  intervalMs = PRESENCE_UI_TICK_MS,
): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useUserPresenceOnline(
  user: UserPresenceFields | null | undefined,
): boolean {
  const now = usePresenceClock();
  return isUserConsideredOnline(user, now);
}
