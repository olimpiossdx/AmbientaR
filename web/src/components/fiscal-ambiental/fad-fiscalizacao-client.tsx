"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Archive, CheckCircle2, Loader2, Plus, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FAD_ROUTE_BASE } from "@/lib/fiscal-ambiental/constants";
import {
  createManualFinding,
  fetchFadModuleSettings,
  listFadWorkspaces,
  listFiscalFindings,
  runFiscalChecks,
  runSigCrosscheck,
  updateFiscalFinding,
  type FadFiscalFindingDto,
} from "@/lib/fiscal-ambiental/fad-api-client";
import {
  FAD_FISCAL_DISCLAIMER,
  FINDING_STATUS_LABELS,
  FINDING_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_SEMAPHORE,
} from "@/lib/fiscal-ambiental/fiscal-finding-labels";
import type { FadFiscalFindingType, FadFiscalSeverity } from "@/lib/fiscal-ambiental/types";
import type { FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function countOpenBySeverity(findings: FadFiscalFindingDto[], severity: string) {
  return findings.filter(
    (f) =>
      (f.status === "open" || f.status === "under_review") && f.severity === severity,
  ).length;
}

export function FadFiscalizacaoClient() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [findings, setFindings] = React.useState<FadFiscalFindingDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<"open" | "all">("open");
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualTitle, setManualTitle] = React.useState("");
  const [manualBody, setManualBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [sigEnabled, setSigEnabled] = React.useState(false);
  const [sigRunning, setSigRunning] = React.useState(false);

  const loadFindings = React.useCallback(async (wsId: string) => {
    const token = await getFadAuthToken();
    const res = await listFiscalFindings(token, wsId);
    if (res.ok) setFindings(res.data);
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const token = await getFadAuthToken();
        const settingsRes = await fetchFadModuleSettings(token);
        if (settingsRes.ok) setSigEnabled(settingsRes.data.sigCrosscheckEnabled);
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
    loadFindings(workspaceId);
  }, [workspaceId, loadFindings]);

  const visible = findings.filter((f) =>
    statusFilter === "open" ? f.status === "open" || f.status === "under_review" : true,
  );

  const handleStatus = async (
    finding: FadFiscalFindingDto,
    status: "under_review" | "dismissed" | "open",
    dismissedReason?: string,
  ) => {
    const token = await getFadAuthToken();
    const res = await updateFiscalFinding(token, workspaceId, finding.id, {
      status,
      dismissedReason,
    });
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erro", description: res.error });
      return;
    }
    await loadFindings(workspaceId);
  };

  const handleManual = async () => {
    if (!workspaceId || !manualTitle.trim() || !manualBody.trim()) return;
    setSaving(true);
    try {
      const token = await getFadAuthToken();
      const res = await createManualFinding(token, workspaceId, {
        title: manualTitle.trim(),
        description: manualBody.trim(),
      });
      if (!res.ok) {
        toast({ variant: "destructive", title: "Erro", description: res.error });
        return;
      }
      setManualOpen(false);
      setManualTitle("");
      setManualBody("");
      await loadFindings(workspaceId);
      toast({ title: "Observação registada." });
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
          <h1 className="text-xl font-semibold">Fiscalização preventiva</h1>
          <p className="text-sm text-muted-foreground">
            Achados a partir de análises de mudança e observações manuais.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
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
          <Dialog open={manualOpen} onOpenChange={setManualOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Observação manual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova observação</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Título</Label>
                  <Input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Descrição</Label>
                  <Textarea
                    value={manualBody}
                    onChange={(e) => setManualBody(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleManual} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Indícios visuais</AlertTitle>
        <AlertDescription>{FAD_FISCAL_DISCLAIMER}</AlertDescription>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(["low", "medium", "high", "critical"] as const).map((sev) => {
          const sem = SEVERITY_SEMAPHORE[sev];
          return (
            <Card key={sev}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {SEVERITY_LABELS[sev]} · abertos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span
                  className={cn(
                    "inline-flex rounded-md border px-2 py-1 text-2xl font-semibold",
                    sem.bg,
                    sem.text,
                    sem.border,
                  )}
                >
                  {countOpenBySeverity(findings, sev)}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "open" | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Abertos / em análise</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="secondary"
          disabled={syncing || !workspaceId}
          onClick={async () => {
            if (!workspaceId) return;
            setSyncing(true);
            try {
              const token = await getFadAuthToken();
              const res = await runFiscalChecks(token, workspaceId);
              if (!res.ok) {
                toast({ variant: "destructive", title: "Erro", description: res.error });
                return;
              }
              await loadFindings(workspaceId);
              const sigNote =
                res.data.sigCrosscheck?.enabled && res.data.sigCrosscheck.created > 0
                  ? ` Inclui ${res.data.sigCrosscheck.created} achado(s) SIG (PRODES/MapBiomas).`
                  : "";
              toast({
                title: "Verificação concluída",
                description: `${res.data.created} achado(s) gerado(s).${sigNote}`,
              });
            } finally {
              setSyncing(false);
            }
          }}
        >
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sincronizar análises
        </Button>
        {sigEnabled ? (
          <Button
            size="sm"
            variant="outline"
            disabled={sigRunning || !workspaceId}
            onClick={async () => {
              if (!workspaceId) return;
              setSigRunning(true);
              try {
                const token = await getFadAuthToken();
                const res = await runSigCrosscheck(token, workspaceId);
                if (!res.ok) {
                  toast({ variant: "destructive", title: "SIG", description: res.error });
                  return;
                }
                await loadFindings(workspaceId);
                toast({
                  title: "Cruzamento SIG",
                  description:
                    res.data.created > 0
                      ? `${res.data.prodesAlerts} alerta(s) · ${res.data.created} achado(s) criado(s).`
                      : "Nenhuma coincidência PRODES/MapBiomas/embargo no perímetro.",
                });
              } finally {
                setSigRunning(false);
              }
            }}
          >
            {sigRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Cruzar PRODES/SIG
          </Button>
        ) : null}
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href={`${FAD_ROUTE_BASE}/inteligencia`}>Nova análise em Inteligência →</Link>
        </Button>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum achado neste filtro. Execute uma análise em{" "}
          <Link href={`${FAD_ROUTE_BASE}/inteligencia`} className="text-primary underline">
            Inteligência
          </Link>{" "}
          para gerar indícios automaticamente.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((f) => (
            <li key={f.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{f.title}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border",
                        SEVERITY_SEMAPHORE[f.severity as FadFiscalSeverity].bg,
                        SEVERITY_SEMAPHORE[f.severity as FadFiscalSeverity].text,
                        SEVERITY_SEMAPHORE[f.severity as FadFiscalSeverity].border,
                      )}
                    >
                      {SEVERITY_LABELS[f.severity as FadFiscalSeverity]}
                    </Badge>
                    <Badge variant="secondary">
                      {FINDING_STATUS_LABELS[f.status as keyof typeof FINDING_STATUS_LABELS]}
                    </Badge>
                    <Badge variant="outline">
                      {FINDING_TYPE_LABELS[f.type as FadFiscalFindingType]}
                    </Badge>
                    {f.source === "sig_crosscheck" ? (
                      <Badge variant="secondary">SIG</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                  {f.areaHa != null ? (
                    <p className="text-xs text-muted-foreground">~{f.areaHa.toFixed(2)} ha</p>
                  ) : null}
                  {f.changeAnalysisId ? (
                    <p className="text-xs text-muted-foreground">
                      Origem: análise de mudança · {f.changeAnalysisId.slice(0, 8)}…
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {f.status === "open" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatus(f, "under_review")}
                    >
                      <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                      Em análise
                    </Button>
                  ) : null}
                  {f.status !== "dismissed" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleStatus(f, "dismissed", "Arquivado pelo utilizador")
                      }
                    >
                      <Archive className="mr-1 h-3.5 w-3.5" />
                      Arquivar
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => handleStatus(f, "open")}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Reabrir
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
