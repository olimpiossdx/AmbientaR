"use client";

import * as React from "react";
import Script from "next/script";
import { getAdSenseConfig } from "@/lib/adsense-config";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

type Props = {
  slotId: string;
  className?: string;
  label?: string;
};

export function AdSenseSlot({ slotId, className, label = "Publicidade" }: Props) {
  const config = getAdSenseConfig();
  const pushedRef = React.useRef(false);

  React.useEffect(() => {
    if (!config?.clientId || !slotId || pushedRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // script ainda não carregou
    }
  }, [config?.clientId, slotId]);

  if (!config?.clientId || !slotId) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div
          className={cn(
            "rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-6 text-center text-xs text-muted-foreground",
            className,
          )}
        >
          Espaço reservado para Google AdSense ({label}). Configure{" "}
          <code className="text-[10px]">NEXT_PUBLIC_ADSENSE_CLIENT_ID</code> e o
          slot correspondente.
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <Script
        id="adsense-loader"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.clientId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <aside
        aria-label={label}
        className={cn(
          "my-4 overflow-hidden rounded-md border border-border/60 bg-muted/20",
          className,
        )}
      >
        <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          Publicidade
        </p>
        <ins
          className="adsbygoogle block min-h-[90px] w-full"
          style={{ display: "block" }}
          data-ad-client={config.clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </aside>
    </>
  );
}
