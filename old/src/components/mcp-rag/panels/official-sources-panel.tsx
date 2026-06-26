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
import { Switch } from "@/components/ui/switch";
import { useFirebase } from "@/firebase";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { parseApiJsonResponse } from "@/lib/parse-api-json";
import type { McpRagOfficialSource } from "@/lib/mcp-rag/types";
import { useMcpRagHubOverview } from "@/components/mcp-rag/use-mcp-rag-hub-overview";
import { ExternalLink, Landmark } from "lucide-react";

function statusBadge(status?: string) {
  if (!status) return <Badge variant="secondary">Sem execução</Badge>;
  if (status === "completed") return <Badge variant="default">OK</Badge>;
  if (status === "running") return <Badge variant="secondary">Em curso</Badge>;
  return <Badge variant="destructive">Falhou</Badge>;
}

export function OfficialSourcesPanel({ className }: { className?: string }) {
  const { auth } = useFirebase();
  const { loading, overview, error, refresh } = useMcpRagHubOverview(auth);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const toggleEnabled = async (source: McpRagOfficialSource) => {
    setBusyId(source.id);
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch(
        `/api/mcp-rag/official-sources/${encodeURIComponent(source.id)}`,
        {
          method: "PATCH",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !source.enabled }),
        },
      );
      const data = await parseApiJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Falha ao atualizar fonte.");
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <Skeleton className={`h-64 w-full rounded-lg ${className ?? ""}`} />;
  }

  const sources = overview?.officialSources ?? [];
  const pipeline = overview?.pipeline;

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          Atualizar
        </Button>
      </div>
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pipeline legislativo</CardTitle>
          <CardDescription>
            ALMG Dados Abertos como primário; portal HTML só como fallback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Base ALMG:{" "}
            <a
              href={pipeline?.almgOpenDataBaseUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {pipeline?.almgOpenDataBaseUrl}
            </a>
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={pipeline?.legislationPipelineEnabled ? "default" : "secondary"}>
              Pipeline {pipeline?.legislationPipelineEnabled ? "ligado" : "off"}
            </Badge>
            {pipeline?.legislationPipelineEnabled ? (
              <Badge
                variant={
                  pipeline.legislationPipelineHealthy ? "default" : "destructive"
                }
              >
                Worker {pipeline.legislationPipelineHealthy ? "ok" : "down"}
              </Badge>
            ) : null}
            <Badge variant={pipeline?.portalScraperFallback ? "destructive" : "secondary"}>
              Scraper portal {pipeline?.portalScraperFallback ? "ativo" : "off"}
            </Badge>
          </div>
          {pipeline?.legislationPipelineUrl ? (
            <p className="text-xs text-muted-foreground">
              URL worker: {pipeline.legislationPipelineUrl}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Defina LEGISLATION_PIPELINE_URL quando o worker Python estiver
              publicado.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-start gap-2 text-base">
                <Landmark className="mt-0.5 h-4 w-4 shrink-0" />
                {source.name}
              </CardTitle>
              <CardDescription>{source.issuingBody}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{source.sourceType}</Badge>
                {statusBadge(source.lastRunStatus)}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={source.enabled}
                    disabled={busyId === source.id}
                    onCheckedChange={() => void toggleEnabled(source)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {source.enabled ? "Ativa" : "Inativa"}
                  </span>
                </div>
              </div>
              {source.baseUrl ? (
                <a
                  href={source.baseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Abrir fonte
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Docs vistos: {source.documentCount ?? 0} · Chunks:{" "}
                {source.chunkCount ?? 0}
                {source.lastRunAt
                  ? ` · Última execução: ${new Date(source.lastRunAt).toLocaleString("pt-BR")}`
                  : ""}
              </p>
              {source.notes ? (
                <p className="text-xs text-muted-foreground">{source.notes}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
