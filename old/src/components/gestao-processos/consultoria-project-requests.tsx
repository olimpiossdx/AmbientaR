"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Unlink } from "lucide-react";
import type { Request } from "@/lib/types";
import { LICENCIAMENTO_REQUESTS_PATH } from "@/lib/licenciamento-menu";
import {
  formatLicenciamentoSolicitationNumber,
  getLicenciamentoStatusLabel,
} from "@/lib/licenciamento-tramite-report";

type ConsultoriaProjectRequestsProps = {
  requests: Request[];
  cadastroProjectNameById?: ReadonlyMap<string, string>;
  canWrite?: boolean;
  unlinkingId?: string | null;
  onUnlink?: (requestId: string) => void | Promise<void>;
};

export function ConsultoriaProjectRequests({
  requests,
  cadastroProjectNameById,
  canWrite,
  unlinkingId,
  onUnlink,
}: ConsultoriaProjectRequestsProps) {
  const active = requests.filter((r) => r.status !== "Completed");
  const completed = requests.filter((r) => r.status === "Completed");

  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum trâmite de licenciamento vinculado a este projeto.
      </p>
    );
  }

  const renderRow = (req: Request) => (
    <Card key={req.id} className="border-border/60">
      <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-medium">
              {formatLicenciamentoSolicitationNumber(req)}
            </span>
            <Badge variant="outline">Licenciamento</Badge>
            <Badge variant="secondary">{getLicenciamentoStatusLabel(req.status)}</Badge>
          </div>
          {cadastroProjectNameById?.get(req.projectId) ? (
            <p className="text-sm text-muted-foreground">
              {cadastroProjectNameById.get(req.projectId)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`${LICENCIAMENTO_REQUESTS_PATH}/${req.id}/edit`}>
              Abrir trâmite
            </Link>
          </Button>
          {canWrite && onUnlink ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={unlinkingId === req.id}
              onClick={() => void onUnlink(req.id)}
            >
              {unlinkingId === req.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="mr-2 h-4 w-4" />
              )}
              Desvincular
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {active.length > 0 ? (
        <div className="space-y-2">{active.map(renderRow)}</div>
      ) : null}
      {completed.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Concluídos ({completed.length})
          </p>
          {completed.map(renderRow)}
        </div>
      ) : null}
    </div>
  );
}
