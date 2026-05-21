"use client";

import type { GeoLayerResult } from "@/lib/types/geo-wave-a";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

export function GeoWaveALayerCards({ layers }: { layers: GeoLayerResult[] }) {
  return (
    <div className="grid gap-3">
      {layers.map((layer) => (
        <Card key={layer.layerId} className="overflow-hidden">
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
                {layer.errorMessage
                  ? `Erro: ${layer.errorMessage}`
                  : "Sem estatísticas no recorte."}
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
      ))}
    </div>
  );
}
