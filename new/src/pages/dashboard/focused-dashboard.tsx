import type { DashboardDto } from "./dashboard.types";
import { DashboardView } from "./dashboard-view";

/** O foco e o titulo devem vir do agregado autorizado retornado pela API. */
export function FocusedDashboard({ dashboard }: { dashboard: DashboardDto }) {
 return <DashboardView dashboard={dashboard} />;
}
