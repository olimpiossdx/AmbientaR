"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { OpportunityStage } from "@/lib/types";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STAGE_COLORS: Record<OpportunityStage, string> = {
  Qualificação: "hsl(var(--chart-1))",
  Proposta: "hsl(var(--chart-2))",
  Negociação: "hsl(var(--chart-3))",
  "Fechado Ganho": "hsl(var(--chart-4))",
  "Fechado Perdido": "hsl(var(--chart-5))",
};

export type CrmReportsChartsProps = {
  isLoading: boolean;
  pipelineByStage: { stage: OpportunityStage; count: number; value: number }[];
  closedWonBySeller: { vendedor: string; Receita: number }[];
  closedWonByClient: { cliente: string; Receita: number }[];
  formatCurrency: (value: number) => string;
};

export default function CrmReportsCharts({
  isLoading,
  pipelineByStage,
  closedWonBySeller,
  closedWonByClient,
  formatCurrency,
}: CrmReportsChartsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Pipeline por fase (quantidade)
            </CardTitle>
            <CardDescription>Distribuição das oportunidades por fase.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie data={pipelineByStage} dataKey="count" nameKey="stage" outerRadius={110} label>
                    {pipelineByStage.map((entry) => (
                      <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            )}
            {!isLoading && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pipelineByStage.map((s) => (
                  <Badge key={s.stage} variant="outline" className={cn("")}>
                    {s.stage}: {s.count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Receita por vendedor (Top 10)
            </CardTitle>
            <CardDescription>Fechado ganho no período selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : closedWonBySeller.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                Nenhuma venda fechada no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={closedWonBySeller} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vendedor" fontSize={11} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} fontSize={12} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="Receita" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Receita por cliente (Top 10)
            </CardTitle>
            <CardDescription>Fechado ganho no período selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : closedWonByClient.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                Nenhuma venda fechada no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={closedWonByClient} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cliente" fontSize={11} tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} fontSize={12} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resumo do pipeline (valores)</CardTitle>
            <CardDescription>Valor total por fase (todas as oportunidades).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {pipelineByStage.map((s) => (
                  <div key={s.stage} className="flex items-center justify-between rounded-md border p-2">
                    <div className="text-sm font-medium">{s.stage}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(s.value)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
