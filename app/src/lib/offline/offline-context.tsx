"use client";

import * as React from "react";
import { useAuth, useFirebase } from "@/firebase";
import { buildUserSyncManifest } from "./manifest";
import { runSyncPass } from "./sync-engine";
import { processStorageQueue } from "./storage-queue";

export type OfflineContextValue = {
  isOnline: boolean;
  manifest: ReturnType<typeof buildUserSyncManifest>;
  lastSyncAt: Date | null;
  pendingOutbox: number;
  pendingStorage: number;
  refreshCounts: () => Promise<void>;
  triggerSync: () => Promise<void>;
};

const OfflineContext = React.createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { firestore } = useFirebase();
  const [isOnline, setIsOnline] = React.useState(
    () => typeof navigator !== "undefined" && navigator.onLine,
  );
  const [lastSyncAt, setLastSyncAt] = React.useState<Date | null>(null);
  const [counts, setCounts] = React.useState({ outbox: 0, storage: 0 });

  const manifest = React.useMemo(() => buildUserSyncManifest(user), [user]);

  const refreshCounts = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    const { getOfflineDb } = await import("./db");
    const db = getOfflineDb();
    const [outbox, storage] = await Promise.all([
      db.outbox.where("status").equals("pending").count(),
      db.storageQueue.where("status").equals("pending").count(),
    ]);
    setCounts({ outbox, storage });
  }, []);

  React.useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  React.useEffect(() => {
    void refreshCounts();
  }, [refreshCounts, user?.uid]);

  const triggerSync = React.useCallback(async () => {
    if (!firestore || !navigator.onLine) return;
    await runSyncPass(firestore, true);
    await processStorageQueue(firestore);
    setLastSyncAt(new Date());
    await refreshCounts();
  }, [firestore, refreshCounts]);

  React.useEffect(() => {
    if (!isOnline || !firestore || !user?.uid) return;
    let cancelled = false;
    void (async () => {
      await runSyncPass(firestore, true);
      await processStorageQueue(firestore);
      if (!cancelled) {
        setLastSyncAt(new Date());
        await refreshCounts();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOnline, firestore, user?.uid, refreshCounts]);

  const value = React.useMemo<OfflineContextValue>(
    () => ({
      isOnline,
      manifest,
      lastSyncAt,
      pendingOutbox: counts.outbox,
      pendingStorage: counts.storage,
      refreshCounts,
      triggerSync,
    }),
    [
      isOnline,
      manifest,
      lastSyncAt,
      counts.outbox,
      counts.storage,
      refreshCounts,
      triggerSync,
    ],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextValue {
  const ctx = React.useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline deve ser usado dentro de OfflineProvider.");
  }
  return ctx;
}

export function useOfflineOptional(): OfflineContextValue | null {
  return React.useContext(OfflineContext);
}
