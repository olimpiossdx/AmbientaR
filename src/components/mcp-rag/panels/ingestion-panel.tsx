"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebase } from "@/firebase";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { parseApiJsonResponse } from "@/lib/parse-api-json";
import { useMcpRagHubOverview } from "@/components/mcp-rag/use-mcp-rag-hub-overview";
import { mcpRagTabQuery } from "@/components/mcp-rag/mcp-rag-tabs";
import Link from "next/link";
import { Play, RefreshCw } from "lucide-react";

function runStatusBadge(status: string) {
  if (status === "completed") return <Badge>Concluída</Badge>;
  if (status === "running") return <Badge variant="secondary">A correr</Badge>;
  if (status === "pending") return <Badge variant="outline">Pendente</Badge>;
  return <Badge variant="destructive">Falhou</Badge>;
}

export function IngestionPanel({ className }: { className?: string }) {
  const { auth } = useFirebase();
  const { loading, overview, error, refresh } = useMcpRagHubOverview(auth);
  const [discovering, setDiscovering] = React.useState(false);

  const runAlmgDiscover = async () => {
    setDiscovering(true);
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch("/api/mcp-rag/ingestion/almg-discover", {
        method: "POST",
        headers,
      });
      const data = await parseApiJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Falha na descoberta ALMG.");
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setDiscovering(false);
    }
  };

  if (loading) {
    return <Skeleton className={`h-64 w-full rounded-lg ${className ?? ""}`} />;
  }

  const runs = overview?.recentIngestionRuns ?? [];

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={discovering}
          onClick={() => void runAlmgDiscover()}
        >
          <Play className="mr-1 h-4 w-4" />
          {discovering ? "A descobrir…" : "Descoberta ALMG (dados abertos)"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Atualizar
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={mcpRagTabQuery("logs")}>Ver logs completos</Link>
        </Button>
      </div>

      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">O que está disponível agora</CardTitle>
          <CardDescription>
            Fase C no stack atual: registo de execuções e descoberta de
            conectividade. Ingestão completa (PDF, OCR, embeddings) depende do
            pipeline Python / Cloud Run.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma ingestão registada. Execute a descoberta ALMG para criar a
            primeira execução.
          </p>
        ) : (
          runs.map((run) => (
            <Card key={run.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium">
                    {run.sourceName}
                  </CardTitle>
                  {runStatusBadge(run.status)}
                </div>
                <CardDescription>
                  {run.mode} · {new Date(run.startedAt).toLocaleString("pt-BR")}
                  {run.finishedAt
                    ? ` → ${new Date(run.finishedAt).toLocaleString("pt-BR")}`
                    : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  Documentos vistos: <strong>{run.documentsSeen}</strong> ·
                  Chunks: <strong>{run.chunksCreated}</strong> · Erros:{" "}
                  <strong>{run.errorCount}</strong>
                </p>
                {run.errors.length > 0 ? (
                  <ul className="list-inside list-disc text-xs text-destructive">
                    {run.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                ) : null}
                {run.metadata?.note ? (
                  <p className="text-xs text-muted-foreground">
                    {String(run.metadata.note)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
