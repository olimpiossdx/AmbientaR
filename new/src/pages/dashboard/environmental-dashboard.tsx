import { environmentalMetrics, expiryMetrics, recentRows } from "./dashboard-data";
import { MetricGrid, PageHeader, RecentProcessTable } from "./dashboard-ui";

export function EnvironmentalDashboard({ title = "Painel de Gestao Ambiental" }: { title?: string }) {
 return (
  <div className="flex min-h-full flex-col">
   <PageHeader
    title={title}
    description="Acompanhamento de licencas, condicionantes, outorgas, intervencoes e prazos prioritarios."
   />
   <main className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8">
    <MetricGrid metrics={environmentalMetrics} />
    <MetricGrid metrics={expiryMetrics} />
    <RecentProcessTable rows={recentRows} />
   </main>
  </div>
 );
}
