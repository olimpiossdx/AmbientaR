"use client";

import * as React from "react";
import { Check, Loader2, X } from "lucide-react";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useAuth } from "@/firebase";
import { fetchFadModuleSettings } from "@/lib/fiscal-ambiental/fad-api-client";
import type { FadModuleSettings } from "@/lib/fiscal-ambiental/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FLAG_LABELS: Record<keyof FadModuleSettings["flags"], string> = {
  ENABLE_ARCHIVE_BUILD: "Montagem de acervo",
  ENABLE_INPE_CBERS: "Catálogo INPE/CBERS",
  ENABLE_TIMELINE: "Linha do tempo",
  ENABLE_COMPARISON: "Comparador",
  ENABLE_INTELLIGENCE: "Inteligência ambiental",
  ENABLE_FISCAL_CHECKS: "Fiscalização preventiva",
  ENABLE_REPORTS: "Relatórios PDF",
  ENABLE_MONITORING: "Monitoramento",
  ENABLE_ESG: "Auditoria ESG",
};

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      {ok ? (
        <Badge variant="default" className="shrink-0 gap-1">
          <Check className="h-3 w-3" />
          Ativo
        </Badge>
      ) : (
        <Badge variant="secondary" className="shrink-0 gap-1">
          <X className="h-3 w-3" />
          Inativo
        </Badge>
      )}
    </div>
  );
}

export function FadConfiguracoesClient() {
  const { user, isInitialized } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState<FadModuleSettings | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!isInitialized) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user) {
          setError("Faça login para continuar.");
          return;
        }
        const token = await getFadAuthToken();
        const result = await fetchFadModuleSettings(token);
        if (!result.ok) throw new Error(result.error);
        if (!cancelled) setSettings(result.data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro ao carregar configurações.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isInitialized]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar configurações…
      </div>
    );
  }

  if (error || !settings) {
    return <p className="text-sm text-destructive">{error ?? "Configurações indisponíveis."}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Estado do módulo Fiscal Ambiental Digital neste ambiente. Alterações de infraestrutura
          (workers, flags de ambiente) são feitas pelo administrador do deploy.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ambiente</CardTitle>
            <CardDescription>Módulo e modo de operação</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            <StatusRow label="Fiscal Ambiental Digital" ok={settings.enabled} />
            <StatusRow
              label="Modo standalone"
              ok={settings.standaloneMode}
              detail="Dados isolados em fad_workspaces, sem CRM."
            />
            <StatusRow
              label="Cruzamento SIG"
              ok={settings.sigCrosscheckEnabled}
              detail="FAD_ENABLE_SIG_CROSSCHECK — PRODES, MapBiomas Alerta, embargos IBAMA."
            />
            <StatusRow
              label="Scheduler de monitoramento"
              ok={settings.monitoringCronConfigured}
              detail="FAD_MONITORING_CRON_SECRET → POST /api/fiscal-ambiental/monitoring/scheduler/run"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workers opcionais</CardTitle>
            <CardDescription>
              Sem URL configurada, o processamento corre em modo inline na API.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            <StatusRow
              label="Worker satelital (GDAL)"
              ok={settings.satelliteWorkerConfigured}
              detail="FISCAL_SATELLITE_WORKER_URL"
            />
            <StatusRow
              label="Worker de inteligência"
              ok={settings.intelligenceWorkerConfigured}
              detail="FISCAL_INTELLIGENCE_WORKER_URL"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Funcionalidades activas</CardTitle>
            <CardDescription>Flags de produto no código (FISCAL_AMBIENTAL_FLAGS)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.entries(settings.flags) as [keyof typeof settings.flags, boolean][]).map(
                ([key, enabled]) => (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{FLAG_LABELS[key]}</span>
                    <Badge variant={enabled ? "default" : "secondary"}>
                      {enabled ? "Sim" : "Não"}
                    </Badge>
                  </li>
                ),
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Atribuição e evidência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Imagens e relatórios devem citar a fonte <strong>{settings.attribution}</strong> conforme
              os termos do INPE.
            </p>
            <p>
              Os achados e scores ESG são indicativos para apoio à decisão — não substituem vistoria
              presencial nem parecer técnico vinculante.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
