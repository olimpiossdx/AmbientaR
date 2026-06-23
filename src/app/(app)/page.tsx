"use client";
import dynamic from "next/dynamic";
import { useAuth } from "@/firebase";
import { Leaf } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DocumentosAmbientaisHubCard } from "@/components/documentos-ambientais-hub-card";

const DashboardLoading = () => (
  <div className="flex min-h-[200px] items-center justify-center p-8">
    <Leaf className="h-8 w-8 animate-pulse text-primary" />
  </div>
);

const AdminDashboard = dynamic(() => import("./dashboards/admin-dashboard"), {
  loading: DashboardLoading,
});
const FinancialDashboard = dynamic(
  () => import("./dashboards/financial-dashboard"),
  { loading: DashboardLoading, ssr: false },
);
const EnvironmentalDashboard = dynamic(
  () => import("./dashboards/environmental-dashboard"),
  { loading: DashboardLoading },
);
const ClientDashboard = dynamic(() => import("./dashboards/client-dashboard"), {
  loading: DashboardLoading,
});
const CrmDashboard = dynamic(() => import("./crm/crm-dashboard"), {
  loading: DashboardLoading,
});
const BirthdayWidget = dynamic(() => import("./dashboards/birthday-widget"), {
  loading: () => null,
});
const AgendaWidget = dynamic(() => import("./dashboards/agenda-widget"), {
  loading: () => null,
});
const OfficeTasksWidget = dynamic(() => import("./dashboards/office-tasks-widget"), {
  loading: () => null,
});
const FaunaDashboard = dynamic(() => import("./dashboards/fauna-dashboard"), {
  loading: DashboardLoading,
});

export default function DashboardRouterPage() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Leaf className="w-12 h-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    );
  }

  const dashboardForRole: Partial<Record<typeof user.role, React.ReactNode>> = {
    admin: <AdminDashboard />,
    supervisor: <AdminDashboard />,
    financial: (
      <div className="flex flex-col h-full">
        <PageHeader title="Painel Financeiro" />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <DocumentosAmbientaisHubCard role="financial" />
          <AgendaWidget />
          <BirthdayWidget />
          <FinancialDashboard />
          <div className="mt-8">
            <h2 className="mb-4 break-words text-2xl font-bold tracking-tight">
              Visão Geral de Vendas (CRM)
            </h2>
            <CrmDashboard />
          </div>
        </main>
      </div>
    ),
    sales: (
      <div className="flex flex-col h-full">
        <PageHeader title="Painel de Vendas" />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <DocumentosAmbientaisHubCard role="sales" />
          <AgendaWidget />
          <BirthdayWidget />
          <div className="mt-8">
            <CrmDashboard />
          </div>
        </main>
      </div>
    ),
    client: <ClientDashboard />,
    cliente_autonomo: <ClientDashboard />,
    representative: <ClientDashboard />,
    consultor_representante: <ClientDashboard />,
    diretor_fauna: <FaunaDashboard />,
    gestor: (
      <div className="flex flex-col h-full">
        <PageHeader title="Painel de Gestão Ambiental" />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <DocumentosAmbientaisHubCard role="gestor" />
          <AgendaWidget />
          <OfficeTasksWidget />
          <BirthdayWidget />
          <div className="mt-8">
            <EnvironmentalDashboard />
          </div>
        </main>
      </div>
    ),
    technical: (
      <div className="flex flex-col h-full">
        <PageHeader title="Painel de Gestão Ambiental" />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <DocumentosAmbientaisHubCard role="technical" />
          <AgendaWidget />
          <OfficeTasksWidget />
          <BirthdayWidget />
          <div className="mt-8">
            <EnvironmentalDashboard />
          </div>
        </main>
      </div>
    ),
    advogado: (
      <div className="flex flex-col h-full">
        <PageHeader title="Painel do Advogado" />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <DocumentosAmbientaisHubCard role="advogado" />
          <AgendaWidget />
          <OfficeTasksWidget />
          <BirthdayWidget />
          <div className="mt-8">
            <EnvironmentalDashboard />
          </div>
        </main>
      </div>
    ),
  };

  const fallback = (
    <div className="p-6">
      <p>Nenhum painel foi configurado para este perfil de usuário.</p>
    </div>
  );

  const node = dashboardForRole[user.role] ?? fallback;
  if (!dashboardForRole[user.role]) {
    console.warn(`No dashboard configured for user role: ${user.role}`);
  }
  return <>{node}</>;
}
