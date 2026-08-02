import type { DashboardDto } from "./dashboard.types";
import { DashboardView } from "./dashboard-view";

/** Mantido como ponto de composicao; a API decide quais widgets sao autorizados. */
export function AdminDashboard({ dashboard }: { dashboard: DashboardDto }) {
 return <DashboardView dashboard={dashboard} />;
}
