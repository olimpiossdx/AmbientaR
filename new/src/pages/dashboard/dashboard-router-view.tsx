import { Leaf } from "lucide-react";
import { useAuthUser } from "../../auth/auth-hooks";
import { AdminDashboard } from "./admin-dashboard";
import type { DashboardRole } from "./dashboard-data";
import { EnvironmentalDashboard } from "./environmental-dashboard";
import { FocusedDashboard } from "./focused-dashboard";
import { PageHeader } from "../../componentes";

export function DashboardRouterView() {
 const user = useAuthUser();
 const role = user?.role as DashboardRole | undefined;

 if (!user) {
  return (
   <div className="flex min-h-full items-center justify-center bg-white p-8">
    <div className="flex flex-col items-center gap-3 text-slate-600">
     <Leaf className="h-10 w-10 animate-pulse text-emerald-600" />
     <p className="text-sm">Carregando painel...</p>
    </div>
   </div>
  );
 }

 const dashboards: Partial<Record<DashboardRole, React.ReactNode>> = {
  admin: <AdminDashboard />,
  supervisor: <AdminDashboard isSupervisor />,
  financial: <FocusedDashboard kind="financial" />,
  sales: <FocusedDashboard kind="sales" />,
  gestor: <EnvironmentalDashboard />,
  technical: <EnvironmentalDashboard />,
  advogado: <EnvironmentalDashboard title="Painel do Advogado" />,
  diretor_fauna: <EnvironmentalDashboard title="Painel de Fauna" />,
  client: <EnvironmentalDashboard title="Painel do Cliente" />,
  cliente_autonomo: <EnvironmentalDashboard title="Painel do Cliente" />,
  representative: <EnvironmentalDashboard title="Painel do Representante" />,
  consultor_representante: <EnvironmentalDashboard title="Painel do Consultor-Representante" />,
 };

 const dashboard = role ? dashboards[role] : null;

 if (dashboard) {
  return <>{dashboard}</>;
 }

 return (
  <div className="flex min-h-full flex-col">
   <PageHeader
    title="Painel nao configurado"
    description="Este perfil ainda nao possui um dashboard dedicado no novo painel."
   />
  </div>
 );
}
