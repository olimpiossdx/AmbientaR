"use client";

import * as React from "react";
import type { AppUser } from "@/lib/types";

type PortalAdvertisingLayerProps = {
  user: AppUser;
  children: React.ReactNode;
};

/**
 * Carrega anúncios/cookies do portal só após o paint — evita chunk no shell inicial.
 * Enquanto carrega, renderiza os filhos sem camada publicitária.
 */
export function PortalAdvertisingLayerLazy({
  user,
  children,
}: PortalAdvertisingLayerProps) {
  const [Layer, setLayer] = React.useState<
    React.ComponentType<PortalAdvertisingLayerProps> | null
  >(null);

  React.useEffect(() => {
    let cancelled = false;
    void import("@/components/portal-advertising-layer").then((mod) => {
      if (!cancelled) setLayer(() => mod.PortalAdvertisingLayer);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Layer) return <>{children}</>;
  return <Layer user={user}>{children}</Layer>;
}
