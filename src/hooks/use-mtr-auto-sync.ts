"use client";

import * as React from "react";
import { useFirebase } from "@/firebase";
import type { Empreendedor } from "@/lib/types";
import { empreendedoresParaAutoSync } from "@/lib/mtr/mtr-auto-sync";

const POLL_INTERVAL_MS = 6 * 60 * 60 * 1000;

type UseMtrAutoSyncOptions = {
  empreendedores?: Empreendedor[];
  mtrConfigured: boolean | null;
  enabled?: boolean;
};

/**
 * Dispara sync em lote no servidor para empreendedores com auto-sync vencido.
 */
export function useMtrAutoSync({
  empreendedores,
  mtrConfigured,
  enabled = true,
}: UseMtrAutoSyncOptions) {
  const { auth } = useFirebase();
  const [syncing, setSyncing] = React.useState(false);
  const lastRunRef = React.useRef(0);

  const runBatch = React.useCallback(async () => {
    if (!enabled || !mtrConfigured || !auth?.currentUser || !empreendedores?.length) {
      return;
    }
    const due = empreendedoresParaAutoSync(empreendedores);
    if (due.length === 0) return;

    const now = Date.now();
    if (now - lastRunRef.current < 60_000) return;
    lastRunRef.current = now;

    setSyncing(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/mtr/sync-batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empreendedorIds: due.map((e) => e.id),
          onlyAutoEnabled: true,
        }),
      });
      const json = (await res.json()) as {
        added?: number;
        error?: string;
      };
      if (!res.ok) {
        console.warn("[MTR auto-sync]", json.error);
      }
    } catch (e) {
      console.warn("[MTR auto-sync]", e);
    } finally {
      setSyncing(false);
    }
  }, [auth, empreendedores, enabled, mtrConfigured]);

  React.useEffect(() => {
    if (!enabled || mtrConfigured !== true) return;
    void runBatch();
    const id = window.setInterval(() => void runBatch(), POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, mtrConfigured, runBatch]);

  return { syncing, runBatch };
}
