"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ResolutionBucket } from "@/lib/gestao-processos/resolution-time-metrics";
import { bucketsToChartData } from "@/lib/gestao-processos/resolution-time-metrics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ResolutionBarChartProps = {
  title: string;
  description: string;
  buckets: ResolutionBucket[];
  isLoading?: boolean;
  emptyMessage?: string;
};

function formatDays(value: number): string {
  return `${value} dia${value === 1 ? "" : "s"}`;
}

export function ResolutionBarChart({
  title,
  description,
  buckets,
  isLoading = false,
  emptyMessage = "Sem registos concluídos com datas suficientes.",
}: ResolutionBarChartProps) {
  const chartData = bucketsToChartData(buckets);
  const detailBuckets = buckets.filter((b) => b.key !== "_geral");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ left: 8, right: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                fontSize={11}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={72}
              />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip
                formatter={(value: number, _name, item) => [
                  formatDays(value),
                  `n=${(item.payload as { count: number }).count}`,
                ]}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="media" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {!isLoading && detailBuckets.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assunto</TableHead>
                  <TableHead className="text-right">N</TableHead>
                  <TableHead className="text-right">Média</TableHead>
                  <TableHead className="text-right">Mediana</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailBuckets.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.avgDays !== null ? formatDays(row.avgDays) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.medianDays !== null ? formatDays(row.medianDays) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.minDays !== null ? formatDays(row.minDays) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.maxDays !== null ? formatDays(row.maxDays) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
