"use client";

import * as React from "react";
import { AlertTriangle, Camera, Loader2, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEsgSnapshot,
  fetchEsgDashboard,
  listFadWorkspaces,
  type FadEsgDashboardDto,
} from "@/lib/fiscal-ambiental/fad-api-client";
import { ESG_DISCLAIMER, SCORE_LABELS } from "@/lib/fiscal-ambiental/esg-labels";
import type { FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function scoreColor(score: number, invert = false): string {
  const v = invert ? 100 - score : score;
  if (v >= 70) return "text-emerald-600";
  if (v >= 45) return "text-yellow-600";
  return "text-orange-600";
}

function ScoreCard({
  label,
  score,
  explanations,
  invertColor,
}: {
  label: string;
  score: number;
  explanations: string[];
  invertColor?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className={cn("text-3xl font-bold tabular-nums", scoreColor(score, invertColor))}>
          {score}
        </p>
        <Progress value={score} className="h-2" />
        <ul className="space-y-1 text-xs text-muted-foreground">
          {explanations.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function FadEsgClient() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [dashboard, setDashboard] = React.useState<FadEsgDashboardDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const token = await getFadAuthToken();
        const res = await listFadWorkspaces(token);
        if (res.ok && res.data.length) {
          setWorkspaces(res.data);
          setWorkspaceId(res.data[0]!.id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadDashboard = React.useCallback(async (wsId: string) => {
    const token = await getFadAuthToken();
    const res = await fetchEsgDashboard(token, wsId);
    if (res.ok) setDashboard(res.data);
  }, []);

  React.useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    loadDashboard(workspaceId).finally(() => setLoading(false));
  }, [workspaceId, loadDashboard]);

  const handleSnapshot = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const token = await getFadAuthToken();
      const res = await createEsgSnapshot(token, workspaceId);
      if (!res.ok) {
        toast({ variant: "destructive", title: "Erro", description: res.error });
        return;
      }
      await loadDashboard(workspaceId);
      toast({ title: "Snapshot ESG guardado." });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !dashboard && !workspaces.length) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar…
      </div>
    );
  }

  const ind = dashboard?.indicators;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Auditoria ESG</h1>
          <p className="text-sm text-muted-foreground">
            Scores transparentes a partir do acervo e achados FAD (0–100).
          </p>
        </div>
        <div className="space-y-1">
          <Label>Imóvel</Label>
          <Select value={workspaceId} onValueChange={setWorkspaceId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Indicadores auxiliares</AlertTitle>
        <AlertDescription>{ESG_DISCLAIMER}</AlertDescription>
      </Alert>

      {dashboard ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSnapshot} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar snapshot
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ScoreCard
              label={SCORE_LABELS.environmental}
              score={dashboard.scores.environmental}
              explanations={dashboard.explanations.environmental}
            />
            <ScoreCard
              label={SCORE_LABELS.compliance}
              score={dashboard.scores.compliance}
              explanations={dashboard.explanations.compliance}
            />
            <ScoreCard
              label={SCORE_LABELS.risk}
              score={dashboard.scores.risk}
              explanations={dashboard.explanations.risk}
              invertColor
            />
          </div>

          {ind ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">Cobertura vegetal (est.)</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{ind.vegetationCoverPct}%</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">Área preservada (est.)</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{ind.preservedAreaHa} ha</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">Área antropizada (est.)</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{ind.anthropizedAreaHa} ha</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    Imagens no acervo
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{ind.mosaicCount}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">Achados abertos</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{ind.openFindings}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">Críticos / altos</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {ind.criticalFindings} / {ind.highFindings}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">Intervenção APP (indícios)</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{ind.appInterventionFindings}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">Alertas PRODES</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {ind.prodesAlerts} (v2 SIG)
                </CardContent>
              </Card>
            </div>
          ) : null}

          {ind?.analysisPeriod ? (
            <p className="text-xs text-muted-foreground">
              Última análise considerada: {ind.analysisPeriod}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Execute Inteligência ambiental para enriquecer os indicadores.
            </p>
          )}

          {dashboard.snapshots.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Snapshots anteriores</h2>
              <ul className="text-sm text-muted-foreground">
                {dashboard.snapshots.map((s) => (
                  <li key={s.id}>
                    {s.createdAt.slice(0, 10)} — ambiental {s.scores.environmental}, conformidade{" "}
                    {s.scores.compliance}, risco {s.scores.risk}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Sem dados para este imóvel.</p>
      )}
    </div>
  );
}
