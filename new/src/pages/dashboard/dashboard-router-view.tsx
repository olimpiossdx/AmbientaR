import { Leaf } from "lucide-react";
import { useAuthUser } from "../../auth/auth-hooks";
import { EnvironmentalDashboard } from "./environmental-dashboard";

export function DashboardRouterView() {
 const user = useAuthUser();
 if (!user) {
  return (
   <div className="flex min-h-full items-center justify-center bg-white p-8">
    <div className="flex flex-col items-center gap-3 text-slate-600">
     <Leaf className="h-10 w-10 animate-pulse text-emerald-600" />
     <p className="text-sm">Carregando painel...</p>
    </div>
   </div>
  );
 }

 return <EnvironmentalDashboard title="Painel AmbientaR" />;
}
