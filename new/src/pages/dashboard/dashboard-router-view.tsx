import { useCallback, useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { useClaim } from "../../app/authorization/use-claim";
import Alert from "../../componentes/alert";
import { Button, PageHeader, Skeleton } from "../../componentes";
import { dashboardErrorMessage, dashboardService, DashboardApiError } from "./dashboard.service";
import type { DashboardDto } from "./dashboard.types";
import { DASHBOARD_VIEW_CLAIM } from "./dashboard.types";
import { DashboardView } from "./dashboard-view";

export function DashboardRouterView() {
 const canView = useClaim(DASHBOARD_VIEW_CLAIM);
 const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
 const [loading, setLoading] = useState(canView);
 const [error, setError] = useState<unknown>(null);
 const [revision, setRevision] = useState(0);

 const retry = useCallback(() => setRevision((value) => value + 1), []);

 useEffect(() => {
  if (!canView) {
   setLoading(false);
   setDashboard(null);
   return;
  }

  const controller = new AbortController();
  setLoading(true);
  setError(null);
  dashboardService.get(controller.signal)
   .then(setDashboard)
   .catch((caught: unknown) => {
    if (controller.signal.aborted) return;
    setDashboard(null);
    setError(caught);
   })
   .finally(() => {
    if (!controller.signal.aborted) setLoading(false);
   });
  return () => controller.abort();
 }, [canView, revision]);

 if (!canView || error instanceof DashboardApiError && error.httpStatus === 403) {
  return (
   <main className="mx-auto w-full max-w-3xl p-4 sm:p-8">
    <Alert variant="error" title="Acesso negado">
     Voce nao possui a claim recurso.dashboard=visualizar ou nao tem acesso ao escopo solicitado.
    </Alert>
   </main>
  );
 }

 if (loading) {
  return (
   <div className="flex min-h-full flex-col" aria-busy="true" aria-label="Carregando painel">
    <PageHeader title="Painel AmbientaR" description="Carregando informacoes autorizadas..." />
    <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
     <div className="flex items-center gap-3 text-sm text-slate-600">
      <Leaf className="h-6 w-6 animate-pulse text-emerald-600" />
      Carregando painel...
     </div>
     <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32 w-full" />)}
     </div>
     <Skeleton className="h-64 w-full" />
    </main>
   </div>
  );
 }

 if (error) {
  return (
   <main className="mx-auto w-full max-w-3xl p-4 sm:p-8">
    <Alert variant="error" title="Nao foi possivel carregar o painel">
     <p>{dashboardErrorMessage(error)}</p>
     <Button className="mt-4" variant="outline" onClick={retry}>Tentar novamente</Button>
    </Alert>
   </main>
  );
 }

 return dashboard ? <DashboardView dashboard={dashboard} /> : null;
}
