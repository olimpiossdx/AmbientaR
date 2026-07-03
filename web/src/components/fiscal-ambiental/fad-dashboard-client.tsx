"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FileText,
  Image,
  Loader2,
  MapPin,
  Plus,
  Radar,
  Satellite,
} from "lucide-react";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FAD_ROUTE_BASE } from "@/lib/fiscal-ambiental/constants";
import { fetchFadDashboardStats, listFadWorkspaces } from "@/lib/fiscal-ambiental/fad-api-client";
import type { FadDashboardStats, FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { Badge } from "@/components/ui/badge";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const inner = (
    <Card className={href ? "transition-colors hover:bg-muted/40" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }

  return inner;
}

function formatMosaicDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function FadDashboardClient() {
  const { user, isInitialized } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);
  const [stats, setStats] = React.useState<FadDashboardStats | null>(null);

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
        const [wsResult, statsResult] = await Promise.all([
          listFadWorkspaces(token),
          fetchFadDashboardStats(token),
        ]);
        if (!wsResult.ok) throw new Error(wsResult.error);
        if (!statsResult.ok) throw new Error(statsResult.error);
        if (!cancelled) {
          setWorkspaces(wsResult.data);
          setStats(statsResult.data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro ao carregar imóveis.");
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
        A carregar imóveis…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fiscal Ambiental Digital</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Acervo satelital INPE/CBERS, comparação temporal, inteligência ambiental, fiscalização
            preventiva, relatórios e auditoria ESG — por imóvel.
          </p>
        </div>
        <Button asChild>
          <Link href={`${FAD_ROUTE_BASE}/workspace/novo`}>
            <Plus className="mr-2 h-4 w-4" />
            Novo imóvel
          </Link>
        </Button>
      </div>

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Imóveis"
            value={stats.workspaceCount}
            icon={MapPin}
          />
          <StatCard
            label="Imagens prontas"
            value={stats.readyMosaicCount}
            hint={
              stats.totalMosaicCount > stats.readyMosaicCount
                ? `${stats.totalMosaicCount} no total (incl. processamento)`
                : undefined
            }
            icon={Satellite}
            href={`${FAD_ROUTE_BASE}/biblioteca`}
          />
          <StatCard
            label="Última imagem"
            value={formatMosaicDate(stats.lastMosaicDate)}
            icon={Image}
            href={`${FAD_ROUTE_BASE}/linha-do-tempo`}
          />
          <StatCard
            label="Achados abertos"
            value={stats.openFindingsCount}
            icon={AlertTriangle}
            href={`${FAD_ROUTE_BASE}/fiscalizacao`}
          />
          <StatCard
            label="Análises de mudança"
            value={stats.changeAnalysisCount}
            icon={Radar}
            href={`${FAD_ROUTE_BASE}/inteligencia`}
          />
          <StatCard
            label="Evidências"
            value={stats.evidenceCount}
            icon={Image}
            href={`${FAD_ROUTE_BASE}/evidencias`}
          />
          <StatCard
            label="Monitoramentos"
            value={stats.monitoringRuleCount}
            icon={Radar}
            href={`${FAD_ROUTE_BASE}/monitoramento`}
          />
          <StatCard
            label="Relatórios"
            value={stats.reportCount}
            icon={FileText}
            href={`${FAD_ROUTE_BASE}/relatorios`}
          />
        </div>
      ) : null}

      {workspaces.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Satellite className="h-5 w-5" />
              Comece por aqui
            </CardTitle>
            <CardDescription>
              Ainda não há imóveis registados. Crie um workspace com o perímetro da propriedade e
              monte o acervo histórico.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`${FAD_ROUTE_BASE}/workspace/novo`}>
                <MapPin className="mr-2 h-4 w-4" />
                Definir área do imóvel
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`${FAD_ROUTE_BASE}/montar-acervo`}>Montar acervo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Seus imóveis</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <li key={ws.id}>
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{ws.name}</CardTitle>
                      <Badge variant={ws.aoi ? "default" : "secondary"}>
                        {ws.aoi ? "Área definida" : "Rascunho"}
                      </Badge>
                    </div>
                    {ws.areaHa != null ? (
                      <CardDescription>{ws.areaHa.toLocaleString("pt-BR")} ha</CardDescription>
                    ) : (
                      <CardDescription>Sem perímetro</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${FAD_ROUTE_BASE}/workspace/${ws.id}`}>Editar área</Link>
                    </Button>
                    {ws.aoi ? (
                      <Button asChild size="sm">
                        <Link href={`${FAD_ROUTE_BASE}/montar-acervo?workspace=${ws.id}`}>
                          Montar acervo
                        </Link>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
