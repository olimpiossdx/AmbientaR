'use client';

import { PageHeader } from '@/components/page-header';
import FinancialDashboard from './financial-dashboard';
import EnvironmentalDashboard from './environmental-dashboard';
import CrmDashboard from '../crm/crm-dashboard';
import AgendaWidget from './agenda-widget';
import BirthdayWidget from './birthday-widget';
import { AuthorizationReportsHubCard } from '@/components/authorization-reports-hub-card';
import { useAuth } from '@/firebase';

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
        <AuthorizationReportsHubCard role={hubRole} />
        <div>
          <AgendaWidget />
        </div>
        <div>
          <BirthdayWidget />
        </div>
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Visão Geral Financeira</h2>
            <FinancialDashboard />
        </div>
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Visão Geral de Vendas (CRM)</h2>
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
