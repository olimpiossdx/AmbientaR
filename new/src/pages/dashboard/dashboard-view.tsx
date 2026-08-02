import { HubGrid, MetricGrid, PageHeader, ProcessTable, TaskList } from "../../componentes";
import {
 toHubGridItems,
 toMetricGridItems,
 toProcessTableRows,
 toTaskListItems,
} from "./dashboard-data";
import type { DashboardDto, DashboardWidget } from "./dashboard.types";

function DashboardWidgetView({ widget }: { widget: DashboardWidget }) {
 if (widget.kind === "metrics") {
  const grid = <MetricGrid metrics={toMetricGridItems(widget.items)} columns={widget.columns === 3 ? "three" : "four"} />;
  return widget.title ? (
   <section className="space-y-4" aria-labelledby={`dashboard-${widget.id}`}>
    <h2 id={`dashboard-${widget.id}`} className="text-xl font-semibold text-slate-950">{widget.title}</h2>
    {grid}
   </section>
  ) : grid;
 }
 if (widget.kind === "tasks") {
  return (
   <TaskList
    title={widget.title}
    description={widget.description}
    emptyMessage={widget.emptyMessage}
    items={toTaskListItems(widget.items)}
   />
  );
 }
 if (widget.kind === "processes") {
  return (
   <ProcessTable
    title={widget.title}
    description={widget.description}
    emptyMessage={widget.emptyMessage}
    rows={toProcessTableRows(widget.items)}
   />
  );
 }
 const grid = <HubGrid items={toHubGridItems(widget.items)} />;
 return widget.title ? (
  <section className="space-y-4" aria-labelledby={`dashboard-${widget.id}`}>
   <h2 id={`dashboard-${widget.id}`} className="text-xl font-semibold text-slate-950">{widget.title}</h2>
   {grid}
  </section>
 ) : grid;
}

export function DashboardView({ dashboard }: { dashboard: DashboardDto }) {
 return (
  <div className="flex min-h-full flex-col">
   <PageHeader title={dashboard.title} description={dashboard.description} />
   <main className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8">
    {dashboard.widgets.length === 0 ? (
     <section className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center" role="status">
      <h2 className="font-semibold text-slate-900">Nenhuma informacao disponivel</h2>
      <p className="mt-2 text-sm text-slate-600">Nao ha widgets autorizados com dados para o seu escopo.</p>
     </section>
    ) : dashboard.widgets.map((widget) => <DashboardWidgetView key={widget.id} widget={widget} />)}
    {dashboard.generatedAt ? (
     <p className="text-right text-xs text-slate-500">
      Atualizado em <time dateTime={dashboard.generatedAt}>{new Date(dashboard.generatedAt).toLocaleString("pt-BR")}</time>
     </p>
    ) : null}
   </main>
  </div>
 );
}
