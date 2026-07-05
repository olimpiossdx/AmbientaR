import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
 BarChart3,
 CalendarDays,
 FileSearch,
 LayoutDashboard,
 Leaf,
 LogOut,
 Menu,
 Settings,
 ShieldCheck,
 UsersRound,
 X,
} from "lucide-react";
import React from "react";
import Button from "../componentes/button";
import { useAuthActions } from "../auth/auth-provider";
import { useAuthUser } from "../auth/auth-hooks";
import { SessionLockModal } from "../auth/session-lock-modal";
import { Avatar, Badge, Sidebar } from "../componentes";

type NavigationItem = {
 to: "/app" | "/app/exemplos";
 label: string;
 icon: React.ComponentType<{ className?: string }>;
 disabled?: boolean;
};

const navigationItems: NavigationItem[] = [
 { to: "/app", label: "Painel", icon: LayoutDashboard },
 { to: "/app/exemplos", label: "Catalogo UI", icon: FileSearch },
 { to: "/app", label: "Agenda", icon: CalendarDays, disabled: true },
 { to: "/app", label: "Financeiro", icon: BarChart3, disabled: true },
 { to: "/app", label: "Clientes", icon: UsersRound, disabled: true },
 { to: "/app", label: "Sistema", icon: Settings, disabled: true },
];

const roleLabels: Record<string, string> = {
 admin: "Administrador",
 supervisor: "Supervisor",
 gestor: "Gestao ambiental",
 financial: "Financeiro",
 sales: "Vendas",
 technical: "Tecnico",
 diretor_fauna: "Diretor de fauna",
 advogado: "Advogado",
 client: "Cliente",
 cliente_autonomo: "Cliente autonomo",
 representative: "Representante",
 consultor_representante: "Consultor-Representante",
};

function getInitials(name?: string | null) {
 if (!name) return "AR";
 return name
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();
}

export function AuthenticatedLayout() {
 const user = useAuthUser();
 const actions = useAuthActions();
 const navigate = useNavigate();
 const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

 const userName = user?.nome ?? "Usuario";
 const userRole = user?.role ? roleLabels[user.role] ?? user.role : "Sessao ativa";

 const handleLogout = async () => {
  await actions.logout();
  await navigate({ to: "/login", replace: true });
 };

 return (
  <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-950">
   <Sidebar className="hidden w-72 shrink-0 md:flex">
    <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
     <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
      <Leaf className="h-5 w-5" />
     </span>
     <div className="min-w-0">
      <p className="truncate text-base font-semibold text-slate-950">AmbientaR</p>
      <p className="truncate text-xs text-slate-500">Gestao Ambiental Inteligente</p>
     </div>
    </div>

    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
     {navigationItems.map((item) => {
      const Icon = item.icon;

      if (item.disabled) {
       return (
        <div
         key={item.label}
         className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-400"
         aria-disabled="true"
        >
         <Icon className="h-4 w-4" />
         <span>{item.label}</span>
        </div>
       );
      }

      return (
       <Link
        key={item.label}
        to={item.to}
        className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
        activeProps={{ className: "bg-emerald-100 text-emerald-900" }}
        onClick={() => setMobileMenuOpen(false)}
       >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
       </Link>
      );
     })}
    </nav>

    <div className="border-t border-slate-200 p-4">
     <div className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
      <Avatar size="sm" fallback={getInitials(userName)} alt={userName} />
      <div className="min-w-0">
       <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
       <p className="truncate text-xs text-slate-500">{user?.username}</p>
      </div>
     </div>
    </div>
   </Sidebar>

   {mobileMenuOpen && (
    <div className="fixed inset-0 z-50 bg-slate-950/40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
     <Sidebar className="h-full w-80 max-w-[86vw]" onClick={(event) => event.stopPropagation()}>
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
       <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
         <Leaf className="h-5 w-5" />
        </span>
        <span className="font-semibold">AmbientaR</span>
       </div>
       <Button variant="ghost" size="icon" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)}>
        <X className="h-5 w-5" />
       </Button>
      </div>
      <nav className="space-y-1 px-3 py-4">
       {navigationItems.map((item) => {
        const Icon = item.icon;

        return item.disabled ? (
         <div key={item.label} className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-400">
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
         </div>
        ) : (
         <Link
          key={item.label}
          to={item.to}
          className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
          activeProps={{ className: "bg-emerald-100 text-emerald-900" }}
          onClick={() => setMobileMenuOpen(false)}
         >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
         </Link>
        );
       })}
      </nav>
     </Sidebar>
    </div>
   )}

   <div className="flex min-w-0 flex-1 flex-col">
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
     <div className="flex min-w-0 items-center gap-3">
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" onClick={() => setMobileMenuOpen(true)}>
       <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden min-w-0 sm:block">
       <p className="truncate text-sm font-semibold text-slate-900">Painel operacional</p>
       <p className="truncate text-xs text-slate-500">Tela inicial apos login</p>
      </div>
     </div>

     <div className="flex items-center gap-3">
      <Badge variant="outline" className="hidden items-center gap-1.5 sm:inline-flex">
       <ShieldCheck className="h-3.5 w-3.5" />
       {userRole}
      </Badge>
      <div className="hidden text-right text-xs text-slate-500 sm:block">
       <p className="font-semibold text-slate-700">{userName}</p>
       <p>{user?.username}</p>
      </div>
      <Button variant="outline" size="sm" leftIcon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
       Sair
      </Button>
     </div>
    </header>

    <main className="min-h-0 flex-1 overflow-y-auto">
     <Outlet />
    </main>
   </div>
   <SessionLockModal />
  </div>
 );
}
