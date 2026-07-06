import { Outlet, useNavigate } from "@tanstack/react-router";
import {
 BarChart3,
 CalendarDays,
 FileSearch,
 LayoutDashboard,
 Leaf,
 LogOut,
 Settings,
 UsersRound,
} from "lucide-react";
import React from "react";
import Button from "../componentes/button";
import { useAuthActions } from "../auth/auth-provider";
import { useAuthUser } from "../auth/auth-hooks";
import { SessionLockModal } from "../auth/session-lock-modal";
import { AppHeader, AppSidebar, AppUserMenu, Avatar, NotificationMenu } from "../componentes";

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
   <AppSidebar
    brandName="AmbientaR"
    brandDescription="Gestao Ambiental Inteligente"
    items={navigationItems}
    onNavigate={() => setMobileMenuOpen(false)}
    logo={(
     <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
      <Leaf className="h-5 w-5" />
     </span>
    )}
    userSummary={(
     <div className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
      <Avatar size="sm" fallback={getInitials(userName)} alt={userName} />
      <div className="min-w-0">
       <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
       <p className="truncate text-xs text-slate-500">{user?.username}</p>
      </div>
     </div>
    )}
   />

   {mobileMenuOpen && (
    <div className="fixed inset-0 z-50 bg-slate-950/40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
     <AppSidebar
      mobile
      brandName="AmbientaR"
      brandDescription="Gestao Ambiental Inteligente"
      items={navigationItems}
      onNavigate={() => setMobileMenuOpen(false)}
      onClose={() => setMobileMenuOpen(false)}
      onClick={(event) => event.stopPropagation()}
      logo={(
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
         <Leaf className="h-5 w-5" />
        </span>
      )}
     />
    </div>
   )}

   <div className="flex min-w-0 flex-1 flex-col">
    <AppHeader
     title="Painel operacional"
     subtitle="Tela inicial apos login"
     roleLabel={userRole}
     userName={userName}
     userIdentifier={user?.username}
     onOpenMenu={() => setMobileMenuOpen(true)}
     notifications={<NotificationMenu items={[]} />}
     userMenu={(
      <AppUserMenu
       name={userName}
       identifier={user?.username}
       avatarFallback={getInitials(userName)}
       items={[
        {
         label: "Sair",
         destructive: true,
         onSelect: handleLogout,
        },
       ]}
      />
     )}
     actions={(
      <Button variant="outline" size="sm" leftIcon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
       Sair
      </Button>
     )}
    />

    <main className="min-h-0 flex-1 overflow-y-auto">
     <Outlet />
    </main>
   </div>
   <SessionLockModal />
  </div>
 );
}
