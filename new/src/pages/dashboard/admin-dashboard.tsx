import {
 adminHubItems,
 agendaItems,
 birthdayItems,
 crmMetrics,
 environmentalMetrics,
 expiryMetrics,
 financialMetrics,
 officeTasks,
 recentRows,
} from "./dashboard-data";
import { HubGrid, MetricGrid, PageHeader, ProcessTable, TaskList } from "../../componentes";

export function AdminDashboard({ isSupervisor = false }: { isSupervisor?: boolean }) {
 return (
  <div className="flex min-h-full flex-col">
   <PageHeader
    title={isSupervisor ? "Painel do Supervisor" : "Painel do Administrador"}
    description="Visao consolidada para acompanhar documentos ambientais, tarefas, agenda, financeiro e vendas depois do login."
   />
   <main className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8">
   <HubGrid items={adminHubItems} />

    <div className="grid gap-4 xl:grid-cols-3">
     <TaskList title="Agenda" description="Compromissos e entregas proximas." items={agendaItems} />
     <TaskList title="Tarefas internas" description="Pendencias operacionais do escritorio." items={officeTasks} />
     <TaskList title="Aniversariantes" description="Relacionamentos importantes do mes." items={birthdayItems} />
    </div>

    <section className="space-y-4" aria-labelledby="financeiro-title">
     <h2 id="financeiro-title" className="text-xl font-semibold text-slate-950">Visao geral financeira</h2>
     <MetricGrid metrics={financialMetrics} columns="three" />
    </section>

    <section className="space-y-4" aria-labelledby="crm-title">
     <h2 id="crm-title" className="text-xl font-semibold text-slate-950">Visao geral de vendas</h2>
     <MetricGrid metrics={crmMetrics} columns="three" />
    </section>

   <section className="space-y-4" aria-labelledby="ambiental-title">
     <h2 id="ambiental-title" className="text-xl font-semibold text-slate-950">Visao geral de gestao ambiental</h2>
     <MetricGrid metrics={environmentalMetrics} />
     <MetricGrid metrics={expiryMetrics} />
     <ProcessTable
      title="Licencas e projetos recentes"
      description="Ultimos processos ambientais adicionados ao painel."
      rows={recentRows}
     />
    </section>
   </main>
  </div>
 );
}
