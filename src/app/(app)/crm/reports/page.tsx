'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrDateInput } from '@/components/form/br-date-input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { AppUser, Client, Opportunity, OpportunityStage } from '@/lib/types';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, limit, query } from 'firebase/firestore';
import { sortOpportunitiesByCloseDate } from '@/lib/firestore-list-helpers';
import { canAccessCrm } from '@/lib/role-guards';
import type { CrmReportsChartsProps } from '@/app/(app)/crm/crm-reports-charts';

const CrmReportsCharts = dynamic<CrmReportsChartsProps>(
  () => import('@/app/(app)/crm/crm-reports-charts'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[640px] w-full rounded-lg" />,
  },
);

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
    return query(collection(firestore, 'opportunities'), limit(200));
  }, [firestore, user]);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'clients'), limit(200));
  }, [firestore, user]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), limit(100));
  }, [firestore, user]);

  const { data: rawOpportunities, isLoading: isLoadingOpps } = useCollection<Opportunity>(opportunitiesQuery);
  const opportunities = useMemo(
    () => (rawOpportunities ? sortOpportunitiesByCloseDate(rawOpportunities) : undefined),
    [rawOpportunities],
  );
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
            <BrDateInput className="h-9 w-40 mt-1" value={dateStart} onChange={setDateStart} />
          </div>
          <div>
            <Label className="text-xs">Data fim</Label>
            <BrDateInput className="h-9 w-40 mt-1" value={dateEnd} onChange={setDateEnd} />
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

        <CrmReportsCharts
          isLoading={isLoading}
          pipelineByStage={pipelineByStage}
          closedWonBySeller={closedWonBySeller}
          closedWonByClient={closedWonByClient}
          formatCurrency={formatCurrency}
        />
      </main>
    </div>
  );
}

