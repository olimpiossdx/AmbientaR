import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
 Leaf,
} from "lucide-react";
import React from "react";
import { useAuthActions } from "../auth/auth-provider";
import { useAuthUser } from "../auth/auth-hooks";
import { SessionLockModal } from "../auth/session-lock-modal";
import { AppHeader, AppSidebar, AppUserMenu, Avatar, NotificationMenu } from "../componentes";
import { getNavigationItemsForRole, getNavigationMatchForPath } from "../modules/navigation";
import { getRoleLabel } from "../modules/auth/permissions";

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
 const location = useLocation();
 const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

 const userName = user?.nome ?? "Usuario";
 const userRole = getRoleLabel(user?.role) ?? "Sessao ativa";
 const navigationItems = React.useMemo(() => getNavigationItemsForRole(user?.role), [user?.role]);
 const navigationMatch = React.useMemo(
  () => getNavigationMatchForPath(location.pathname),
  [location.pathname],
 );
 const headerTitle = navigationMatch?.title ?? "Painel";
 const headerSubtitle = navigationMatch?.moduleTitle && navigationMatch.moduleTitle !== headerTitle
  ? navigationMatch.moduleTitle
  : "AmbientaR";

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
     title={headerTitle}
     subtitle={headerSubtitle}
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
    />

    <main className="min-h-0 flex-1 overflow-y-auto">
     <Outlet />
    </main>
   </div>
   <SessionLockModal />
  </div>
 );
}
