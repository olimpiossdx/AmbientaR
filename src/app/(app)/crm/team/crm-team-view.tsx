'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AppUser, Opportunity } from '@/lib/types';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { BarChart3 } from 'lucide-react';
import type { CrmTeamRevenueChartProps } from '@/app/(app)/crm/crm-team-revenue-chart';

const CrmTeamRevenueChart = dynamic<CrmTeamRevenueChartProps>(
  () => import('@/app/(app)/crm/crm-team-revenue-chart'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[360px] w-full rounded-lg" />,
  },
);

const PERIOD_PRESETS = [
  { id: '30d', label: '30 dias' },
  { id: '90d', label: '90 dias' },
  { id: '12m', label: '12 meses' },
] as const;

function getPeriodRange(preset: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  if (preset === '30d') start.setDate(start.getDate() - 30);
  else if (preset === '90d') start.setDate(start.getDate() - 90);
  else if (preset === '12m') start.setMonth(start.getMonth() - 12);
  else start.setDate(start.getDate() - 30);
  return { start, end };
}

import { canAccessCrm, canWriteCrm } from '@/lib/role-guards';

export function CrmTeamView() {
  const [periodPreset, setPeriodPreset] = useState<'30d' | '90d' | '12m'>('90d');
  const firestore = useFirestore();
  const { user } = useAuth();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users');
  }, [firestore, user]);
  const opportunitiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'opportunities');
  }, [firestore, user]);

  const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersQuery);
  const { data: opportunities, isLoading: isLoadingOpps } = useCollection<Opportunity>(opportunitiesQuery);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const { periodStart, periodEnd } = useMemo(() => {
    const { start, end } = getPeriodRange(periodPreset);
    return { periodStart: start.getTime(), periodEnd: end.getTime() };
  }, [periodPreset]);

  const sellers = useMemo(() => {
    const list = users ?? [];
    return list
      .filter((u) => u.role === 'sales' || u.role === 'supervisor' || u.role === 'admin')
      .map((u) => ({
        id: u.id,
        name: u.name || u.email || 'Sem nome',
        role: u.role,
      }));
  }, [users]);

  const teamRows = useMemo(() => {
    const opps = opportunities ?? [];
    const bySeller = new Map<string, { activeCount: number; pipelineValue: number; wonCount: number; wonValue: number }>();
    sellers.forEach((s) => bySeller.set(s.id, { activeCount: 0, pipelineValue: 0, wonCount: 0, wonValue: 0 }));

    opps.forEach((o) => {
      const sellerId = o.assignedTo;
      if (!sellerId) return;
      if (!bySeller.has(sellerId)) return;

      const isActive = o.stage !== 'Fechado Ganho' && o.stage !== 'Fechado Perdido';
      if (isActive) {
        const v = bySeller.get(sellerId)!;
        v.activeCount += 1;
        v.pipelineValue += o.value || 0;
      }

      if (o.stage === 'Fechado Ganho') {
        const t = new Date(o.closeDate).getTime();
        if (Number.isFinite(t) && t >= periodStart && t <= periodEnd) {
          const v = bySeller.get(sellerId)!;
          v.wonCount += 1;
          v.wonValue += o.value || 0;
        }
      }
    });

    return sellers
      .map((s) => ({ ...s, ...(bySeller.get(s.id) || { activeCount: 0, pipelineValue: 0, wonCount: 0, wonValue: 0 }) }))
      .sort((a, b) => b.wonValue - a.wonValue);
  }, [opportunities, sellers, periodStart, periodEnd]);

  const chartData = useMemo(() => {
    return teamRows.slice(0, 10).map((r) => ({ vendedor: r.name, Receita: r.wonValue }));
  }, [teamRows]);

  const isLoading = isLoadingUsers || isLoadingOpps;

  if (!user || !canAccessCrm(user.role)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Equipe & Desempenho (CRM)" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>Você não tem permissão para visualizar a equipe de vendas.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Equipe & Desempenho (CRM)">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          {PERIOD_PRESETS.map((p) => (
            <Button
              key={p.id}
              variant={periodPreset === p.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodPreset(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <CrmTeamRevenueChart
            isLoading={isLoading}
            chartData={chartData}
            formatCurrency={formatCurrency}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Visão por vendedor
              </CardTitle>
              <CardDescription>Pipeline atual e ganhos no período selecionado.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="hidden md:table-cell">Pipeline (R$)</TableHead>
                    <TableHead className="hidden md:table-cell">Ativas</TableHead>
                    <TableHead>Ganhos (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      </TableRow>
                    ))}
                  {!isLoading &&
                    teamRows.map((r, idx) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{r.name}</span>
                            {idx === 0 && r.wonValue > 0 ? (
                              <Badge variant="outline" className={cn('bg-amber-500/15 text-amber-700 border-amber-500/30')}>
                                Top
                              </Badge>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">{r.role}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{formatCurrency(r.pipelineValue)}</TableCell>
                        <TableCell className="hidden md:table-cell">{r.activeCount}</TableCell>
                        <TableCell>{formatCurrency(r.wonValue)}</TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && teamRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum vendedor encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

