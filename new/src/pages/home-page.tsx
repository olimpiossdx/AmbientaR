import { Link } from "@tanstack/react-router";
import { useAuthUser } from "../auth/auth-hooks";

export default function HomePage() {
 const user = useAuthUser();

 return (
  <main className="mx-auto max-w-7xl px-4 py-8">
   <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Área protegida</p>
    <h1 className="mt-2 text-2xl font-bold text-slate-950">Olá, {user?.nome ?? "usuário"}</h1>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
     Esta rota está protegida pelo TanStack Router. Quando a sessão expirar, a tela será bloqueada por modal sem redirecionar nem perder o estado atual.
    </p>
    <Link to="/app/exemplos" className="mt-6 inline-flex text-sm font-semibold text-sky-700 hover:underline">
     Abrir catálogo de exemplos
    </Link>
   </section>
  </main>
 );
}
