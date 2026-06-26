"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebase } from "@/firebase";
import { useMcpRagHubOverview } from "@/components/mcp-rag/use-mcp-rag-hub-overview";
import { DollarSign } from "lucide-react";

function usd(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
  }).format(value);
}

export function CostsPanel({ className }: { className?: string }) {
  const { auth } = useFirebase();
  const { loading, overview, error } = useMcpRagHubOverview(auth);

  if (loading) {
    return <Skeleton className={`h-48 w-full rounded-lg ${className ?? ""}`} />;
  }

  const costs = overview?.costs;

  return (
    <div className={className}>
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Custos estimados
          </CardTitle>
          <CardDescription>{costs?.periodLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Chunks OneDrive</p>
              <p className="text-2xl font-semibold">{costs?.cloudRagChunks ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chunks Base Jurídica</p>
              <p className="text-2xl font-semibold">{costs?.juridicaChunks ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Embeddings (est.)</p>
              <p className="text-2xl font-semibold">
                {usd(costs?.embeddingEstimateUsd ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">OCR (est.)</p>
              <p className="text-2xl font-semibold">
                {usd(costs?.ocrEstimateUsd ?? 0)}
              </p>
            </div>
          </div>
          <p className="text-lg font-medium">
            Total estimado: {usd(costs?.totalEstimateUsd ?? 0)}
          </p>
          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
            {(costs?.notes ?? []).map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
