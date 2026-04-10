"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
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
import { isRoleAllowedForPath } from "@/lib/route-access";
import { isClienteGestao, isClientePortalRole } from "@/lib/role-guards";
import { getRoleLabelPt } from "@/lib/user-role-labels";
import { shouldBlockPlatformAccess } from "@/lib/platform-access";
import { PlatformAccessBlocked } from "@/components/platform-access-blocked";

const LogoIcon = () => (
  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground">
    <Leaf className="h-5 w-5" />
  </div>
);

const mobileNavItems = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/calendar", label: "Agenda", icon: Calendar },
  {
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
  const router = useRouter();
  const { user, logout, isInitialized } = useAuth();
  const { firestore, auth } = useFirebase();
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [logoLoading, setLogoLoading] = React.useState(true);
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  // UID efetivo para subcoleções de `users/{uid}/...`:
  // prioriza o UID real da sessão autenticada para evitar usar ID de documento por engano.
  const authUid = auth?.currentUser?.uid || user?.uid || null;

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !authUid) return null;
    return query(
      collection(firestore, `users/${authUid}/notifications`),
      orderBy("createdAt", "desc"),
    );
  }, [firestore, user, authUid]);

  const brandingDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "companySettings", "branding");
  }, [firestore]);
  const featureFlagsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "companySettings", "featureFlags");
  }, [firestore]);

  const { data: notifications } =
    useCollection<Notification>(notificationsQuery);
  const { data: brandingData } = useDoc<CompanySettings>(brandingDocRef);
  const { data: featureFlagsData } = useDoc<{ allowExternalChat?: boolean }>(
    featureFlagsDocRef,
  );

  // Consultas auxiliares para identificar todos os CPFs/CNPJs vinculados ao titular (mesma lógica da página de Meu Perfil).
  const accessRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isClienteGestao(user.role)) return null;
    // mesma forma que a página de Meu Perfil (UsersPage): apenas where por status
    return query(
      collection(firestore, "access_requests"),
      where("status", "==", "pending"),
    );
  }, [firestore, user]);

  const myClientsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isClientePortalRole(user.role)) return null;
    return query(
      collection(firestore, "clients"),
      where("userId", "==", user.id),
    );
  }, [firestore, user]);

  const myEmpreendedoresQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isClientePortalRole(user.role)) return null;
    return query(
      collection(firestore, "empreendedores"),
      where("userId", "==", user.id),
    );
  }, [firestore, user]);

  const clientByIdRef = useMemoFirebase(() => {
    if (!firestore || !user || !isClientePortalRole(user.role)) return null;
    return doc(firestore, "clients", user.id);
  }, [firestore, user]);

  const empreendedorByIdRef = useMemoFirebase(() => {
    if (!firestore || !user || !isClientePortalRole(user.role)) return null;
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
    if (isClientePortalRole(user?.role)) {
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
            if (path.startsWith("https://")) {
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
    (isClientePortalRole(user?.role) || user?.role === "representative"),
  );

  const unreadCount = React.useMemo(() => {
    const notif = notifications?.filter((n) => !n.isRead).length || 0;
    const extraAccess = pendingAccessRequestsForMe.length || 0;
    return (cadastroIncompleto ? notif + 1 : notif) + extraAccess;
  }, [notifications, cadastroIncompleto, pendingAccessRequestsForMe]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (!firestore || !user || !authUid) return;
    if (notification.isRead) return;

    const notifRef = doc(
      firestore,
      `users/${authUid}/notifications`,
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

  const roleLabelOverrides: Record<string, string> = {
    gestor: "Autorizações/Relatórios",
  };
  const getActorLabel = (actorRole?: string) =>
    actorRole
      ? roleLabelOverrides[actorRole] ?? getRoleLabelPt(actorRole)
      : null;

  React.useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, isInitialized, router]);

  // Se ainda não inicializou (Firebase demorando), redireciona para login após 3s.
  // A regra aqui é: não depende do `user` já existir no momento do render; o timeout cancela/atualiza quando `user` mudar.
  React.useEffect(() => {
    if (isInitialized) return;
    const t = setTimeout(() => {
      if (!user) router.replace("/login");
    }, 3000);
    return () => clearTimeout(t);
  }, [isInitialized, router, user]);

  // Guard simples por role para evitar “furar” o menu digitando URL.
  React.useEffect(() => {
    if (!user) return;
    if (isRoleAllowedForPath(user.role, pathname)) return;
    router.replace("/");
  }, [pathname, router, user]);

  // Em mobile, sempre fecha o menu lateral ao navegar entre páginas.
  // Evita reabertura visual após voltar para o dashboard via seta.
  React.useEffect(() => {
    if (!isMobile) return;
    setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  const filteredMobileNavItems = React.useMemo(() => {
    if (!user) return mobileNavItems;
    return mobileNavItems.filter((i) =>
      isRoleAllowedForPath(user.role, i.href),
    );
  }, [user]);
  const allowExternalChat = Boolean(featureFlagsData?.allowExternalChat);
  const canRenderChatWidget =
    !isClientePortalRole(user?.role) && user?.role !== "representative"
      ? true
      : allowExternalChat;

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const canUseMobileGestureZone = React.useMemo(() => {
    if (!isMobile) return false;
    if (typeof window === "undefined") return true;
    const untilRaw = sessionStorage.getItem("suppressMobileSidebarGestureUntil");
    const until = untilRaw ? Number(untilRaw) : 0;
    return !Number.isFinite(until) || Date.now() > until;
  }, [isMobile]);

  if (!isInitialized || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Leaf className="w-12 h-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (shouldBlockPlatformAccess(user)) {
    return <PlatformAccessBlocked user={user} />;
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
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
                      isClientePortalRole(user?.role)
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
              <DropdownMenuItem asChild>
                <Link href="/users">Gerenciar Usuários</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Configurações</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Zona de gesto: puxar da esquerda para abrir o menu no celular */}
      {isMobile && !openMobile && canUseMobileGestureZone && (
        <div
          className="fixed left-0 top-16 bottom-20 w-10 max-w-[80px] min-h-[120px] z-30 touch-manipulation md:hidden"
          onClick={() => setOpenMobile(true)}
          role="button"
          tabIndex={0}
          aria-label="Abrir menu"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpenMobile(true);
          }}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar>
          <SidebarContent>
            <NavContent />
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          <div key={pathname} className="animate-page-fade-in relative h-full">
            {children}
          </div>
        </main>
      </div>

      {canRenderChatWidget && <ChatWidget />}

      {/* Bottom Navbar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-background/95 backdrop-blur border-t z-40">
        <div className="flex justify-around items-center h-full px-1">
          {filteredMobileNavItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-full text-muted-foreground transition-all duration-200 ease-out active:scale-95",
                  item.isCenter ? "w-24 -mt-6" : "w-16",
                  pathname === item.href && "text-primary",
                )}
                onClick={handleLinkClick}
              >
                <div
                  className={cn(
                    "rounded-full transition-all duration-200 ease-out",
                    item.isCenter
                      ? "h-16 w-16 flex items-center justify-center shadow-md bg-primary text-primary-foreground"
                      : "h-10 w-10 flex items-center justify-center",
                    pathname === item.href &&
                      !item.isCenter &&
                      "bg-primary/10 text-primary scale-110",
                    pathname === item.href &&
                      item.isCenter &&
                      "shadow-lg ring-4 ring-primary/20 -translate-y-0.5",
                  )}
                >
                  <item.icon
                    className={cn(
                      "transition-transform duration-200",
                      item.isCenter ? "h-7 w-7" : "h-[22px] w-[22px]",
                      pathname === item.href && "scale-110",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[11px] leading-tight text-center transition-colors duration-200",
                    item.isCenter && "text-[10px] max-w-[84px] font-medium",
                    pathname === item.href && "font-medium",
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
      <AppLayoutClient>{children}</AppLayoutClient>
    </SidebarProvider>
  );
}
