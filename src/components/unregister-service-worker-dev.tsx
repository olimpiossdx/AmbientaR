"use client";

import { useEffect } from "react";

/**
 * Em desenvolvimento, remove Service Workers e caches do Workbox que possam
 * interceptar `/_next/static/*` e causar ChunkLoadError (chunks de build antiga).
 */
export function UnregisterServiceWorkerDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        void r.unregister();
      });
    });

    if ("caches" in window) {
      void caches.keys().then((names) => {
        names.forEach((name) => {
          void caches.delete(name);
        });
      });
    }
  }, []);

  return null;
}
