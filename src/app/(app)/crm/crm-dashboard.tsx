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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
  fetchBrandingImageAsBase64,
  getImageDimensions,
  calcPdfImageSize,
  applyImageOpacity,
} from "@/lib/branding-pdf";
import { useLocalBranding } from "@/hooks/use-local-branding";

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
): {
  startTs: number;
  endTs: number;
  label: string;
} {
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
  const { data: brandingData } = useLocalBranding();

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

  const { startTs: periodStart, endTs: periodEnd, label: periodLabel } = useMemo(() => {
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
    <div className="min-w-0 space-y-6">
      <Card className="min-w-0 overflow-hidden border bg-card/60 shadow-sm">
        <CardHeader className="space-y-1 border-b bg-muted/25 px-4 py-3 sm:px-6">
          <CardTitle className="text-base font-semibold">
            Filtros e exportação
          </CardTitle>
          <CardDescription>
            Período, vendedor e UF; em seguida atualize ou exporte o recorte atual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Período
              </span>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Ativo:</span>{" "}
                <span className="break-words">{periodLabel}</span>
              </p>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {PERIOD_PRESETS.map((p) => (
                <Button
                  key={p.id}
                  variant={periodPreset === p.id ? "default" : "outline"}
                  size="sm"
                  className="h-9 w-full justify-center px-2 text-center text-xs sm:text-sm"
                  onClick={() => setPeriodPreset(p.id)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {periodPreset === "custom" && (
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="crm-period-start" className="text-xs">
                    Data inicial
                  </Label>
                  <input
                    id="crm-period-start"
                    type="date"
                    className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crm-period-end" className="text-xs">
                    Data final
                  </Label>
                  <input
                    id="crm-period-end"
                    type="date"
                    className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid min-w-0 gap-4 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 lg:col-span-5">
              <Label htmlFor="crm-seller" className="text-sm">
                Vendedor
              </Label>
              <select
                id="crm-seller"
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos os vendedores</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 lg:col-span-4">
              <Label htmlFor="crm-uf" className="text-sm">
                Região (UF)
              </Label>
              <select
                id="crm-uf"
                value={ufFilter}
                onChange={(e) => setUfFilter(e.target.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Todas as UFs</option>
                {ufOptions.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end lg:col-span-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="h-9 w-full justify-center gap-1 whitespace-normal sm:w-auto sm:min-w-[10rem]"
              >
                <RefreshCw className="h-4 w-4 shrink-0" />
                Atualizar dados
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full justify-center sm:w-auto sm:min-w-[9rem]"
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
            className="h-9 w-full justify-center sm:w-auto sm:min-w-[9rem]"
            onClick={async () => {
              const list = opportunitiesFiltered ?? [];
              const headerBase64 = await fetchBrandingImageAsBase64(
                brandingData?.headerImageUrl,
              );
              const footerBase64 = await fetchBrandingImageAsBase64(
                brandingData?.footerImageUrl,
              );
              const watermarkBase64Raw = await fetchBrandingImageAsBase64(
                brandingData?.watermarkImageUrl,
              );
              const watermarkBase64 = watermarkBase64Raw
                ? await applyImageOpacity(watermarkBase64Raw, 0.15)
                : null;

              const doc = new jsPDF({ unit: "mm", format: "a4" });
              const pageWidth = doc.internal.pageSize.getWidth();
              const pageHeight = doc.internal.pageSize.getHeight();
              const margin = 15;
              const contentWidth = pageWidth - margin * 2;

              if (watermarkBase64) {
                const imgProps = doc.getImageProperties(watermarkBase64);
                const ar = imgProps.width / imgProps.height;
                const w = 100;
                const h = w / ar;
                doc.addImage(
                  watermarkBase64,
                  "PNG",
                  (pageWidth - w) / 2,
                  (pageHeight - h) / 2,
                  w,
                  h,
                  undefined,
                  "FAST",
                );
              }

              let y = 15;
              if (headerBase64) {
                const dims = await getImageDimensions(headerBase64);
                const { w, h } = calcPdfImageSize(dims, contentWidth, 26);
                doc.addImage(headerBase64, "PNG", margin, 8, w, h);
                y = 8 + h + 5;
              }

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

              if (footerBase64) {
                const fDims = await getImageDimensions(footerBase64);
                const { w: fw, h: fh } = calcPdfImageSize(
                  fDims,
                  pageWidth - 2 * margin,
                  18,
                );
                doc.addImage(
                  footerBase64,
                  "PNG",
                  margin,
                  pageHeight - fh - 6,
                  fw,
                  fh,
                );
              }

              doc.save(
                `crm-dashboard-${periodLabel.replace(/[\\s:]/g, "-")}.pdf`,
              );
            }}
          >
            Exportar PDF
          </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <Card className="min-w-0">
              <CardHeader className="flex min-w-0 flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="min-w-0 flex-1 pr-1 text-sm font-medium leading-snug break-words">
                  Receita no período
                </CardTitle>
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              </CardHeader>
              <CardContent className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-8 w-2/3" />
                ) : (
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="break-words text-xl font-bold tabular-nums sm:text-2xl">
                      {formatCurrency(crmStats.totalClosedWonValueInPeriod)}
                    </span>
                  </div>
                )}
                <p className="mt-1 break-words text-xs leading-snug text-muted-foreground">
                  Valor fechado ganho no período selecionado.
                </p>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="flex min-w-0 flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="min-w-0 flex-1 pr-1 text-sm font-medium leading-snug break-words">
                  Em negociação
                </CardTitle>
                <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              </CardHeader>
              <CardContent className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-8 w-2/3" />
                ) : (
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="break-words text-xl font-bold tabular-nums sm:text-2xl">
                      {formatCurrency(crmStats.totalValue)}
                    </span>
                  </div>
                )}
                <p className="mt-1 break-words text-xs leading-snug text-muted-foreground">
                  Valor total das oportunidades em negociação.
                </p>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="flex min-w-0 flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="min-w-0 flex-1 pr-1 text-sm font-medium leading-snug break-words">
                  Oportunidades ativas
                </CardTitle>
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              </CardHeader>
              <CardContent className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-8 w-1/2" />
                ) : (
                  <div className="text-xl font-bold tabular-nums sm:text-2xl">
                    {crmStats.qualificacao +
                      crmStats.proposta +
                      crmStats.negociacao}
                  </div>
                )}
                <p className="mt-1 break-words text-xs leading-snug text-muted-foreground">
                  Soma de leads em qualificação, propostas e negociações.
                </p>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="flex min-w-0 flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="min-w-0 flex-1 pr-1 text-sm font-medium leading-snug break-words">
                  Taxa de conversão
                </CardTitle>
                {crmStats.conversionRate >= 30 ? (
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                )}
              </CardHeader>
              <CardContent className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-8 w-1/3" />
                ) : (
                  <div className="text-xl font-bold tabular-nums sm:text-2xl">
                    {crmStats.conversionRate}%
                  </div>
                )}
                <p className="mt-1 break-words text-xs leading-snug text-muted-foreground">
                  Proporção de oportunidades fechadas como ganho em relação ao
                  total criado.
                </p>
              </CardContent>
            </Card>

            <Card className="min-w-0 sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex min-w-0 flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="min-w-0 flex-1 pr-1 text-sm font-medium leading-snug break-words">
                  Ticket médio (fechadas ganho)
                </CardTitle>
                <Handshake className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
              </CardHeader>
              <CardContent className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-8 w-2/3" />
                ) : (
                  <div className="text-xl font-bold tabular-nums sm:text-2xl">
                    {formatCurrency(crmStats.avgTicket)}
                  </div>
                )}
                <p className="mt-1 break-words text-xs leading-snug text-muted-foreground">
                  Valor médio das oportunidades fechadas como ganho.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader className="min-w-0 space-y-1.5">
                <CardTitle className="flex min-w-0 items-start gap-2 text-base font-semibold">
                  <BarChart3 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span className="min-w-0 flex-1 leading-snug break-words">
                    Valor por fase do pipeline
                  </span>
                </CardTitle>
                <CardDescription className="break-words">
                  Valor total das oportunidades em cada fase ativa.
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : (
                  <div className="h-[280px] min-h-[240px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
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
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="min-w-0 space-y-1.5">
                <CardTitle className="flex min-w-0 items-start gap-2 text-base font-semibold">
                  <DollarSign className="mt-0.5 h-5 w-5 shrink-0" />
                  <span className="min-w-0 flex-1 leading-snug break-words">
                    Receita por vendedor (período)
                  </span>
                </CardTitle>
                <CardDescription className="break-words">
                  Valor fechado ganho no período selecionado, por responsável.
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : revenueBySellerData.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
                    Nenhuma venda fechada no período.
                  </div>
                ) : (
                  <div className="h-[280px] min-h-[240px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela de oportunidades recentes */}
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Oportunidades Recentes</CardTitle>
              <CardDescription className="break-words">
                As últimas oportunidades ativas no pipeline. Clique em uma linha
                para editar.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 overflow-x-auto">
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
                        <TableCell className="max-w-[min(100%,14rem)] break-words font-medium sm:max-w-none">
                          {opp.name}
                        </TableCell>
                        <TableCell className="max-w-[min(100%,12rem)] break-words sm:max-w-none">
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
