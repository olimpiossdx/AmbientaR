import { environmentalMetrics, expiryMetrics, recentRows } from "./dashboard-data";
import { MetricGrid, PageHeader, ProcessTable } from "../../componentes";

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
    <ProcessTable
     title="Licencas e projetos recentes"
     description="Ultimos processos ambientais adicionados ao painel."
     rows={recentRows}
    />
   </main>
  </div>
 );
}
