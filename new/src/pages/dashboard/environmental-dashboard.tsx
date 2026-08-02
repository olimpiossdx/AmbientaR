import type { DashboardDto } from "./dashboard.types";
import { DashboardView } from "./dashboard-view";

/** Mantido para consumidores existentes, sem selecao por role ou dados locais. */
export function EnvironmentalDashboard({ dashboard }: { dashboard: DashboardDto }) {
 return <DashboardView dashboard={dashboard} />;
}
