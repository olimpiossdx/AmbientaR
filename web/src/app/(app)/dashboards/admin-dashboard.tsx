'use client';

import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import EnvironmentalDashboard from './environmental-dashboard';
import AgendaWidget from './agenda-widget';
import OfficeTasksWidget from './office-tasks-widget';
import BirthdayWidget from './birthday-widget';
import { DocumentosAmbientaisHubCard } from '@/components/documentos-ambientais-hub-card';
import { useAuth } from '@/firebase';

const FinancialDashboard = dynamic(() => import('./financial-dashboard'), {
  ssr: false,
  loading: () => <Skeleton className="h-[360px] w-full rounded-lg" />,
});
const CrmDashboard = dynamic(() => import('../crm/crm-dashboard'), {
  ssr: false,
  loading: () => <Skeleton className="h-[360px] w-full rounded-lg" />,
});

export default function AdminDashboard() {
  const { user } = useAuth();
  const hubRole = user?.role === 'supervisor' ? 'supervisor' : 'admin';
  const panelTitle =
    user?.role === 'supervisor'
      ? 'Painel do Supervisor'
      : 'Painel do Administrador';

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={panelTitle} />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
        <DocumentosAmbientaisHubCard role={hubRole} />
        <div>
          <AgendaWidget />
        </div>
        <div>
          <OfficeTasksWidget />
        </div>
        <div>
          <BirthdayWidget />
        </div>
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Visão Geral Financeira</h2>
            <FinancialDashboard />
        </div>
        <div>
            <h2 className="mb-4 break-words text-2xl font-bold tracking-tight">
              Visão Geral de Vendas (CRM)
            </h2>
            <CrmDashboard />
        </div>
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Visão Geral de Gestão Ambiental</h2>
            <EnvironmentalDashboard />
        </div>
      </main>
    </div>
  );
}
