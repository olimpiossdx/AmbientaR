import { Link } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";

export function OfflinePage() {
 return (
  <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
   <div className="max-w-md">
    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-700">
     <WifiOff aria-hidden="true" />
    </span>
    <h1 className="mt-4 text-2xl font-semibold text-slate-950">Sem conexão com a internet</h1>
    <p className="mt-2 text-sm leading-6 text-slate-600">Algumas páginas podem abrir a partir do cache. Para consultar dados em tempo real, aguarde a rede ou tente novamente.</p>
    <Link to="/app" className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Ir ao painel</Link>
   </div>
  </main>
 );
}
