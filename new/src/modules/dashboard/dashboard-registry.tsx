import type React from "react";
import { AdminDashboard } from "../../pages/dashboard/admin-dashboard";
import { EnvironmentalDashboard } from "../../pages/dashboard/environmental-dashboard";
import { FocusedDashboard } from "../../pages/dashboard/focused-dashboard";
import type { UserRole } from "../auth/permissions";

export type DashboardRole = UserRole;

export function getDashboardForRole(role?: string | null): React.ReactNode | null {
 switch (role) {
  case "admin":
   return <AdminDashboard />;
  case "supervisor":
   return <AdminDashboard isSupervisor />;
  case "financial":
   return <FocusedDashboard kind="financial" />;
  case "sales":
   return <FocusedDashboard kind="sales" />;
  case "gestor":
  case "technical":
   return <EnvironmentalDashboard />;
  case "advogado":
   return <EnvironmentalDashboard title="Painel do Advogado" />;
  case "diretor_fauna":
   return <EnvironmentalDashboard title="Painel de Fauna" />;
  case "client":
  case "cliente_autonomo":
   return <EnvironmentalDashboard title="Painel do Cliente" />;
  case "representative":
   return <EnvironmentalDashboard title="Painel do Representante" />;
  case "consultor_representante":
   return <EnvironmentalDashboard title="Painel do Consultor-Representante" />;
  default:
   return null;
 }
}
