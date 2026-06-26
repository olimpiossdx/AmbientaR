"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ManualMonitoringMonthRow = {
  month: string;
  volume: number;
  hours: number;
  days: number;
};

export type ManualMonitoringChartsProps = {
  monthlyDashboardData: ManualMonitoringMonthRow[];
};

export default function ManualMonitoringCharts({
  monthlyDashboardData,
}: ManualMonitoringChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Volume por mês (m³)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyDashboardData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Legend />
              <Bar dataKey="volume" name="Volume (m³)" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Horas e dias por mês</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyDashboardData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Legend />
              <Line type="monotone" dataKey="hours" name="Horas" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="days" name="Dias" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
