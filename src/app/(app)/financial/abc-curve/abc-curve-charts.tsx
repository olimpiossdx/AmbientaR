"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type AbcCurveParetoPoint = {
  name: string;
  fullName: string;
  valor: number;
  acc: number;
  classe: string;
};

export type AbcCurveBarPoint = {
  name: string;
  fullName: string;
  valor: number;
  fill: string;
};

export type AbcCurveChartsProps = {
  isLoading: boolean;
  hasParetoData: boolean;
  hasBarData: boolean;
  paretoChartData: AbcCurveParetoPoint[];
  topClientsBarData: AbcCurveBarPoint[];
  cutoffA: number;
  cutoffB: number;
  abcProfileLabel: string;
  formatCurrency: (value: number) => string;
};

export default function AbcCurveCharts({
  isLoading,
  hasParetoData,
  hasBarData,
  paretoChartData,
  topClientsBarData,
  cutoffA,
  cutoffB,
  abcProfileLabel,
  formatCurrency,
}: AbcCurveChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Curva de Pareto (ABC)</CardTitle>
          <CardDescription>
            Barras = receita por cliente · Linha = % acumulado. Perfil: {abcProfileLabel}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[380px] w-full" />
          ) : !hasParetoData ? (
            <div className="h-[380px] flex items-center justify-center text-sm text-muted-foreground">
              Nenhum dado para o gráfico.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={paretoChartData} margin={{ top: 12, right: 12, left: 4, bottom: 56 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10 }}
                  height={72}
                />
                <YAxis
                  yAxisId="valor"
                  tickFormatter={(v) => (v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  yAxisId="acc"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "acc" || name === "% acumulado") return [`${value}%`, "% acumulado"];
                    return [formatCurrency(value), "Receita"];
                  }}
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload as { fullName?: string } | undefined;
                    return item?.fullName ? `Cliente: ${item.fullName}` : "";
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <ReferenceLine yAxisId="acc" y={cutoffA} stroke="hsl(142 76% 36%)" strokeDasharray="4 4" />
                <ReferenceLine yAxisId="acc" y={cutoffB} stroke="hsl(38 92% 50%)" strokeDasharray="4 4" />
                <Bar yAxisId="valor" dataKey="valor" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="acc"
                  type="monotone"
                  dataKey="acc"
                  name="% acumulado"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top clientes por receita</CardTitle>
          <CardDescription>Comparativo horizontal (top 8).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[380px] w-full" />
          ) : !hasBarData ? (
            <div className="h-[380px] flex items-center justify-center text-sm text-muted-foreground">
              Nenhum dado para o gráfico.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={topClientsBarData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Receita"]}
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload as { fullName?: string } | undefined;
                    return item?.fullName ?? "";
                  }}
                />
                <Bar dataKey="valor" name="Receita" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
