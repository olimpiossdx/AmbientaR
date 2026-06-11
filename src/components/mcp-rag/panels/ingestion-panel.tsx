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
import { Database, Play, RefreshCw, Zap } from "lucide-react";

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
  const [pipelining, setPipelining] = React.useState(false);

  const pipeline = overview?.pipeline;

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

  const runPipelineIngest = async (mode: "incremental" | "full") => {
    setPipelining(true);
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch("/api/mcp-rag/ingestion/pipeline", {
        method: "POST",
        headers,
        body: JSON.stringify({ sourceId: "almg-open-data", mode, limit: 50 }),
      });
      const data = await parseApiJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Falha na ingestão via pipeline.");
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setPipelining(false);
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
        {pipeline?.legislationPipelineEnabled ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pipelining || !pipeline.legislationPipelineHealthy}
              onClick={() => void runPipelineIngest("incremental")}
            >
              <Zap className="mr-1 h-4 w-4" />
              {pipelining ? "A ingerir…" : "Ingestão incremental (worker)"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pipelining || !pipeline.legislationPipelineHealthy}
              onClick={() => void runPipelineIngest("full")}
            >
              <Database className="mr-1 h-4 w-4" />
              Ingestão completa
            </Button>
          </>
        ) : null}
        <Button asChild variant="ghost" size="sm">
          <Link href={mcpRagTabQuery("logs")}>Ver logs completos</Link>
        </Button>
      </div>

      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">O que está disponível agora</CardTitle>
          <CardDescription>
            Descoberta via Next.js (Firestore). Ingestão com embeddings e
            pgvector via worker Python quando{" "}
            <code className="text-xs">LEGISLATION_PIPELINE_ENABLED=true</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                pipeline?.legislationPipelineEnabled ? "default" : "secondary"
              }
            >
              Pipeline {pipeline?.legislationPipelineEnabled ? "ligado" : "off"}
            </Badge>
            {pipeline?.legislationPipelineEnabled ? (
              <Badge
                variant={
                  pipeline.legislationPipelineHealthy ? "default" : "destructive"
                }
              >
                Worker {pipeline.legislationPipelineHealthy ? "ok" : "indisponível"}
              </Badge>
            ) : null}
          </div>
          {!pipeline?.legislationPipelineEnabled ? (
            <p className="text-xs text-muted-foreground">
              Local: <code>infra/legislation-pipeline</code> na porta 8092. Ver
              README do worker.
            </p>
          ) : null}
        </CardContent>
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
