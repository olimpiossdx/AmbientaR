'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL } from '@/lib/financial-core';
import {
  type AbcClass,
  type AbcRow,
  getAbcBadgeClass,
  getAbcBarColor,
  summarizeAbcByClass,
  truncateAbcLabel,
} from '@/lib/abc-analysis';

const CHART_TOP = 12;
const BAR_TOP = 8;

type AbcAnalysisViewProps = {
  title: string;
  description: string;
  rows: AbcRow[];
  valueColumnLabel?: string;
  isLoading?: boolean;
  emptyMessage?: string;
};

function AbcProgressBar({ pct, classe }: { pct: number; classe: AbcClass }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: getAbcBarColor(classe) }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
    </div>
  );
}

export function AbcAnalysisView({
  title,
  description,
  rows,
  valueColumnLabel = 'Valor',
  isLoading = false,
  emptyMessage = 'Sem dados no período.',
}: AbcAnalysisViewProps) {
  const total = useMemo(() => rows.reduce((sum, r) => sum + r.valor, 0), [rows]);
  const classSummary = useMemo(() => summarizeAbcByClass(rows), [rows]);

  const paretoData = useMemo(
    () =>
      rows.slice(0, CHART_TOP).map((r) => ({
        name: truncateAbcLabel(r.label, 28),
        fullName: r.label,
        valor: r.valor,
        acc: parseFloat(r.acc.toFixed(1)),
        classe: r.classe,
      })),
    [rows]
  );

  const barData = useMemo(
    () =>
      rows.slice(0, BAR_TOP).map((r) => ({
        name: truncateAbcLabel(r.label, 32),
        fullName: r.label,
        valor: r.valor,
        fill: getAbcBarColor(r.classe),
      })),
    [rows]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[380px] w-full rounded-lg" />
        <Skeleton className="h-[280px] w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total no período</p>
            <p className="text-xl font-semibold">{formatCurrencyBRL(total)}</p>
            <p className="text-xs text-muted-foreground mt-1">{rows.length} itens no ranking</p>
          </CardContent>
        </Card>
        {(['A', 'B', 'C'] as const).map((classe) => {
          const entry = classSummary[classe];
          const share = total > 0 ? (entry.valor / total) * 100 : 0;
          return (
            <Card key={classe}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">Classe {classe}</p>
                  <Badge variant="outline" className={cn('font-bold', getAbcBadgeClass(classe))}>
                    {classe}
                  </Badge>
                </div>
                <p className="text-lg font-semibold mt-1">{formatCurrencyBRL(entry.valor)}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.count} {entry.count === 1 ? 'item' : 'itens'} · {share.toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Curva de Pareto (ABC)</CardTitle>
            <CardDescription>
              Barras = {valueColumnLabel.toLowerCase()} individual · Linha = % acumulado (top {CHART_TOP}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={paretoData} margin={{ top: 12, right: 12, left: 4, bottom: 56 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
                  tickFormatter={(v) =>
                    v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`
                  }
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
                    if (name === 'acc') return [`${value}%`, '% acumulado'];
                    return [formatCurrencyBRL(value), valueColumnLabel];
                  }}
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload as { fullName?: string } | undefined;
                    return item?.fullName ?? '';
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="valor"
                  dataKey="valor"
                  name={valueColumnLabel}
                  radius={[4, 4, 0, 0]}
                  fill="hsl(var(--primary))"
                />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top {BAR_TOP} por valor</CardTitle>
            <CardDescription>Comparativo horizontal das maiores participações.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatCurrencyBRL(v)} tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrencyBRL(value), valueColumnLabel]}
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload as { fullName?: string } | undefined;
                    return item?.fullName ?? '';
                  }}
                />
                <Bar dataKey="valor" name={valueColumnLabel} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:hidden">
            {rows.map((r) => (
              <Card key={r.id} className="rounded-xl border-border/70 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm leading-snug">{r.label}</p>
                    <Badge variant="outline" className={cn('shrink-0 font-bold', getAbcBadgeClass(r.classe))}>
                      {r.classe}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{formatCurrencyBRL(r.valor)}</p>
                  <AbcProgressBar pct={r.pct} classe={r.classe} />
                  <p className="text-xs text-muted-foreground">Acumulado: {r.acc.toFixed(1)}%</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Descrição</TableHead>
                  <TableHead className="text-right w-[120px]">{valueColumnLabel}</TableHead>
                  <TableHead className="w-[180px]">Participação</TableHead>
                  <TableHead className="text-right w-[90px]">% acum.</TableHead>
                  <TableHead className="w-[80px] text-center">Classe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium max-w-md">
                      <span className="line-clamp-2" title={r.label}>
                        {r.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrencyBRL(r.valor)}</TableCell>
                    <TableCell>
                      <AbcProgressBar pct={r.pct} classe={r.classe} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.acc.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn('font-bold', getAbcBadgeClass(r.classe))}>
                        {r.classe}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
