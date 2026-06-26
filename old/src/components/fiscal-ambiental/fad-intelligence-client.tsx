"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, Bookmark, Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FAD_ROUTE_BASE } from "@/lib/fiscal-ambiental/constants";
import {
  detectChanges,
  listFadWorkspaces,
  listMosaics,
  saveEvidence,
  type FadChangeAnalysisDto,
  type FadMosaicDto,
} from "@/lib/fiscal-ambiental/fad-api-client";
import {
  CHANGE_TYPE_LABELS,
  FAD_ANALYSIS_DISCLAIMER,
} from "@/lib/fiscal-ambiental/intelligence-labels";
import type {
  FadChangeAnalysisType,
  FadChangePolygon,
  FadWorkspace,
} from "@/lib/fiscal-ambiental/types";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useToast } from "@/hooks/use-toast";

const FadChangeMap = dynamic(
  () => import("./fad-change-map").then((m) => m.FadChangeMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
        A carregar mapa…
      </div>
    ),
  },
);

export function FadIntelligenceClient() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [mosaics, setMosaics] = React.useState<FadMosaicDto[]>([]);
  const [beforeId, setBeforeId] = React.useState("");
  const [afterId, setAfterId] = React.useState("");
  const [analysis, setAnalysis] = React.useState<FadChangeAnalysisDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);
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

  React.useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      const token = await getFadAuthToken();
      const res = await listMosaics(token, workspaceId);
      if (res.ok) {
        const ready = res.data.filter((m) => m.status === "ready");
        setMosaics(ready);
        if (ready.length >= 2) {
          const sorted = [...ready].sort((a, b) =>
            a.requestedDate.localeCompare(b.requestedDate),
          );
          setBeforeId(sorted[0]!.id);
          setAfterId(sorted[sorted.length - 1]!.id);
        }
      }
    })();
  }, [workspaceId]);

  const workspace = workspaces.find((w) => w.id === workspaceId);

  const handleRun = async () => {
    if (!workspaceId || !beforeId || !afterId) return;
    setRunning(true);
    setAnalysis(null);
    try {
      const token = await getFadAuthToken();
      const res = await detectChanges(token, workspaceId, beforeId, afterId);
      if (!res.ok) {
        toast({ variant: "destructive", title: "Erro", description: res.error });
        return;
      }
      setAnalysis(res.data);
      toast({
        title: "Análise concluída",
        description:
          res.data.polygons.length > 0
            ? "Achados preventivos foram gerados em Fiscalização."
            : "Nenhuma alteração significativa detectada.",
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSaveEvidence = async () => {
    if (!analysis || !workspaceId) return;
    setSaving(true);
    try {
      const token = await getFadAuthToken();
      const res = await saveEvidence(token, workspaceId, {
        kind: "change_analysis",
        title: `Análise ${analysis.beforeDate} → ${analysis.afterDate}`,
        description: `~${analysis.summary.totalChangedHa} ha com indícios de alteração`,
        changeAnalysisId: analysis.id,
        beforeMosaicId: analysis.beforeMosaicId,
        afterMosaicId: analysis.afterMosaicId,
      });
      if (!res.ok) {
        toast({ variant: "destructive", title: "Erro", description: res.error });
        return;
      }
      toast({ title: "Análise guardada em Evidências." });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !workspaces.length) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Inteligência ambiental</h1>
          <p className="text-sm text-muted-foreground">
            Detecção de mudanças sobre imagens já arquivadas.
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
        <AlertTitle>Análise auxiliar</AlertTitle>
        <AlertDescription>{FAD_ANALYSIS_DISCLAIMER}</AlertDescription>
      </Alert>

      {mosaics.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          São necessárias pelo menos duas imagens.{" "}
          <Link href={`${FAD_ROUTE_BASE}/montar-acervo`} className="text-primary underline">
            Montar acervo
          </Link>
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Antes</Label>
              <Select value={beforeId} onValueChange={setBeforeId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mosaics.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.requestedDate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Depois</Label>
              <Select value={afterId} onValueChange={setAfterId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mosaics.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.requestedDate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRun} disabled={running || beforeId === afterId}>
              {running ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Analisar mudanças
            </Button>
          </div>

          {analysis ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {CHANGE_TYPE_LABELS.vegetation_loss}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">
                    {analysis.summary.lossHa} ha
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {CHANGE_TYPE_LABELS.vegetation_gain}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">
                    {analysis.summary.gainHa} ha
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {CHANGE_TYPE_LABELS.bare_soil_exposure}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">
                    {analysis.summary.bareHa} ha
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Confiança
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-semibold">
                    {Math.round(analysis.confidence * 100)}%
                  </CardContent>
                </Card>
              </div>

              <div className="h-[min(480px,60vh)] overflow-hidden rounded-md border">
                {workspace?.aoi ? (
                  <FadChangeMap
                    aoi={workspace.aoi}
                    polygons={analysis.polygons as FadChangePolygon[]}
                  />
                ) : null}
              </div>

              {analysis.polygons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma alteração significativa detectada nas previews analisadas.
                </p>
              ) : (
                <ul className="text-sm text-muted-foreground">
                  {analysis.polygons.slice(0, 8).map((p, i) => (
                    <li key={i}>
                      {CHANGE_TYPE_LABELS[p.type as FadChangeAnalysisType]} · ~{p.areaHa} ha
                    </li>
                  ))}
                  {analysis.polygons.length > 8 ? (
                    <li>+ {analysis.polygons.length - 8} polígonos</li>
                  ) : null}
                </ul>
              )}

              <Button onClick={handleSaveEvidence} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bookmark className="mr-2 h-4 w-4" />
                )}
                Guardar como evidência
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
