"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarResizeHandle,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  Leaf,
  Bell,
  LayoutDashboard,
  Calendar,
  Menu,
  FileSearch,
  ClipboardList,
  Recycle,
  UserRound,
} from "lucide-react";
import type {
  AppUser,
  Notification,
  CompanySettings,
  AccessRequest,
  Client,
  Empreendedor,
} from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  useFirebase,
  useAuth,
  useCollection,
  useMemoFirebase,
  useDoc,
} from "@/firebase";
import {
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  where,
} from "firebase/firestore";
import ChatWidget from "@/components/chat-widget";
import { UpgradeButton } from "@/components/upgrade-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import NavContent from "@/components/nav-content";
import { SidebarDebugger } from "@/components/sidebar-debugger";
import { FinancialMenuDebugPanel } from "@/lib/financial-menu-debug";
import { CadastroMenuDebugPanel } from "@/lib/cadastro-menu-debug";
import {
  getFirstAutorizacoesRelatoriosHrefForRole,
  isAutorizacoesRelatoriosNavPath,
  isRoleAllowedForPath,
} from "@/lib/route-access";
import { OfflineProvider } from "@/lib/offline";
import { OfflineQueueBadge } from "@/components/offline-queue-badge";
import {
  isUserProfileAlignedWithSession,
  useAuthUserId,
} from "@/lib/auth-user-id";

const LogoIcon = () => (
  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground">
    <Leaf className="h-5 w-5" />
  </div>
);

const mobileNavItems = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/calendar", label: "Agenda", icon: Calendar },
  {
    /** Valor inicial; em mobile é substituído pelo primeiro path do grupo permitido ao papel. */
    href: "/licenses",
    label: "Autorizações/Relatórios",
    icon: FileSearch,
    isCenter: true,
  },
  { href: "/projects", label: "Gestão", icon: ClipboardList },
  { href: "/users", label: "Perfil", icon: UserRound },
];

const AppLayoutClient = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, isInitialized, isProfileLoading } = useAuth();
  const { firestore, auth } = useFirebase();
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [logoLoading, setLogoLoading] = React.useState(true);
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  const sessionUid = useAuthUserId(auth);
  const profileAligned = isUserProfileAlignedWithSession(user, sessionUid);

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !profileAligned || !sessionUid) return null;
    return query(
      collection(firestore, `users/${sessionUid}/notifications`),
      orderBy("createdAt", "desc"),
    );
  }, [firestore, profileAligned, sessionUid]);

  /** Só assina após Auth restaurar sessão — evita permission-denied com auth:null em produção. */
  const companySettingsReady = Boolean(firestore && auth?.currentUser);

  const brandingDocRef = useMemoFirebase(() => {
    if (!companySettingsReady) return null;
    return doc(firestore!, "companySettings", "branding");
  }, [companySettingsReady, firestore]);
  const featureFlagsDocRef = useMemoFirebase(() => {
    if (!companySettingsReady) return null;
    return doc(firestore!, "companySettings", "featureFlags");
  }, [companySettingsReady, firestore]);

  const { data: notifications } =
    useCollection<Notification>(notificationsQuery);
  const { data: brandingData } = useDoc<CompanySettings>(brandingDocRef);
  const { data: featureFlagsData } = useDoc<{ allowExternalChat?: boolean }>(
    featureFlagsDocRef,
  );

  // Consultas auxiliares para identificar todos os CPFs/CNPJs vinculados ao titular (mesma lógica da página de Meu Perfil).
  const accessRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user || user.role !== "client") return null;
    // mesma forma que a página de Meu Perfil (UsersPage): apenas where por status
    return query(
      collection(firestore, "access_requests"),
      where("status", "==", "pending"),
    );
  }, [firestore, user]);

  const myClientsQuery = useMemoFirebase(() => {
    if (!firestore || !user || user.role !== "client") return null;
    return query(
      collection(firestore, "clients"),
      where("userId", "==", user.id),
    );
  }, [firestore, user]);

  const myEmpreendedoresQuery = useMemoFirebase(() => {
    if (!firestore || !user || user.role !== "client") return null;
    return query(
      collection(firestore, "empreendedores"),
      where("userId", "==", user.id),
    );
  }, [firestore, user]);

  const clientByIdRef = useMemoFirebase(() => {
    if (!firestore || !user || user.role !== "client") return null;
    return doc(firestore, "clients", user.id);
  }, [firestore, user]);

  const empreendedorByIdRef = useMemoFirebase(() => {
    if (!firestore || !user || user.role !== "client") return null;
    return doc(firestore, "empreendedores", user.id);
  }, [firestore, user]);

  const { data: pendingAccessRequests } =
    useCollection<AccessRequest>(accessRequestsQuery);
  const { data: myClients } = useCollection<Client>(myClientsQuery);
  const { data: myEmpreendedores } = useCollection<Empreendedor>(
    myEmpreendedoresQuery,
  );
  const { data: clientById } = useDoc<Client>(clientByIdRef);
  const { data: empreendedorById } = useDoc<Empreendedor>(empreendedorByIdRef);

  const myCpfCnpjSet = React.useMemo(() => {
    const set = new Set<string>();
    const add = (v: string | undefined | null) => {
      if (!v) return;
      const trimmed = String(v).trim();
      if (!trimmed) return;
      const digits = trimmed.replace(/\D/g, "");
      if (digits.length >= 11) {
        set.add(digits);
        set.add(trimmed);
      }
    };

    myClients?.forEach((c) => add(c.cpfCnpj));
    myEmpreendedores?.forEach((e) => add(e.cpfCnpj));
    if (clientById?.cpfCnpj) add(clientById.cpfCnpj);
    if (empreendedorById?.cpfCnpj) add(empreendedorById.cpfCnpj);
    if (user?.role === "client") {
      add(user.cpf);
      add(user.userCpf);
    }

    return set;
  }, [myClients, myEmpreendedores, clientById, empreendedorById, user]);

  const pendingAccessRequestsForMe = React.useMemo(() => {
    if (!pendingAccessRequests || myCpfCnpjSet.size === 0) return [];
    return pendingAccessRequests.filter((r) => {
      const digits = (r.cpfOfInterested || "").replace(/\D/g, "");
      if (digits.length < 11) return false;
      return myCpfCnpjSet.has(r.cpfOfInterested!) || myCpfCnpjSet.has(digits);
    });
  }, [pendingAccessRequests, myCpfCnpjSet]);

  React.useEffect(() => {
    async function fetchLogoUrl() {
      setLogoLoading(true);
      if (brandingData?.logoUsage === "system_wide") {
        const path =
          brandingData.systemLogoSource === "watermark"
            ? brandingData.watermarkImageUrl
            : brandingData.headerImageUrl;

        if (path) {
          try {
            if (path.startsWith("https://") || path.startsWith("http://")) {
              setLogoUrl(path);
            } else if (path.startsWith("/")) {
              setLogoUrl(path);
            } else {
              const storage = getStorage();
              const storageRef = ref(storage, path);
              const url = await getDownloadURL(storageRef);
              setLogoUrl(url);
            }
          } catch (error) {
            console.error("Error fetching logo URL for layout:", error);
            setLogoUrl(null);
          }
        } else {
          setLogoUrl(null);
        }
      } else {
        setLogoUrl(null);
      }
      setLogoLoading(false);
    }

    fetchLogoUrl();
  }, [brandingData]);

  const showCustomLogo = !logoLoading && logoUrl;

  const cadastroIncompleto = Boolean(
    user?.cadastroIncompleto &&
    (user?.role === "client" ||
      user?.role === "cliente_autonomo" ||
      user?.role === "representative"),
  );

  const unreadCount = React.useMemo(() => {
    const notif = notifications?.filter((n) => !n.isRead).length || 0;
    const extraAccess = pendingAccessRequestsForMe.length || 0;
    return (cadastroIncompleto ? notif + 1 : notif) + extraAccess;
  }, [notifications, cadastroIncompleto, pendingAccessRequestsForMe]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (!firestore || !profileAligned || !sessionUid) return;
    if (notification.isRead) return;

    const notifRef = doc(
      firestore,
      `users/${sessionUid}/notifications`,
      notification.id,
    );
    await updateDoc(notifRef, { isRead: true });
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleAccessRequestsClick = () => {
    router.push("/users#access-requests-card");
  };

  const roleLabel: Record<string, string> = {
    admin: "Administrador",
    gestor: "Autorizações/Relatórios",
    supervisor: "Supervisor",
    financial: "Financeiro",
    sales: "Vendas",
    technical: "Técnico",
    diretor_fauna: "Diretor de Fauna",
    advogado: "Advogado",
    client: "Cliente",
    representative: "Representante",
  };
  const getActorLabel = (actorRole?: string) =>
    actorRole ? roleLabel[actorRole] || actorRole : null;

  React.useEffect(() => {
    if (!isInitialized || isProfileLoading) return;
    if (!user && !auth?.currentUser) {
      router.push("/login");
    }
  }, [user, isInitialized, isProfileLoading, auth, router]);

  // Guard simples por role para evitar “furar” o menu digitando URL.
  React.useEffect(() => {
    if (!user) return;
    if (!pathname || isRoleAllowedForPath(user.role, pathname, searchParams)) return;
    router.replace("/");
  }, [pathname, searchParams, router, user]);

  // Em mobile, sempre fecha o menu lateral ao navegar entre páginas.
  // Evita reabertura visual após voltar para o dashboard via seta.
  React.useEffect(() => {
    if (!isMobile) return;
    setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  const filteredMobileNavItems = React.useMemo(() => {
    if (!user) return mobileNavItems;
    return mobileNavItems
      .map((i) => {
        if ("isCenter" in i && i.isCenter) {
          const href = getFirstAutorizacoesRelatoriosHrefForRole(user.role);
          if (!href) return null;
          return { ...i, href };
        }
        return i;
      })
      .filter(
        (i): i is (typeof mobileNavItems)[number] =>
          i !== null && isRoleAllowedForPath(user.role, i.href),
      );
  }, [user]);

  const isMobileBottomNavItemActive = React.useCallback(
    (item: (typeof mobileNavItems)[number]) => {
      if (!pathname) return false;
      if ("isCenter" in item && item.isCenter) {
        return isAutorizacoesRelatoriosNavPath(pathname);
      }
      return pathname === item.href;
    },
    [pathname],
  );
  const allowExternalChat = Boolean(featureFlagsData?.allowExternalChat);
  const canRenderChatWidget =
    user?.role !== "client" && user?.role !== "representative"
      ? true
      : allowExternalChat;

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (!isInitialized || isProfileLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Leaf className="w-12 h-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <SidebarTrigger className="-ml-0.5" />
          </div>
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir menu"
              onClick={() => setOpenMobile(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <Link href="/" className="flex items-center gap-3">
            {showCustomLogo ? (
              <Image
                src={logoUrl!}
                alt="Logo"
                width={120}
                height={28}
                className="object-contain"
              />
            ) : (
              <>
                <LogoIcon />
                <div>
                  <h2 className="text-lg font-bold leading-tight text-foreground">
                    AmbientaR
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Gestão Ambiental Inteligente
                  </p>
                </div>
              </>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {user?.role === "admin" && (
            <Badge variant="outline" className="hidden md:inline-flex">
              Acesso total (Administrador)
            </Badge>
          )}
          {user?.role === "supervisor" && (
            <Badge variant="outline" className="hidden md:inline-flex">
              Supervisão
            </Badge>
          )}
          <ThemeToggle />
          <OfflineQueueBadge />
          <UpgradeButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/90"></span>
                  </span>
                )}
                <span className="sr-only">Notificações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {cadastroIncompleto && (
                <DropdownMenuItem
                  className="flex-col items-start gap-1 cursor-pointer bg-amber-500/10 border-b border-amber-500/20"
                  onClick={() => {
                    const authUserId = user?.uid || user?.id;
                    router.push(
                      user?.role === "client"
                        ? authUserId
                          ? `/empreendedores/${authUserId}/edit`
                          : "/empreendedores"
                        : "/empreendedores",
                    );
                  }}
                >
                  <div className="font-medium text-amber-700 dark:text-amber-400">
                    Cadastro incompleto
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Acesse o menu Cadastro para atualizar seus dados.
                  </div>
                </DropdownMenuItem>
              )}
              {cadastroIncompleto && <DropdownMenuSeparator />}
              {pendingAccessRequestsForMe.length > 0 && (
                <>
                  <DropdownMenuItem
                    className="flex-col items-start gap-1 cursor-pointer bg-emerald-500/10 border-b border-emerald-500/20"
                    onClick={handleAccessRequestsClick}
                  >
                    <div className="font-medium text-emerald-800 dark:text-emerald-300">
                      {pendingAccessRequestsForMe.length === 1
                        ? "1 pedido de acesso pendente"
                        : `${pendingAccessRequestsForMe.length} pedidos de acesso pendentes`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Clique para revisar e aprovar representantes em Meu
                      Perfil.
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {notifications && notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex-col items-start gap-1 cursor-pointer",
                      notification.isRead && "text-muted-foreground",
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-xs">{notification.description}</div>
                    {getActorLabel(notification.actorRole) && (
                      <div className="text-xs text-muted-foreground/80 mt-0.5">
                        Por: {getActorLabel(notification.actorRole)}
                      </div>
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma notificação nova.
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-1 h-auto"
              >
                <Avatar className="h-8 w-8">
                  {user.photoURL && (
                    <AvatarImage src={user.photoURL} alt={user.name} />
                  )}
                  <AvatarFallback>
                    {user.name ? user.name.substring(0, 2).toUpperCase() : ""}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col text-sm text-left md:flex">
                  <span className="font-semibold">{user.name}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <p>{user.name}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isRoleAllowedForPath(user.role, "/users") && (
                <DropdownMenuItem asChild>
                  <Link href="/users">Gerenciar Usuários</Link>
                </DropdownMenuItem>
              )}
              {isRoleAllowedForPath(user.role, "/settings") && (
                <DropdownMenuItem asChild>
                  <Link href="/settings">Configurações</Link>
                </DropdownMenuItem>
              )}
              {isRoleAllowedForPath(user.role, "/settings/appearance") &&
                !isRoleAllowedForPath(user.role, "/settings") && (
                  <DropdownMenuItem asChild>
                    <Link href="/settings/appearance">Aparência</Link>
                  </DropdownMenuItem>
                )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-w-0 flex-1 overflow-hidden">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <NavContent />
          </SidebarContent>
        </Sidebar>
        <SidebarResizeHandle />
        <SidebarInset className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
          <div
            key={pathname}
            className="app-scroll-region animate-page-fade-in relative min-w-0 max-w-full"
          >
            {children}
          </div>
        </SidebarInset>
      </div>

      {canRenderChatWidget && <ChatWidget />}

      {/* Bottom Navbar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-background/95 backdrop-blur border-t z-40">
        <div className="flex justify-around items-center h-full px-1">
          {filteredMobileNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-full text-muted-foreground transition-all duration-200 ease-out active:scale-95",
                  item.isCenter ? "w-24 -mt-6" : "w-16",
                  isMobileBottomNavItemActive(item) && "text-primary",
                )}
                onClick={handleLinkClick}
              >
                <div
                  className={cn(
                    "rounded-full transition-all duration-200 ease-out",
                    item.isCenter
                      ? "h-16 w-16 flex items-center justify-center shadow-md bg-primary text-primary-foreground"
                      : "h-10 w-10 flex items-center justify-center",
                    isMobileBottomNavItemActive(item) &&
                      !item.isCenter &&
                      "bg-primary/10 text-primary scale-110",
                    isMobileBottomNavItemActive(item) &&
                      item.isCenter &&
                      "shadow-lg ring-4 ring-primary/20 -translate-y-0.5",
                  )}
                >
                  <item.icon
                    className={cn(
                      "transition-transform duration-200",
                      item.isCenter ? "h-7 w-7" : "h-[22px] w-[22px]",
                      isMobileBottomNavItemActive(item) && "scale-110",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[11px] leading-tight text-center transition-colors duration-200",
                    item.isCenter && "text-[10px] max-w-[84px] font-medium",
                    isMobileBottomNavItemActive(item) && "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Debugger pormenorizado: menu e submenu da barra lateral (dev ou ?debug=1) */}
      <Suspense fallback={null}>
        <SidebarDebugger />
      </Suspense>

      {/* Debug do menu Financeiro (apenas em dev, em rotas financeiras) */}
      <FinancialMenuDebugPanel />

      {/* Debug do menu Cadastro (apenas em dev, em rotas de cadastro) */}
      <CadastroMenuDebugPanel />
    </div>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <OfflineProvider>
        <Suspense fallback={null}>
          <AppLayoutClient>{children}</AppLayoutClient>
        </Suspense>
      </OfflineProvider>
    </SidebarProvider>
  );
}
