"use client";

import * as React from "react";
import { useFirebase } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  compareCarSnapshotHistory,
  type CarHistoricoAvaliacao,
} from "@/lib/geospatial/car-snapshot-compare";
import { fetchCarSnapshotHistory } from "@/lib/geospatial/car-snapshot-store";
import { AlertTriangle, History, Info } from "lucide-react";

type CarHistoricoPanelProps = {
  codImovel: string;
  /** Avaliação pré-calculada (ex.: após execução do pacote). */
  avaliacao?: CarHistoricoAvaliacao | null;
  compact?: boolean;
};

export function CarHistoricoPanel({
  codImovel,
  avaliacao: avaliacaoProp,
  compact = false,
}: CarHistoricoPanelProps) {
  const { firestore } = useFirebase();
  const [loading, setLoading] = React.useState(!avaliacaoProp);
  const [avaliacao, setAvaliacao] = React.useState<CarHistoricoAvaliacao | null>(
    avaliacaoProp ?? null,
  );

  React.useEffect(() => {
    if (avaliacaoProp) {
      setAvaliacao(avaliacaoProp);
      setLoading(false);
      return;
    }
    if (!firestore || !codImovel.trim()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchCarSnapshotHistory(firestore, codImovel.trim(), 10)
      .then((records) => {
        if (cancelled) return;
        setAvaliacao(compareCarSnapshotHistory(records, codImovel.trim()));
      })
      .catch(() => {
        if (!cancelled) setAvaliacao(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [firestore, codImovel, avaliacaoProp]);

  if (loading) {
    return compact ? null : <Skeleton className="h-16 w-full" />;
  }

  if (!avaliacao || avaliacao.totalSnapshots === 0) {
    if (compact) return null;
    return (
      <p className="text-xs text-muted-foreground">
        Histórico CAR: nenhuma versão anterior registrada pelo AmbientaR.
      </p>
    );
  }

  const resultadoVariant =
    avaliacao.resultado === "Alerta"
      ? "destructive"
      : avaliacao.resultado === "Apto"
        ? "secondary"
        : "outline";

  return (
    <div className="space-y-2 rounded-md border border-dashed p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Histórico CAR (AmbientaR)</span>
        <Badge variant={resultadoVariant}>{avaliacao.resultado}</Badge>
        <span className="text-xs text-muted-foreground">
          {avaliacao.totalSnapshots} versão(ões)
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{avaliacao.detalhe}</p>
      {avaliacao.alertas.length > 0 ? (
        <ul className="space-y-1">
          {avaliacao.alertas.map((a, i) => (
            <li key={i} className="flex gap-2 text-xs">
              {a.severidade === "alerta" ? (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              ) : (
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span>{a.mensagem}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!compact && avaliacao.anterior && avaliacao.atual ? (
        <p className="text-[11px] text-muted-foreground font-mono">
          {avaliacao.anterior.areaHa.toFixed(2)} ha → {avaliacao.atual.areaHa.toFixed(2)} ha
        </p>
      ) : null}
    </div>
  );
}
