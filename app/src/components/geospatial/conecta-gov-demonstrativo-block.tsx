"use client";

import * as React from "react";
import { useFirebase } from "@/firebase";
import type { ConectaGovDemonstrativo } from "@/lib/geospatial/conecta-gov-sicar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

type ConectaGovDemonstrativoBlockProps = {
  codImovel: string;
  /** Chamado quando demonstrativo carrega (ex.: persistir APP/RL). */
  onLoaded?: (demo: ConectaGovDemonstrativo) => void;
};

export function ConectaGovDemonstrativoBlock({
  codImovel,
  onLoaded,
}: ConectaGovDemonstrativoBlockProps) {
  const { auth } = useFirebase();
  const [configured, setConfigured] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [demo, setDemo] = React.useState<ConectaGovDemonstrativo | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onLoadedRef = React.useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/geospatial/conecta-gov/status")
      .then((r) => r.json())
      .then((j: { configured?: boolean }) => {
        if (!cancelled) setConfigured(Boolean(j.configured));
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!configured || !codImovel.trim() || !auth?.currentUser) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const token = await auth.currentUser!.getIdToken();
        const res = await fetch("/api/geospatial/conecta-gov/demonstrativo", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ codImovel: codImovel.trim() }),
        });
        const json = (await res.json()) as {
          error?: string;
          demonstrativo?: ConectaGovDemonstrativo;
        };
        if (cancelled) return;
        if (!res.ok || !json.demonstrativo) {
          setDemo(null);
          setError(json.error ?? "Demonstrativo indisponível.");
          return;
        }
        setDemo(json.demonstrativo);
        onLoadedRef.current?.(json.demonstrativo);
      } catch {
        if (!cancelled) setError("Falha ao consultar Conecta Gov.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, codImovel, auth]);

  if (configured === null) return null;
  if (!configured) return null;

  return (
    <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="font-medium">Demonstrativo Conecta Gov</span>
        <Badge variant="outline" className="text-[10px]">
          órgão
        </Badge>
      </div>
      {loading ? (
        <Skeleton className="h-12 w-full" />
      ) : error ? (
        <p className="text-xs text-muted-foreground">{error}</p>
      ) : demo ? (
        <dl className="grid gap-1 text-xs sm:grid-cols-2">
          {demo.areaTotalHa != null ? (
            <div>
              <dt className="text-muted-foreground">Área total declarada</dt>
              <dd>{demo.areaTotalHa.toFixed(2)} ha</dd>
            </div>
          ) : null}
          {demo.areaAppHa != null ? (
            <div>
              <dt className="text-muted-foreground">APP declarada</dt>
              <dd>{demo.areaAppHa.toFixed(2)} ha</dd>
            </div>
          ) : null}
          {demo.areaRlHa != null ? (
            <div>
              <dt className="text-muted-foreground">Reserva Legal</dt>
              <dd>{demo.areaRlHa.toFixed(2)} ha</dd>
            </div>
          ) : null}
          {demo.status ? (
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{demo.status}</dd>
            </div>
          ) : null}
          {demo.condicao ? (
            <div>
              <dt className="text-muted-foreground">Condição</dt>
              <dd>{demo.condicao}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}
