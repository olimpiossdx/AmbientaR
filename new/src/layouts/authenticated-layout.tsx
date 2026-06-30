import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import Button from "../componentes/button";
import { useAuthActions } from "../auth/auth-provider";
import { useAuthUser } from "../auth/auth-hooks";
import { SessionLockModal } from "../auth/session-lock-modal";

export function AuthenticatedLayout() {
 const user = useAuthUser();
 const actions = useAuthActions();
 const navigate = useNavigate();

 return (
  <div className="min-h-screen bg-slate-100 text-slate-950">
   <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
     <nav className="flex items-center gap-3 text-sm font-medium">
      <Link to="/app" className="text-slate-700 hover:text-sky-700">
       Início
      </Link>
      <Link to="/app/exemplos" className="text-slate-700 hover:text-sky-700">
       Exemplos
      </Link>
     </nav>
     <div className="flex items-center gap-3">
      <div className="hidden text-right text-xs text-slate-500 sm:block">
       <p className="font-semibold text-slate-700">{user?.nome}</p>
       <p>{user?.username}</p>
      </div>
      <Button
       variant="outline"
       size="sm"
       onClick={async () => {
        await actions.logout();
        await navigate({ to: "/login", replace: true });
       }}
      >
       Sair
      </Button>
     </div>
    </div>
   </header>
   <Outlet />
   <SessionLockModal />
  </div>
 );
}
