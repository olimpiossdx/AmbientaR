"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, Play, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  createMonitoringRule,
  deleteMonitoringRule,
  listFadWorkspaces,
  listMonitoringRuns,
  listMonitoringRules,
  runMonitoring,
  type FadMonitoringRunDto,
  type FadMonitoringRuleDto,
} from "@/lib/fiscal-ambiental/fad-api-client";
import {
  ALERT_LEVEL_COLORS,
  ALERT_LEVEL_LABELS,
  FREQUENCY_LABELS,
  MONITORING_DISCLAIMER,
} from "@/lib/fiscal-ambiental/monitoring-labels";
import type {
  FadMonitoringAlertLevel,
  FadMonitoringFrequency,
  FadWorkspace,
} from "@/lib/fiscal-ambiental/types";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FREQUENCIES: FadMonitoringFrequency[] = [
  "manual",
  "monthly",
  "bimonthly",
  "quarterly",
  "semiannual",
  "annual",
];

export function FadMonitoramentoClient() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [rules, setRules] = React.useState<FadMonitoringRuleDto[]>([]);
  const [runs, setRuns] = React.useState<FadMonitoringRunDto[]>([]);
  const [ruleName, setRuleName] = React.useState("Vigilância padrão");
  const [frequency, setFrequency] = React.useState<FadMonitoringFrequency>("manual");
  const [loading, setLoading] = React.useState(true);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

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

  const reload = React.useCallback(async (wsId: string) => {
    const token = await getFadAuthToken();
    const [rulesRes, runsRes] = await Promise.all([
      listMonitoringRules(token, wsId),
      listMonitoringRuns(token, wsId),
    ]);
    if (rulesRes.ok) setRules(rulesRes.data);
    if (runsRes.ok) setRuns(runsRes.data);
  }, []);

  React.useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    reload(workspaceId).finally(() => setLoading(false));
  }, [workspaceId, reload]);

  const handleCreateRule = async () => {
    if (!workspaceId || !ruleName.trim()) return;
    setCreating(true);
    try {
      const token = await getFadAuthToken();
      const res = await createMonitoringRule(token, workspaceId, {
        name: ruleName.trim(),
        frequency,
      });
      if (!res.ok) {
        toast({ variant: "destructive", title: "Erro", description: res.error });
        return;
      }
      await reload(workspaceId);
      toast({ title: "Regra criada." });
    } finally {
      setCreating(false);
    }
  };

  const handleRun = async (ruleId: string) => {
    setRunningId(ruleId);
    try {
      const token = await getFadAuthToken();
      const res = await runMonitoring(token, workspaceId, ruleId);
      if (!res.ok) {
        toast({ variant: "destructive", title: "Erro", description: res.error });
        return;
      }
      await reload(workspaceId);
      const level = res.data.summary?.alertLevel ?? "none";
      toast({
        title: "Ciclo concluído",
        description: ALERT_LEVEL_LABELS[level as keyof typeof ALERT_LEVEL_LABELS] ?? level,
      });
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (ruleId: string) => {
    const token = await getFadAuthToken();
    const res = await deleteMonitoringRule(token, workspaceId, ruleId);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erro", description: res.error });
      return;
    }
    await reload(workspaceId);
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
          <h1 className="text-xl font-semibold">Monitoramento</h1>
          <p className="text-sm text-muted-foreground">
            Vigilância periódica (INPE → mudanças → achados). Regras não-manuais podem correr
            automaticamente via Cloud Scheduler — ver Configurações.
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
        <AlertTitle>Execução manual</AlertTitle>
        <AlertDescription>{MONITORING_DISCLAIMER}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Nova regra</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input
              className="w-[200px]"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Frequência (referência)</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as FadMonitoringFrequency)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FREQUENCY_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateRule} disabled={creating}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Criar regra
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Regras activas</h2>
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma regra. Crie uma acima.</p>
        ) : (
          <ul className="space-y-2">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {FREQUENCY_LABELS[rule.frequency as FadMonitoringFrequency]}
                    {rule.lastRunAt ? ` · Última: ${rule.lastRunAt.slice(0, 10)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRun(rule.id)}
                    disabled={runningId === rule.id || !rule.enabled}
                  >
                    {runningId === rule.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Executar agora
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => handleDelete(rule.id)}
                    aria-label="Remover regra"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Histórico de execuções</h2>
          <Link href={`${FAD_ROUTE_BASE}/fiscalizacao`} className="text-sm text-primary underline">
            Ver achados
          </Link>
        </div>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma execução ainda.</p>
        ) : (
          <ul className="space-y-2">
            {runs.map((run) => {
              const level =
                (run.summary?.alertLevel as FadMonitoringAlertLevel | undefined) ?? "none";
              return (
                <li key={run.id} className="rounded-md border px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn("h-2.5 w-2.5 rounded-full", ALERT_LEVEL_COLORS[level])}
                      aria-hidden
                    />
                    <span className="font-medium">
                      {ALERT_LEVEL_LABELS[level]}
                    </span>
                    <span className="text-muted-foreground">· {run.startedAt.slice(0, 16).replace("T", " ")}</span>
                    <span className="text-muted-foreground">· {run.status}</span>
                  </div>
                  {run.summary?.latestDate && run.summary.previousDate ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Comparado {run.summary.previousDate} → {run.summary.latestDate}
                      {run.summary.openFindings != null
                        ? ` · ${run.summary.openFindings} achado(s) aberto(s)`
                        : ""}
                    </p>
                  ) : null}
                  {run.steps?.length ? (
                    <ul className="mt-2 text-xs text-muted-foreground">
                      {run.steps.map((s, i) => (
                        <li key={i}>
                          {s.step}: {s.status}
                          {s.message ? ` — ${s.message}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
