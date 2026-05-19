'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AppUser, Client, Opportunity, OpportunityStage } from '@/lib/types';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { canAccessCrm } from '@/lib/role-guards';

const STAGE_COLORS: Record<OpportunityStage, string> = {
  'Qualificação': 'hsl(var(--chart-1))',
  'Proposta': 'hsl(var(--chart-2))',
  'Negociação': 'hsl(var(--chart-3))',
  'Fechado Ganho': 'hsl(var(--chart-4))',
  'Fechado Perdido': 'hsl(var(--chart-5))',
};

export default function CrmReportsPage() {
  const firestore = useFirestore();
  const { user } = useAuth();
  const [dateStart, setDateStart] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateEnd, setDateEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const opportunitiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'opportunities');
  }, [firestore, user]);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'clients');
  }, [firestore, user]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users');
  }, [firestore, user]);

  const { data: opportunities, isLoading: isLoadingOpps } = useCollection<Opportunity>(opportunitiesQuery);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersQuery);

  const clientsMap = useMemo(() => new Map((clients ?? []).map((c) => [c.id, c.name])), [clients]);
  const usersMap = useMemo(() => new Map((users ?? []).map((u) => [u.id, u.name || u.email || 'Sem nome'])), [users]);

  const { startTs, endTs } = useMemo(() => {
    const s = dateStart ? new Date(`${dateStart}T00:00:00.000Z`).getTime() : 0;
    const e = dateEnd ? new Date(`${dateEnd}T23:59:59.999Z`).getTime() : Date.now();
    return { startTs: s, endTs: e };
  }, [dateStart, dateEnd]);

  const inRangeOpps = useMemo(() => {
    const list = opportunities ?? [];
    return list.filter((o) => {
      const t = new Date(o.closeDate).getTime();
      return Number.isFinite(t) && t >= startTs && t <= endTs;
    });
  }, [opportunities, startTs, endTs]);

  const pipelineByStage = useMemo(() => {
    const list = opportunities ?? [];
    const stages: OpportunityStage[] = ['Qualificação', 'Proposta', 'Negociação', 'Fechado Ganho', 'Fechado Perdido'];
    return stages.map((stage) => {
      const items = list.filter((o) => o.stage === stage);
      const value = items.reduce((s, o) => s + (o.value || 0), 0);
      return { stage, count: items.length, value };
    });
  }, [opportunities]);

  const closedWonBySeller = useMemo(() => {
    const won = inRangeOpps.filter((o) => o.stage === 'Fechado Ganho');
    const by = new Map<string, number>();
    won.forEach((o) => {
      const key = o.assignedTo || '__na__';
      by.set(key, (by.get(key) || 0) + (o.value || 0));
    });
    return Array.from(by.entries())
      .map(([id, value]) => ({ vendedor: id === '__na__' ? 'Não atribuído' : (usersMap.get(id) || id), Receita: value }))
      .sort((a, b) => b.Receita - a.Receita)
      .slice(0, 10);
  }, [inRangeOpps, usersMap]);

  const closedWonByClient = useMemo(() => {
    const won = inRangeOpps.filter((o) => o.stage === 'Fechado Ganho');
    const by = new Map<string, number>();
    won.forEach((o) => {
      const key = o.clientId || '__na__';
      by.set(key, (by.get(key) || 0) + (o.value || 0));
    });
    return Array.from(by.entries())
      .map(([id, value]) => ({ cliente: id === '__na__' ? 'Sem cliente' : (clientsMap.get(id) || id), Receita: value }))
      .sort((a, b) => b.Receita - a.Receita)
      .slice(0, 10);
  }, [inRangeOpps, clientsMap]);

  const kpis = useMemo(() => {
    const totalWon = inRangeOpps.filter((o) => o.stage === 'Fechado Ganho');
    const wonValue = totalWon.reduce((s, o) => s + (o.value || 0), 0);
    const wonCount = totalWon.length;
    const ticket = wonCount > 0 ? wonValue / wonCount : 0;
    return { wonValue, wonCount, ticket };
  }, [inRangeOpps]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const isLoading = isLoadingOpps || isLoadingClients || isLoadingUsers;

  if (!user || !canAccessCrm(user.role)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Relatórios & Análises (CRM)" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>Você não tem permissão para visualizar os relatórios do CRM.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Relatórios & Análises (CRM)">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">Data início</Label>
            <Input type="date" className="h-9 w-40 mt-1" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Data fim</Label>
            <Input type="date" className="h-9 w-40 mt-1" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => {}} className="h-9">
            Atualizar
          </Button>
        </div>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Receita (Fechado Ganho)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-2/3" /> : <div className="text-2xl font-bold">{formatCurrency(kpis.wonValue)}</div>}
              <div className="text-xs text-muted-foreground">Período selecionado</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Vendas fechadas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{kpis.wonCount}</div>}
              <div className="text-xs text-muted-foreground">Período selecionado</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ticket médio</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-2/3" /> : <div className="text-2xl font-bold">{formatCurrency(kpis.ticket)}</div>}
              <div className="text-xs text-muted-foreground">Fechado ganho</div>
            </CardContent>
          </Card>
        </div>

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
                    <Badge key={s.stage} variant="outline" className={cn('')}>
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
      </main>
    </div>
  );
}

