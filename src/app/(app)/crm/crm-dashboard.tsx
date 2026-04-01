"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  Handshake,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useAuth,
} from "@/firebase";
import { collection } from "firebase/firestore";
import type { Opportunity, Client, AppUser } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";

const PERIOD_PRESETS = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "Últimos 7 dias" },
  { id: "30d", label: "Últimos 30 dias" },
  { id: "90d", label: "Últimos 90 dias" },
  { id: "12m", label: "Últimos 12 meses" },
  { id: "custom", label: "Customizado" },
] as const;

function toPeriodStartTs(dateStr: string | null | undefined) {
  if (!dateStr) return 0;
  return new Date(`${dateStr}T00:00:00.000Z`).getTime();
}

function toPeriodEndTs(dateStr: string | null | undefined) {
  if (!dateStr) return Date.now();
  return new Date(`${dateStr}T23:59:59.999Z`).getTime();
}

function getPeriodRange(
  preset: string,
  customStart: string,
  customEnd: string,
): { startTs: number; endTs: number; label: string } {
  const now = new Date();
  const end = now;
  const start = new Date(now);

  if (preset === "today") {
    const tsStart = start.setHours(0, 0, 0, 0);
    return { startTs: tsStart, endTs: end.getTime(), label: "Hoje" };
  }

  if (preset === "7d") {
    start.setDate(start.getDate() - 7);
    return {
      startTs: start.getTime(),
      endTs: end.getTime(),
      label: "Últimos 7 dias",
    };
  }

  if (preset === "30d") {
    start.setDate(start.getDate() - 30);
    return {
      startTs: start.getTime(),
      endTs: end.getTime(),
      label: "Últimos 30 dias",
    };
  }

  if (preset === "90d") {
    start.setDate(start.getDate() - 90);
    return {
      startTs: start.getTime(),
      endTs: end.getTime(),
      label: "Últimos 90 dias",
    };
  }

  if (preset === "12m") {
    start.setMonth(start.getMonth() - 12);
    return {
      startTs: start.getTime(),
      endTs: end.getTime(),
      label: "Últimos 12 meses",
    };
  }

  // custom
  const startTs = toPeriodStartTs(customStart);
  const endTs = toPeriodEndTs(customEnd);
  const label =
    customStart && customEnd
      ? `Custom: ${customStart} → ${customEnd}`
      : "Customizado";
  return { startTs, endTs, label };
}

export type CrmDashboardProps = {
  onAddNew?: () => void;
};

export default function CrmDashboard({ onAddNew }: CrmDashboardProps) {
  const [periodPreset, setPeriodPreset] = useState<
    "today" | "7d" | "30d" | "90d" | "12m" | "custom"
  >("30d");
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );

  const [sellerFilter, setSellerFilter] = useState<string>("");
  const [ufFilter, setUfFilter] = useState<string>("");
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useAuth();

  const opportunitiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "opportunities");
  }, [firestore, user]);

  const { data: opportunities, isLoading: isLoadingOpps } =
    useCollection<Opportunity>(opportunitiesQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "clients");
  }, [firestore, user]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users");
  }, [firestore, user]);

  const { data: clients, isLoading: isLoadingClients } =
    useCollection<Client>(clientsQuery);
  const { data: users } = useCollection<AppUser>(usersQuery);
  const clientsMap = useMemo(
    () => new Map(clients?.map((c) => [c.id, c.name])),
    [clients],
  );
  const usersMap = useMemo(
    () =>
      new Map(users?.map((u) => [u.id, u.name || u.email || "Sem nome"]) ?? []),
    [users],
  );

  const sellers = useMemo(() => {
    const list = users ?? [];
    return list
      .filter((u) =>
        ["admin", "sales", "supervisor", "financial"].includes(u.role),
      )
      .map((u) => ({ id: u.id, name: u.name || u.email || "Sem nome" }));
  }, [users]);

  const clientsUfMap = useMemo(() => {
    const map = new Map<string, string>();
    (clients ?? []).forEach((c) => {
      map.set(c.id, c.uf || "");
    });
    return map;
  }, [clients]);

  const ufOptions = useMemo(() => {
    const set = new Set<string>();
    (clients ?? []).forEach((c) => {
      if (c.uf) set.add(c.uf);
    });
    return Array.from(set).sort();
  }, [clients]);

  const { periodStart, periodEnd, periodLabel } = useMemo(() => {
    return getPeriodRange(periodPreset, customStart, customEnd);
  }, [periodPreset, customStart, customEnd]);

  const opportunitiesFiltered = useMemo(() => {
    if (!opportunities) return [];
    const list = opportunities ?? [];
    return list.filter((opp) => {
      const closeTs = opp.closeDate ? new Date(opp.closeDate).getTime() : NaN;
      if (!Number.isFinite(closeTs)) return false;
      if (closeTs < periodStart || closeTs > periodEnd) return false;

      if (sellerFilter && opp.assignedTo !== sellerFilter) return false;
      if (ufFilter) {
        const uf = clientsUfMap.get(opp.clientId) || "";
        if (uf !== ufFilter) return false;
      }

      return true;
    });
  }, [
    opportunities,
    periodStart,
    periodEnd,
    sellerFilter,
    ufFilter,
    clientsUfMap,
  ]);

  const crmStats = useMemo(() => {
    if (!opportunities) {
      return {
        qualificacao: 0,
        proposta: 0,
        negociacao: 0,
        totalValue: 0,
        recent: [] as Opportunity[],
        totalClosedWon: 0,
        totalClosedWonValue: 0,
        totalClosedWonValueInPeriod: 0,
        closedLostCount: 0,
        conversionRate: 0,
        avgTicket: 0,
      };
    }

    const stats = {
      qualificacao: 0,
      proposta: 0,
      negociacao: 0,
      totalValue: 0,
      totalClosedWon: 0,
      totalClosedWonValue: 0,
      totalClosedWonValueInPeriod: 0,
      closedLostCount: 0,
      conversionRate: 0,
      avgTicket: 0,
    };

    opportunitiesFiltered.forEach((opp) => {
      switch (opp.stage) {
        case "Qualificação":
          stats.qualificacao++;
          break;
        case "Proposta":
          stats.proposta++;
          break;
        case "Negociação":
          stats.negociacao++;
          stats.totalValue += opp.value || 0;
          break;
        case "Fechado Ganho":
          stats.totalClosedWon++;
          stats.totalClosedWonValue += opp.value || 0;
          stats.totalClosedWonValueInPeriod += opp.value || 0;
          break;
        case "Fechado Perdido":
          stats.closedLostCount++;
          break;
      }
    });

    const totalCreated = opportunitiesFiltered.length || 1;
    stats.conversionRate = Math.round(
      (stats.totalClosedWon / totalCreated) * 100,
    );
    stats.avgTicket =
      stats.totalClosedWon > 0
        ? stats.totalClosedWonValue / stats.totalClosedWon
        : 0;

    const recentOpportunities = [...opportunitiesFiltered]
      .filter(
        (opp) =>
          opp.stage !== "Fechado Ganho" && opp.stage !== "Fechado Perdido",
      )
      .sort(
        (a, b) =>
          new Date(b.closeDate || 0).getTime() -
          new Date(a.closeDate || 0).getTime(),
      )
      .slice(0, 8);

    return {
      ...stats,
      recent: recentOpportunities,
    };
  }, [opportunities, opportunitiesFiltered]);

  const pipelineChartData = useMemo(() => {
    const stages: Opportunity["stage"][] = [
      "Qualificação",
      "Proposta",
      "Negociação",
      "Fechado Ganho",
      "Fechado Perdido",
    ];
    const base = opportunitiesFiltered ?? [];
    return [
      ...stages.map((stage) => {
        const items = base.filter((o) => o.stage === stage);
        const valor = items.reduce((s, o) => s + (o.value || 0), 0);
        const count = items.length;
        return { stage, valor, count };
      }),
    ];
  }, [opportunitiesFiltered]);

  const revenueBySellerData = useMemo(() => {
    const closedWon = (opportunitiesFiltered ?? []).filter(
      (o) => o.stage === "Fechado Ganho",
    );
    const bySeller = new Map<string, number>();
    closedWon.forEach((o) => {
      const key = o.assignedTo || "__na__";
      bySeller.set(key, (bySeller.get(key) || 0) + (o.value || 0));
    });
    return Array.from(bySeller.entries())
      .map(([uid, valor]) => ({
        vendedor: uid === "__na__" ? "Não atribuído" : usersMap.get(uid) || uid,
        Receita: valor,
      }))
      .sort((a, b) => b.Receita - a.Receita)
      .slice(0, 10);
  }, [opportunitiesFiltered, usersMap]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const getStageVariant = (stage: Opportunity["stage"]) => {
    switch (stage) {
      case "Qualificação":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "Proposta":
        return "bg-purple-500/20 text-purple-700 border-purple-500/30";
      case "Negociação":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
      case "Fechado Ganho":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
      case "Fechado Perdido":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-700 border-slate-500/30";
    }
  };

  const isLoading = isLoadingOpps || isLoadingClients;

  if (
    !user ||
    !["admin", "sales", "supervisor", "financial"].includes(user.role)
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Você não tem permissão para visualizar o painel de vendas.</p>
        </CardContent>
      </Card>
    );
  }

  const hasNoData =
    !isLoading && (!opportunities || opportunities.length === 0);

  return (
    <div className="space-y-6">
      {/* Filtros e ações */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          {PERIOD_PRESETS.map((p) => (
            <Button
              key={p.id}
              variant={periodPreset === p.id ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriodPreset(p.id)}
            >
              {p.label}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            ({periodLabel})
          </span>

          {periodPreset === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <input
                type="date"
                className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Vendedor (todos)</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={ufFilter}
            onChange={(e) => setUfFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Região (UF - todas)</option>
            {ufOptions.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar dados
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const list = opportunitiesFiltered ?? [];
              const csvEscape = (v: unknown) => {
                const s = String(v ?? "");
                const needsQuotes = /[",\n]/.test(s);
                return needsQuotes ? `"${s.replace(/"/g, '""')}"` : s;
              };
              const header = [
                "Oportunidade",
                "Cliente",
                "Vendedor",
                "Valor",
                "Fase",
                "Fechamento",
              ]
                .map(csvEscape)
                .join(",");
              const rows = list.map((opp) => {
                const clientName = clientsMap.get(opp.clientId) || "N/A";
                const sellerName =
                  (opp.assignedTo && usersMap.get(opp.assignedTo)) ||
                  "Não atribuído";
                return [
                  opp.name,
                  clientName,
                  sellerName,
                  opp.value ?? 0,
                  opp.stage,
                  opp.closeDate,
                ]
                  .map(csvEscape)
                  .join(",");
              });
              const csv = [header, ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download =
                `crm-dashboard-${periodPreset}-${customStart}-${customEnd}.csv`.replace(
                  /[:]/g,
                  "",
                );
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Exportar CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const list = opportunitiesFiltered ?? [];
              const doc = new jsPDF({ unit: "mm", format: "a4" });
              let y = 15;
              doc.setFontSize(16);
              doc.text("Dashboard Executivo CRM", 105, y, { align: "center" });
              y += 10;
              doc.setFontSize(10);
              doc.text(`Período: ${periodLabel}`, 15, y);
              y += 6;
              doc.text(
                `Receita (Fechado Ganho) no período: ${formatCurrency(crmStats.totalClosedWonValueInPeriod)}`,
                15,
                y,
              );
              y += 6;
              doc.text(
                `Oportunidades ativas (Qualificação + Proposta + Negociação): ${crmStats.qualificacao + crmStats.proposta + crmStats.negociacao}`,
                15,
                y,
              );
              y += 6;
              doc.text(`Taxa de conversão: ${crmStats.conversionRate}%`, 15, y);
              y += 6;
              doc.text(
                `Ticket médio (fechado ganho): ${formatCurrency(crmStats.avgTicket)}`,
                15,
                y,
              );
              y += 8;

              doc.setFontSize(11);
              doc.text("Pipeline por fase (valores)", 15, y);
              y += 6;
              const pipelineLines = pipelineChartData.map(
                (p) => `${p.stage}: ${formatCurrency(p.valor)}`,
              );
              pipelineLines.slice(0, 5).forEach((line) => {
                doc.setFontSize(10);
                doc.text(line, 15, y);
                y += 5;
              });

              y += 3;
              doc.setFontSize(11);
              doc.text("Oportunidades (amostra)", 15, y);
              y += 7;
              const sample = [...list]
                .filter(
                  (o) =>
                    o.stage !== "Fechado Ganho" &&
                    o.stage !== "Fechado Perdido",
                )
                .sort(
                  (a, b) =>
                    new Date(b.closeDate || 0).getTime() -
                    new Date(a.closeDate || 0).getTime(),
                )
                .slice(0, 10);
              sample.forEach((o) => {
                const clientName = clientsMap.get(o.clientId) || "N/A";
                const valueStr = formatCurrency(o.value ?? 0);
                doc.setFontSize(9);
                doc.text(
                  `${o.name} (${clientName}) - ${o.stage} - ${valueStr}`,
                  15,
                  y,
                  { maxWidth: 180 },
                );
                y += 5;
              });

              doc.save(
                `crm-dashboard-${periodLabel.replace(/[\\s:]/g, "-")}.pdf`,
              );
            }}
          >
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Empty state quando não há oportunidades */}
      {hasNoData && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">
              Nenhuma oportunidade cadastrada
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Comece criando sua primeira oportunidade para acompanhar o
              pipeline de vendas.
            </p>
            {onAddNew && (
              <Button className="mt-4 gap-2" onClick={onAddNew}>
                <PlusCircle className="h-4 w-4" />
                Nova Oportunidade
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!hasNoData && (
        <>
          {/* Linha de KPIs principais */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita no período
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-2/3" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatCurrency(crmStats.totalClosedWonValueInPeriod)}
                    </span>
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Valor fechado ganho no período selecionado.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Em negociação
                </CardTitle>
                <DollarSign className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-2/3" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {formatCurrency(crmStats.totalValue)}
                    </span>
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Valor total das oportunidades em negociação.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Oportunidades ativas
                </CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-1/2" />
                ) : (
                  <div className="text-2xl font-bold">
                    {crmStats.qualificacao +
                      crmStats.proposta +
                      crmStats.negociacao}
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Soma de leads em qualificação, propostas e negociações.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de conversão
                </CardTitle>
                {crmStats.conversionRate >= 30 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-1/3" />
                ) : (
                  <div className="text-2xl font-bold">
                    {crmStats.conversionRate}%
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Proporção de oportunidades fechadas como ganho em relação ao
                  total criado.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ticket médio (fechadas ganho)
                </CardTitle>
                <Handshake className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-2/3" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(crmStats.avgTicket)}
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Valor médio das oportunidades fechadas como ganho.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Valor por fase do pipeline
                </CardTitle>
                <CardDescription>
                  Valor total das oportunidades em cada fase ativa.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={pipelineChartData}
                      layout="vertical"
                      margin={{ left: 8, right: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatCurrency(v)}
                        fontSize={12}
                      />
                      <YAxis
                        type="category"
                        dataKey="stage"
                        width={100}
                        fontSize={12}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar
                        dataKey="valor"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                        name="Valor"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Receita por vendedor (período)
                </CardTitle>
                <CardDescription>
                  Valor fechado ganho no período selecionado, por responsável.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : revenueBySellerData.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                    Nenhuma venda fechada no período.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={revenueBySellerData}
                      margin={{ left: 8, right: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="vendedor"
                        fontSize={11}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        tickFormatter={(v) => formatCurrency(v)}
                        fontSize={12}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar
                        dataKey="Receita"
                        fill="hsl(var(--chart-2))"
                        radius={[4, 4, 0, 0]}
                        name="Receita"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela de oportunidades recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Oportunidades Recentes</CardTitle>
              <CardDescription>
                As últimas oportunidades ativas no pipeline. Clique em uma linha
                para editar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oportunidade</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Valor
                    </TableHead>
                    <TableHead>Fase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Skeleton className="h-5 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-28 rounded-full" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading &&
                    crmStats.recent.map((opp) => (
                      <TableRow
                        key={opp.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/crm/${opp.id}/edit`)}
                      >
                        <TableCell className="font-medium">
                          {opp.name}
                        </TableCell>
                        <TableCell>
                          {clientsMap.get(opp.clientId) || "N/A"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatCurrency(opp.value ?? 0)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(getStageVariant(opp.stage))}
                          >
                            {opp.stage}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && crmStats.recent.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhuma oportunidade ativa no pipeline.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
