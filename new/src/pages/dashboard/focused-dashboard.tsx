import { crmMetrics, financialMetrics } from "./dashboard-data";
import { MetricGrid, PageHeader } from "./dashboard-ui";

export function FocusedDashboard({ kind }: { kind: "financial" | "sales" }) {
 const isFinancial = kind === "financial";

 return (
  <div className="flex min-h-full flex-col">
   <PageHeader
    title={isFinancial ? "Painel Financeiro" : "Painel de Vendas"}
    description={isFinancial ? "Resumo de receitas, vencimentos e acompanhamento financeiro." : "Resumo de oportunidades, leads e propostas comerciais."}
   />
   <main className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8">
    <MetricGrid metrics={isFinancial ? financialMetrics : crmMetrics} columns="three" />
   </main>
  </div>
 );
}
