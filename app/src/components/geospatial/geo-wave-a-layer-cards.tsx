"use client";

import * as React from "react";
import type { GeoLayerResult } from "@/lib/types/geo-wave-a";
import { CAVIDADES_POTENCIAL_LAYER_ID } from "@/lib/geospatial/cavidades-potencial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DEFAULT_PAGE_SIZE = 8;

function statusVariant(
  status: GeoLayerResult["status"],
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ok") return "default";
  if (status === "partial") return "secondary";
  return "destructive";
}

function statusLabel(status: GeoLayerResult["status"]): string {
  if (status === "ok") return "OK";
  if (status === "partial") return "Parcial";
  return "Indisponível";
}

function LayerCard({ layer }: { layer: GeoLayerResult }) {
  return (
    <Card
      className={
        layer.layerId === CAVIDADES_POTENCIAL_LAYER_ID
          ? "overflow-hidden border-primary/40"
          : "overflow-hidden"
      }
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{layer.title}</CardTitle>
          <Badge variant={statusVariant(layer.status)}>{statusLabel(layer.status)}</Badge>
        </div>
        <CardDescription className="text-xs">{layer.summary}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {layer.stats.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {layer.summary ||
              (layer.errorMessage
                ? `Erro: ${layer.errorMessage}`
                : "Sem estatísticas no recorte.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-1 pr-2 font-medium">Classe / feição</th>
                  <th className="py-1 pr-2 font-medium">ha</th>
                  <th className="py-1 pr-2 font-medium">% emp.</th>
                  <th className="py-1 font-medium">km</th>
                  <th className="py-1 font-medium">nº</th>
                </tr>
              </thead>
              <tbody>
                {layer.stats.map((row, idx) => (
                  <tr key={`${layer.layerId}-${idx}`} className="border-b border-border/50">
                    <td className="py-1.5 pr-2">{row.label}</td>
                    <td className="py-1.5 pr-2 tabular-nums">
                      {row.areaHa != null ? row.areaHa.toFixed(2) : "—"}
                    </td>
                    <td className="py-1.5 pr-2 tabular-nums">
                      {row.pctOfPerimeter != null ? `${row.pctOfPerimeter}%` : "—"}
                    </td>
                    <td className="py-1.5 tabular-nums">
                      {row.lengthKm != null ? row.lengthKm.toFixed(2) : "—"}
                    </td>
                    <td className="py-1.5 tabular-nums">
                      {row.count != null ? row.count : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {layer.source ? (
          <p className="mt-2 text-[10px] text-muted-foreground">
            {layer.source.layerName} · {layer.source.queriedAtUtc.slice(0, 19)}Z
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function GeoWaveALayerCards({
  layers,
  className,
  pageSize = DEFAULT_PAGE_SIZE,
  inProgressCount,
}: {
  layers: GeoLayerResult[];
  className?: string;
  pageSize?: number;
  /** Camadas já recebidas durante análise em curso (mostra contador). */
  inProgressCount?: number;
}) {
  const [visibleCount, setVisibleCount] = React.useState(pageSize);
  const [filter, setFilter] = React.useState("");

  React.useEffect(() => {
    setVisibleCount(pageSize);
  }, [layers.length, pageSize]);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return layers;
    return layers.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.layerId.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q),
    );
  }, [filter, layers]);

  const ok = layers.filter((l) => l.status === "ok").length;
  const partial = layers.filter((l) => l.status === "partial").length;
  const shown = filtered.slice(0, visibleCount);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {inProgressCount != null && inProgressCount < layers.length
            ? `${inProgressCount} de ${layers.length} camada(s) consultadas…`
            : `${layers.length} camada(s) · ${ok} OK · ${partial} parcial/indisponível`}
        </p>
        <Input
          className="h-8 max-w-xs text-xs"
          placeholder="Filtrar camada…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div
        className={
          className ??
          "grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4"
        }
      >
        {shown.map((layer) => (
          <LayerCard key={layer.layerId} layer={layer} />
        ))}
      </div>
      {visibleCount < filtered.length ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setVisibleCount((n) => n + pageSize)}
        >
          Mostrar mais ({filtered.length - visibleCount} restantes)
        </Button>
      ) : null}
    </div>
  );
}
