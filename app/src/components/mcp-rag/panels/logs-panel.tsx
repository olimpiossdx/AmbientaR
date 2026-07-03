"use client";

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
import { useMcpRagHubOverview } from "@/components/mcp-rag/use-mcp-rag-hub-overview";
import { ScrollText } from "lucide-react";

function jobStatusBadge(status: string) {
  if (status === "completed") return <Badge>Concluído</Badge>;
  if (status === "running") return <Badge variant="secondary">A correr</Badge>;
  if (status === "failed") return <Badge variant="destructive">Falhou</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function LogsPanel({ className }: { className?: string }) {
  const { auth } = useFirebase();
  const { loading, overview, error, refresh } = useMcpRagHubOverview(auth);

  if (loading) {
    return <Skeleton className={`h-64 w-full rounded-lg ${className ?? ""}`} />;
  }

  const cloudJobs = overview?.recentCloudJobs ?? [];
  const ingestionRuns = overview?.recentIngestionRuns ?? [];

  return (
    <div className={className}>
      <div className="mb-4">
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          Atualizar logs
        </Button>
      </div>
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="h-4 w-4" />
              Jobs cloud-rag (OneDrive)
            </CardTitle>
            <CardDescription>Últimos sync / indexação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cloudJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem jobs registados.</p>
            ) : (
              cloudJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-md border p-3 text-sm space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{job.type}</span>
                    {jobStatusBadge(job.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.startedAt
                      ? new Date(job.startedAt).toLocaleString("pt-BR")
                      : "—"}
                  </p>
                  {job.errors.length > 0 ? (
                    <ul className="list-inside list-disc text-xs text-destructive">
                      {job.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ingestões oficiais</CardTitle>
            <CardDescription>ALMG e futuras fontes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ingestionRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem execuções de ingestão.
              </p>
            ) : (
              ingestionRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded-md border p-3 text-sm space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{run.sourceName}</span>
                    {jobStatusBadge(run.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {run.mode} ·{" "}
                    {new Date(run.startedAt).toLocaleString("pt-BR")}
                  </p>
                  {run.errors.length > 0 ? (
                    <ul className="list-inside list-disc text-xs text-destructive">
                      {run.errors.slice(0, 3).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
