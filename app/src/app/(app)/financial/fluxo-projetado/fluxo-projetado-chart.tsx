"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrencyBRL } from "@/lib/financial-core";

export type FluxoProjetadoChartProps = {
  projection: {
    periodo: string;
    Entradas: number;
    Saídas: number;
    Saldo: number;
  }[];
};

export default function FluxoProjetadoChart({ projection }: FluxoProjetadoChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={projection}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="periodo" />
        <YAxis />
        <Tooltip formatter={(v: number) => formatCurrencyBRL(v)} />
        <Legend />
        <Bar dataKey="Entradas" fill="#16a34a" />
        <Bar dataKey="Saídas" fill="#dc2626" />
      </BarChart>
    </ResponsiveContainer>
  );
}
