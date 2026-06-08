"use client";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  ArrowUp,
  FileText,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isClientePortalRole } from "@/lib/role-guards";
import {
  createConsultorAssignment,
  getAccessRequestType,
} from "@/lib/consultor-assignments";
import { isUserConsideredOnline } from "@/lib/user-presence";
import { usePresenceClock } from "@/hooks/use-user-presence";
import type {
  AppUser,
  AuditLog,
  CompanySettings,
  AccessRequest,
  Client,
  DelegateInvite,
  Empreendedor,
  UserRole,
} from "@/lib/types";
import {
  useCollection,
  useMemoFirebase,
  errorEmitter,
  useFirebase,
  useDoc,
} from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  collection,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { useLocalBranding } from "@/hooks/use-local-branding";
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  drawWatermarkOnPage,
  guardBrandingExportFromHook,
  reportBrandingPdfIssues,
} from "@/lib/pdf-branding-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformSubscriptionAcceptanceViewer } from "@/components/platform-subscription-contract/acceptance-viewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserForm } from "./user-form";
import { DelegateAccessPortfolioCard } from "@/components/delegate-access-portfolio-card";
import {
  DelegateInviteAckCard,
  TitularDelegateInviteCard,
  TitularSentInvitesList,
} from "@/components/delegate-invite-panel";
import {
  filterAccessRequestsForDelegate,
} from "@/lib/delegate-access-requests";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { deleteUser } from "firebase/auth";
import { logUserAction } from "@/lib/audit-log";
import { UpgradeDialog } from "@/components/upgrade-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCpfDisplay, formatCpfCnpjDisplay } from "@/lib/masks";
import { FirebaseAdminSetupHelp } from "@/components/admin/firebase-admin-setup-help";
import {
  FIREBASE_AUTH_USERS_CONSOLE_URL,
  isAdminCredentialsMissing,
} from "@/lib/admin/firebase-admin-setup";
import { ToastAction } from "@/components/ui/toast";
import {
  isUserProfileAlignedWithSession,
  resolvePortalAuthUid,
  useAuthUserId,
} from "@/lib/auth-user-id";
import { canEditUserInUsersList } from "@/lib/role-guards";
import {
  accessRequestMatchesTitularDocuments,
  filterAccessRequestsForTitular,
} from "@/lib/access-request-titular-match";
import { buildTitularCpfCnpjSet } from "@/lib/titular-document-set";
import { linkClientGestaoToExistingRecords } from "@/lib/link-client-gestao-records";
import {
  lookupClientAndEmpreendedorByDocument,
  normalizeDocumentDigits,
} from "@/lib/document-lookup";

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null | string[];
}) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">
      {Array.isArray(value) ? value.join(", ") : value || "Não informado"}
    </p>
  </div>
);

export default function UsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [viewingUser, setViewingUser] = useState<AppUser | null>(null);
  const [approvedRepresentatives, setApprovedRepresentatives] = useState<
    AppUser[]
  >([]);
  const [isLoadingApprovedReps, setIsLoadingApprovedReps] = useState(false);
  const [approvedConsultors, setApprovedConsultors] = useState<AppUser[]>([]);
  const [isLoadingApprovedConsultors, setIsLoadingApprovedConsultors] =
    useState(false);
  const [revokingConsultorId, setRevokingConsultorId] = useState<string | null>(
    null,
  );
  const [revokingRepresentativeId, setRevokingRepresentativeId] = useState<
    string | null
  >(null);
  const [orphanEmail, setOrphanEmail] = useState("");
  const [isReleasingOrphanEmail, setIsReleasingOrphanEmail] = useState(false);
  const [adminSdkConfigured, setAdminSdkConfigured] = useState<boolean | null>(
    null,
  );
  const [showOrphanEmailSetupHelp, setShowOrphanEmailSetupHelp] = useState(false);
  const router = useRouter();

  const { firestore, auth, user } = useFirebase();
  const sessionUid = useAuthUserId(auth);
  const profileAligned = isUserProfileAlignedWithSession(user, sessionUid);
  const portalUid = resolvePortalAuthUid(user);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role !== "admin" || !auth?.currentUser) {
      setAdminSdkConfigured(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token || cancelled) return;
        const res = await fetch("/api/admin/credentials-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as { configured?: boolean };
        if (!cancelled) {
          setAdminSdkConfigured(data.configured === true);
        }
      } catch {
        if (!cancelled) setAdminSdkConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth, user?.role, user?.uid]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    if (
      user.role === "admin" ||
      user.role === "supervisor" ||
      user.role === "diretor_fauna"
    ) {
      return collection(firestore, "users");
    }

    if (user.role === "financial") {
      return query(
        collection(firestore, "users"),
        where("role", "==", "financial"),
      );
    }

    if (
      [
        "sales",
        "technical",
        "gestor",
        "client",
        "cliente_autonomo",
        "representative",
        "consultor_representante",
        "advogado",
      ].includes(user.role)
    ) {
      const uid =
        profileAligned && sessionUid ? sessionUid : user.uid || user.id;
      return query(collection(firestore, "users"), where("uid", "==", uid));
    }

    return query(
      collection(firestore, "users"),
      where("uid", "==", "invalid-uid-for-non-admins"),
    );
  }, [firestore, user, profileAligned, sessionUid]);

  const { data: appUsers, isLoading } = useCollection<AppUser>(usersQuery);
  const presenceNow = usePresenceClock();

  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const getRoleText = (role: AppUser["role"]) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "client":
        return "Cliente Gestão";
      case "cliente_autonomo":
        return "Cliente Autônomo";
      case "representative":
        return "Representante";
      case "consultor_representante":
        return "Consultor-Representante";
      case "technical":
        return "Técnico";
      case "sales":
        return "Vendas";
      case "financial":
        return "Financeiro";
      case "gestor":
        return "Gestor Ambiental";
      case "supervisor":
        return "Supervisor";
      case "diretor_fauna":
        return "Diretor de Fauna";
      case "advogado":
        return "Advogado";
    }
  };

  const handleEdit = (userToEdit: AppUser) => {
    setEditingUser(userToEdit);
    setIsDialogOpen(true);
  };

  const handleView = (userToView: AppUser) => {
    setViewingUser(userToView);
    setIsViewOpen(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (user: AppUser) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };

  const sessionTargetUid = sessionUid ?? user?.uid ?? user?.id ?? null;

  const canDeleteUser = (target: AppUser | null) =>
    !!target &&
    !!sessionTargetUid &&
    (user?.role === "admin" ||
      ((isClientePortalRole(user?.role) ||
        user?.role === "representative") &&
        (target.id === sessionTargetUid || target.uid === sessionTargetUid)));

  const handleReleaseOrphanEmail = async () => {
    if (!auth) return;
    const email = orphanEmail.trim().toLowerCase();
    if (!email) {
      toast({
        variant: "destructive",
        title: "E-mail obrigatório",
        description: "Informe o e-mail a liberar.",
      });
      return;
    }
    setIsReleasingOrphanEmail(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão inválida. Faça login novamente.");
      const res = await fetch("/api/admin/delete-user-by-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        code?: string;
        result?: {
          authUserDeleted?: boolean;
          firestoreUserDeleted?: boolean;
          accessRequestsDeleted?: number;
        };
      };
      if (!res.ok || !data.success) {
        if (isAdminCredentialsMissing(res.status, data.code)) {
          setAdminSdkConfigured(false);
          setShowOrphanEmailSetupHelp(true);
        }
        const credErr = new Error(
          data.error || "Não foi possível liberar o e-mail no servidor.",
        ) as Error & { credentialsMissing?: boolean };
        credErr.credentialsMissing = isAdminCredentialsMissing(
          res.status,
          data.code,
        );
        throw credErr;
      }
      const r = data.result;
      toast({
        title: "E-mail liberado",
        description: `Auth: ${r?.authUserDeleted ? "removido" : "já não existia"}. Firestore: ${r?.firestoreUserDeleted ? "removido" : "não havia perfil"}. Pedidos de acesso: ${r?.accessRequestsDeleted ?? 0}.`,
      });
      setOrphanEmail("");
    } catch (err) {
      const credentialsMissing =
        err instanceof Error &&
        "credentialsMissing" in err &&
        (err as Error & { credentialsMissing?: boolean }).credentialsMissing;

      toast({
        variant: "destructive",
        title: credentialsMissing
          ? "Credenciais do servidor não configuradas"
          : "Erro ao liberar e-mail",
        description: credentialsMissing ? (
          <span>
            Configure a conta de serviço no PC ou apague o e-mail no Firebase
            Console. Instruções no card acima.
          </span>
        ) : err instanceof Error ? (
          err.message
        ) : (
          "Verifique credenciais do servidor (Admin SDK) ou use o Firebase Console."
        ),
        action: credentialsMissing ? (
          <ToastAction altText="Abrir Authentication no Firebase Console" asChild>
            <a
              href={FIREBASE_AUTH_USERS_CONSOLE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir Authentication
            </a>
          </ToastAction>
        ) : undefined,
      });
    } finally {
      setIsReleasingOrphanEmail(false);
    }
  };

  const handleDelete = async () => {
    if (!firestore || !userToDelete || !auth) return;
    if (!canDeleteUser(userToDelete)) {
      toast({
        variant: "destructive",
        title: "Sem permissão",
        description:
          "Apenas o administrador pode excluir outros usuários. Cliente e representante podem excluir apenas o próprio usuário de acesso.",
      });
      setIsAlertOpen(false);
      setUserToDelete(null);
      return;
    }
    const isSelfDelete = Boolean(
      sessionTargetUid &&
        (userToDelete.id === sessionTargetUid ||
          userToDelete.uid === sessionTargetUid),
    );
    const userDocRef = doc(firestore, "users", userToDelete.id);

    try {
      if (user?.role === "admin" && !isSelfDelete) {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Sessão inválida. Faça login novamente.");
        const res = await fetch("/api/admin/delete-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: userToDelete.id,
            email: userToDelete.email,
          }),
        });
        const data = (await res.json()) as { success?: boolean; error?: string };
        if (!res.ok || !data.success) {
          throw new Error(
            data.error ||
              "Não foi possível remover o utilizador por completo no servidor.",
          );
        }
        logUserAction(firestore, auth, "delete_user", {
          deletedUserId: userToDelete.uid,
          deletedUserName: userToDelete.name,
        });
        toast({
          title: "Usuário excluído",
          description: `O utilizador ${userToDelete.name} foi removido do Firestore, do login (Auth) e dos pedidos de acesso associados. O e-mail pode ser reutilizado.`,
        });
      } else {
        await deleteDoc(userDocRef);
        toast({
          title: isSelfDelete
            ? "Usuário de acesso removido"
            : "Usuário deletado",
          description: isSelfDelete
            ? "Seus dados de acesso foram removidos. O e-mail ficará livre para novo cadastro. Você será deslogado."
            : `O usuário ${userToDelete.name} foi removido com sucesso.`,
        });
        if (isSelfDelete && auth.currentUser) {
          try {
            await deleteUser(auth.currentUser);
          } catch (err: unknown) {
            await auth.signOut();
            const code =
              err && typeof err === "object" && "code" in err
                ? String((err as { code: string }).code)
                : "";
            if (code === "auth/requires-recent-login") {
              toast({
                variant: "destructive",
                title: "Reautenticação necessária",
                description:
                  "Por segurança, faça login novamente e tente excluir outra vez. O perfil já foi removido.",
              });
            } else {
              toast({
                variant: "destructive",
                title: "Erro ao remover conta",
                description:
                  'O perfil foi removido, mas o e-mail pode continuar em uso. Use "Excluir minha conta" em Meu Perfil após fazer login.',
              });
            }
          }
          router.push("/login");
        }
      }
    } catch (serverError) {
      const message =
        serverError instanceof Error
          ? serverError.message
          : "Não foi possível excluir o utilizador.";
      if (
        user?.role === "admin" &&
        !isSelfDelete &&
        message.includes("credencial") === false
      ) {
        toast({
          variant: "destructive",
          title: "Erro na exclusão definitiva",
          description: message,
        });
      } else {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: "delete",
        });
        errorEmitter.emit("permission-error", permissionError);
      }
    } finally {
      setIsAlertOpen(false);
      setUserToDelete(null);
    }
  };

  const handleGenerateLog = async (logUser: AppUser, format: "txt" | "pdf") => {
    if (!firestore) return;

    toast({
      title: "Gerando log...",
      description: `Buscando registros para ${logUser.name}.`,
    });

    const logsQuery = query(
      collection(firestore, "auditLogs"),
      where("userId", "==", logUser.uid),
      orderBy("timestamp", "desc"),
    );

    try {
      const querySnapshot = await getDocs(logsQuery);
      const logs = querySnapshot.docs.map((doc) => doc.data() as AuditLog);

      if (format === "txt") {
        let logContent = `HISTÓRICO DE AUDITORIA\n`;
        logContent += `==================================================\n`;
        logContent += `Usuário: ${logUser.name} (${logUser.email})\n`;
        logContent += `ID do Usuário: ${logUser.uid}\n`;
        logContent += `Gerado em: ${new Date().toLocaleString("pt-BR")}\n`;
        logContent += `==================================================\n\n`;

        if (logs.length === 0) {
          logContent +=
            "Nenhum registro de atividade encontrado para este usuário.";
        } else {
          logs.forEach((log) => {
            logContent += `Data:       ${log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString("pt-BR") : "N/A"}\n`;
            logContent += `Ação:       ${log.action}\n`;
            logContent += `Detalhes:   ${JSON.stringify(log.details, null, 2)}\n`;
            logContent += `--------------------------------------------------\n`;
          });
        }

        const blob = new Blob([logContent], {
          type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `log_${logUser.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === "pdf") {
        if (
          !guardBrandingExportFromHook({
            brandingData,
            pdfImages,
            isPdfImagesLoading,
            hasBrandingUrls,
            toast,
          })
        ) {
          return;
        }
        const session = await createMmBrandedPdfSession(
          brandingUrlsFromLocal(brandingData),
          undefined,
          pdfImages,
        );
        reportBrandingPdfIssues(
          brandingUrlsFromLocal(brandingData),
          session.branding.images,
          toast,
        );
        const { doc } = session;
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = session.startY;
        const onPdfPage = () => drawWatermarkOnPage(doc, session.branding);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Histórico de Auditoria do Usuário", pageWidth / 2, yPos, {
          align: "center",
        });
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.text(`Usuário: ${logUser.name} (${logUser.email})`, 15, yPos);
        yPos += 5;
        doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 15, yPos);
        yPos += 10;
        doc.setLineWidth(0.5);
        doc.line(15, yPos - 5, pageWidth - 15, yPos - 5);

        if (logs.length === 0) {
          doc.text("Nenhum registro de atividade encontrado.", 15, yPos);
        } else {
          logs.forEach((log) => {
            const logString = `Data: ${log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString("pt-BR") : "N/A"}\nAção: ${log.action}\nDetalhes: ${JSON.stringify(log.details, null, 2)}`;
            const splitText = doc.splitTextToSize(logString, pageWidth - 30);

            if (yPos + splitText.length * 5 > pageHeight - 30) {
              doc.addPage();
              onPdfPage();
              yPos = session.startY;
            }

            doc.text(splitText, 15, yPos);
            yPos += splitText.length * 5 + 5;
            doc.setDrawColor(230, 230, 230);
            doc.line(15, yPos - 2.5, pageWidth - 15, yPos - 2.5);
            yPos += 5;
          });
        }

        session.finalize();

        const fileName = `log_${logUser.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
        doc.save(fileName);
      }

      toast({
        title: "Log Gerado",
        description: `O arquivo foi baixado com sucesso.`,
      });
    } catch (error) {
      console.error("Error exporting user log:", error);
      toast({
        variant: "destructive",
        title: "Erro na Exportação",
        description: "Não foi possível gerar o arquivo de log.",
      });
    }
  };

  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const getPackageLabel = (pkg?: string) => {
    const labels: Record<string, string> = {
      gratuito: "Gratuito",
      basico: "Básico",
      intermediario: "Intermediário",
      avancado: "Avançado",
      completo: "Completo",
      sob_consulta: "Sob Consulta",
    };
    return pkg ? labels[pkg] || pkg : "Não informado";
  };

  const handleDeleteAccount = async () => {
    if (!firestore || !auth || !user) return;
    setIsDeletingAccount(true);
    try {
      const userDocRef = doc(firestore, "users", user.id);
      await deleteDoc(userDocRef);
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
      toast({
        title: "Conta excluída",
        description:
          "Sua conta e todos os seus dados foram removidos com sucesso.",
      });
      router.push("/login");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        toast({
          variant: "destructive",
          title: "Reautenticação necessária",
          description:
            "Por segurança, faça logout e login novamente antes de excluir sua conta.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao excluir conta",
          description:
            "Não foi possível excluir sua conta. Tente novamente ou entre em contato com o suporte.",
        });
      }
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteAccountOpen(false);
    }
  };

  const clientProfileDocRef = useMemoFirebase(() => {
    if (
      !firestore ||
      !user ||
      !profileAligned ||
      !sessionUid ||
      !isClientePortalRole(user.role)
    ) {
      return null;
    }
    return doc(firestore, "users", sessionUid);
  }, [firestore, user, profileAligned, sessionUid]);
  const { data: clientProfile, isLoading: isLoadingProfile } =
    useDoc<AppUser>(clientProfileDocRef);

  const accessRequestsQuery = useMemoFirebase(() => {
    if (
      !firestore ||
      !user ||
      !isClientePortalRole(user.role) ||
      !profileAligned
    ) {
      return null;
    }
    return query(
      collection(firestore, "access_requests"),
      where("status", "==", "pending"),
    );
  }, [firestore, user, profileAligned]);
  const { data: allPendingRequests, error: accessRequestsError } =
    useCollection<AccessRequest>(accessRequestsQuery);

  const approvedRequestsQuery = useMemoFirebase(() => {
    if (
      !firestore ||
      !user ||
      !isClientePortalRole(user.role) ||
      !profileAligned
    ) {
      return null;
    }
    return query(
      collection(firestore, "access_requests"),
      where("status", "==", "approved"),
    );
  }, [firestore, user, profileAligned]);
  const { data: allApprovedRequests } = useCollection<AccessRequest>(
    approvedRequestsQuery,
  );

  const delegateInvitesQuery = useMemoFirebase(() => {
    if (!firestore || !profileAligned) return null;
    return collection(firestore, "delegate_invites");
  }, [firestore, profileAligned]);
  const { data: delegateInvites } =
    useCollection<DelegateInvite>(delegateInvitesQuery);

  const myClientsQuery = useMemoFirebase(() => {
    if (
      !firestore ||
      !user ||
      !profileAligned ||
      !portalUid ||
      !isClientePortalRole(user.role)
    ) {
      return null;
    }
    return query(
      collection(firestore, "clients"),
      where("userId", "==", portalUid),
    );
  }, [firestore, user, profileAligned, portalUid]);
  const { data: myClients } = useCollection<Client>(myClientsQuery);

  const myEmpreendedoresQuery = useMemoFirebase(() => {
    if (
      !firestore ||
      !user ||
      !profileAligned ||
      !portalUid ||
      !isClientePortalRole(user.role)
    ) {
      return null;
    }
    return query(
      collection(firestore, "empreendedores"),
      where("userId", "==", portalUid),
    );
  }, [firestore, user, profileAligned, portalUid]);
  const { data: myEmpreendedores } = useCollection<Empreendedor>(
    myEmpreendedoresQuery,
  );

  // Representante: clientes e empreendedores que aprovaram este usuário (approvedUserIds contém o UID do representante).
  const repUid = useMemo(
    () =>
      user?.role === "representative" && profileAligned
        ? resolvePortalAuthUid(user)
        : null,
    [user, profileAligned],
  );
  const myApprovedClientsAsRepQuery = useMemoFirebase(() => {
    if (!firestore || !repUid) return null;
    return query(
      collection(firestore, "clients"),
      where("approvedUserIds", "array-contains", repUid),
    );
  }, [firestore, repUid]);
  const { data: myApprovedClientsAsRep } = useCollection<Client>(
    myApprovedClientsAsRepQuery,
  );

  const myApprovedEmpreendedoresAsRepQuery = useMemoFirebase(() => {
    if (!firestore || !repUid) return null;
    return query(
      collection(firestore, "empreendedores"),
      where("approvedUserIds", "array-contains", repUid),
    );
  }, [firestore, repUid]);
  const { data: myApprovedEmpreendedoresAsRep } = useCollection<Empreendedor>(
    myApprovedEmpreendedoresAsRepQuery,
  );

  const consultorUid = useMemo(
    () =>
      user?.role === "consultor_representante" && profileAligned
        ? resolvePortalAuthUid(user)
        : null,
    [user, profileAligned],
  );

  const delegatePortalUid = useMemo(
    () =>
      profileAligned &&
      (user?.role === "representative" ||
        user?.role === "consultor_representante")
        ? resolvePortalAuthUid(user)
        : null,
    [user, profileAligned],
  );

  const myDelegateAccessRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !delegatePortalUid) return null;
    return query(
      collection(firestore, "access_requests"),
      where("requestedByUserId", "==", delegatePortalUid),
    );
  }, [firestore, delegatePortalUid]);
  const { data: myDelegateAccessRequests } = useCollection<AccessRequest>(
    myDelegateAccessRequestsQuery,
  );

  const myDelegatePendingCpfsCnpjs = useMemo(() => {
    if (!myDelegateAccessRequests?.length || !user) return [];
    const delegateRole =
      user.role === "consultor_representante"
        ? ("consultor_representante" as const)
        : ("representative" as const);
    return filterAccessRequestsForDelegate(
      myDelegateAccessRequests,
      delegateRole,
    )
      .filter((r) => r.status === "pending")
      .map((r) => r.cpfOfInterested)
      .filter(Boolean) as string[];
  }, [myDelegateAccessRequests, user]);
  const myApprovedClientsAsConsultorQuery = useMemoFirebase(() => {
    if (!firestore || !consultorUid) return null;
    return query(
      collection(firestore, "clients"),
      where("approvedConsultorIds", "array-contains", consultorUid),
    );
  }, [firestore, consultorUid]);
  const { data: myApprovedClientsAsConsultor } = useCollection<Client>(
    myApprovedClientsAsConsultorQuery,
  );
  const myApprovedEmpreendedoresAsConsultorQuery = useMemoFirebase(() => {
    if (!firestore || !consultorUid) return null;
    return query(
      collection(firestore, "empreendedores"),
      where("approvedConsultorIds", "array-contains", consultorUid),
    );
  }, [firestore, consultorUid]);
  const { data: myApprovedEmpreendedoresAsConsultor } =
    useCollection<Empreendedor>(myApprovedEmpreendedoresAsConsultorQuery);

  const clientByIdRef = useMemoFirebase(() => {
    if (
      !firestore ||
      !user ||
      !profileAligned ||
      !portalUid ||
      !isClientePortalRole(user.role)
    ) {
      return null;
    }
    return doc(firestore, "clients", portalUid);
  }, [firestore, user, profileAligned, portalUid]);
  const { data: clientById } = useDoc<Client>(clientByIdRef);
  const empreendedorByIdRef = useMemoFirebase(() => {
    if (
      !firestore ||
      !user ||
      !profileAligned ||
      !portalUid ||
      !isClientePortalRole(user.role)
    ) {
      return null;
    }
    return doc(firestore, "empreendedores", portalUid);
  }, [firestore, user, profileAligned, portalUid]);
  const { data: empreendedorById } = useDoc<Empreendedor>(empreendedorByIdRef);

  const linkedClientRef = useMemoFirebase(() => {
    if (!firestore || !clientProfile?.linkedClientId) return null;
    return doc(firestore, "clients", clientProfile.linkedClientId);
  }, [firestore, clientProfile?.linkedClientId]);
  const linkedEmpreendedorRef = useMemoFirebase(() => {
    if (!firestore || !clientProfile?.linkedEmpreendedorId) return null;
    return doc(firestore, "empreendedores", clientProfile.linkedEmpreendedorId);
  }, [firestore, clientProfile?.linkedEmpreendedorId]);
  const { data: linkedClient } = useDoc<Client>(linkedClientRef);
  const { data: linkedEmpreendedor } = useDoc<Empreendedor>(linkedEmpreendedorRef);

  const ownedEntitiesForMatch = useMemo(
    () => [
      ...(myClients ?? []),
      ...(myEmpreendedores ?? []),
      ...(clientById ? [clientById] : []),
      ...(empreendedorById ? [empreendedorById] : []),
      ...(linkedClient ? [linkedClient] : []),
      ...(linkedEmpreendedor ? [linkedEmpreendedor] : []),
    ],
    [
      myClients,
      myEmpreendedores,
      clientById,
      empreendedorById,
      linkedClient,
      linkedEmpreendedor,
    ],
  );

  const myCpfCnpjSet = useMemo(() => {
    const profile = clientProfile || user;
    return buildTitularCpfCnpjSet({
      profile: profile ?? undefined,
      myClients,
      myEmpreendedores,
      clientById: clientById ?? undefined,
      empreendedorById: empreendedorById ?? undefined,
      extraDocuments: [
        linkedClient?.cpfCnpj,
        linkedEmpreendedor?.cpfCnpj,
        ...ownedEntitiesForMatch.map((e) => e.cpfCnpj),
      ],
    });
  }, [
    myClients,
    myEmpreendedores,
    user,
    clientProfile,
    clientById,
    empreendedorById,
    linkedClient,
    linkedEmpreendedor,
    ownedEntitiesForMatch,
  ]);

  const titularDocumentList = useMemo(
    () => Array.from(myCpfCnpjSet),
    [myCpfCnpjSet],
  );

  useEffect(() => {
    if (!firestore || !portalUid || !user || !isClientePortalRole(user.role)) return;

    const profile = clientProfile || user;
    const documents = new Set<string>();
    const addDocToLink = (raw: string | undefined | null) => {
      const digits = normalizeDocumentDigits(raw ?? "");
      if (digits.length >= 11) documents.add(digits);
    };

    addDocToLink(profile?.cpf);
    addDocToLink(profile?.userCpf);
    profile?.cnpjs?.forEach(addDocToLink);
    myClients?.forEach((c) => addDocToLink(c.cpfCnpj));
    myEmpreendedores?.forEach((e) => addDocToLink(e.cpfCnpj));
    allPendingRequests?.forEach((r) => addDocToLink(r.cpfOfInterested));

    if (documents.size === 0) return;

    let cancelled = false;
    (async () => {
      for (const portalDocument of documents) {
        if (cancelled) return;
        try {
          await linkClientGestaoToExistingRecords(
            firestore,
            portalUid,
            portalDocument,
            { name: profile?.name ?? "", email: profile?.email ?? "" },
            profile?.linkedClientId ?? null,
            profile?.linkedEmpreendedorId ?? null,
          );
        } catch (e) {
          console.warn("Vínculo titular ↔ empreendedor:", portalDocument, e);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    firestore,
    portalUid,
    user,
    clientProfile,
    myClients,
    myEmpreendedores,
    allPendingRequests,
  ]);

  const pendingRequestsForMe = useMemo(
    () =>
      filterAccessRequestsForTitular(
        allPendingRequests,
        myCpfCnpjSet,
        ownedEntitiesForMatch,
      ),
    [allPendingRequests, myCpfCnpjSet, ownedEntitiesForMatch],
  );

  const approvedRequestsForMe = useMemo(
    () =>
      filterAccessRequestsForTitular(
        allApprovedRequests,
        myCpfCnpjSet,
        ownedEntitiesForMatch,
      ),
    [allApprovedRequests, myCpfCnpjSet, ownedEntitiesForMatch],
  );

  const approvedConsultorUids = useMemo(() => {
    const set = new Set<string>();
    myClients?.forEach((c) =>
      c.approvedConsultorIds?.forEach((uid) => set.add(uid)),
    );
    myEmpreendedores?.forEach((e) =>
      e.approvedConsultorIds?.forEach((uid) => set.add(uid)),
    );
    approvedRequestsForMe
      .filter((r) => getAccessRequestType(r) === "consultor_representante")
      .forEach((r) => {
        if (r.requestedByUserId) set.add(r.requestedByUserId);
      });
    return Array.from(set);
  }, [myClients, myEmpreendedores, approvedRequestsForMe]);

  // IDs de representantes aprovados (requestedByUserId dos pedidos aprovados).
  const approvedRepresentativeIds = useMemo(() => {
    const set = new Set<string>();
    approvedRequestsForMe
      .filter((r) => getAccessRequestType(r) === "representative")
      .forEach((r) => {
        if (r.requestedByUserId) set.add(r.requestedByUserId);
      });
    return Array.from(set);
  }, [approvedRequestsForMe]);

  // Carrega detalhes dos representantes aprovados para exibir na UI.
  useEffect(() => {
    const loadRepresentatives = async () => {
      if (!firestore || !user || !isClientePortalRole(user.role)) {
        setApprovedRepresentatives([]);
        return;
      }
      if (approvedRepresentativeIds.length === 0) {
        setApprovedRepresentatives([]);
        return;
      }
      setIsLoadingApprovedReps(true);
      try {
        const reps: AppUser[] = [];
        for (const repId of approvedRepresentativeIds) {
          try {
            const snap = await getDocs(
              query(collection(firestore, "users"), where("uid", "==", repId)),
            );
            snap.forEach((docSnap) => {
              reps.push({ ...(docSnap.data() as AppUser), id: docSnap.id });
            });
          } catch (e) {
            console.warn("Erro ao carregar representante aprovado", repId, e);
          }
        }
        setApprovedRepresentatives(reps);
      } finally {
        setIsLoadingApprovedReps(false);
      }
    };
    loadRepresentatives();
  }, [firestore, user, approvedRepresentativeIds]);

  useEffect(() => {
    const loadConsultors = async () => {
      if (!firestore || !user || !isClientePortalRole(user.role)) {
        setApprovedConsultors([]);
        return;
      }
      if (approvedConsultorUids.length === 0) {
        setApprovedConsultors([]);
        return;
      }
      setIsLoadingApprovedConsultors(true);
      try {
        const consultors: AppUser[] = [];
        for (const consultorId of approvedConsultorUids) {
          try {
            const snap = await getDocs(
              query(
                collection(firestore, "users"),
                where("uid", "==", consultorId),
              ),
            );
            snap.forEach((docSnap) => {
              consultors.push({
                ...(docSnap.data() as AppUser),
                id: docSnap.id,
              });
            });
          } catch (e) {
            console.warn("Erro ao carregar consultor aprovado", consultorId, e);
          }
        }
        setApprovedConsultors(consultors);
      } finally {
        setIsLoadingApprovedConsultors(false);
      }
    };
    loadConsultors();
  }, [firestore, user, approvedConsultorUids]);

  /** Lista de representantes que solicitam ou têm acesso aos dados do cliente sendo editado (para exibir no form quando perfil = cliente). */
  const representativesForClientInDialog = useMemo((): {
    id: string;
    requestedByName: string;
    requestedByUserId: string;
    status: string;
    representativeCpf?: string;
  }[] => {
    if (isClientePortalRole(user?.role))
      return (pendingRequestsForMe || []).map((r) => ({
        id: r.id,
        requestedByName: r.requestedByName,
        requestedByUserId: r.requestedByUserId,
        status: r.status,
      }));
    if (
      !editingUser ||
      !isClientePortalRole(editingUser.role) ||
      !allPendingRequests
    )
      return [];
    const titularDocs = buildTitularCpfCnpjSet({
      profile: editingUser,
      extraDocuments: editingUser.cnpjs ?? [],
    });
    if (titularDocs.size === 0) return [];
    return allPendingRequests
      .filter((r: AccessRequest) =>
        accessRequestMatchesTitularDocuments(r, titularDocs),
      )
      .map((r: AccessRequest) => ({
        id: r.id,
        requestedByName: r.requestedByName,
        requestedByUserId: r.requestedByUserId,
        status: r.status,
        representativeCpf:
          (appUsers || []).find((u: AppUser) => u.id === r.requestedByUserId)
            ?.userCpf ||
          (appUsers || []).find((u: AppUser) => u.id === r.requestedByUserId)
            ?.cpf,
      }));
  }, [
    user?.role,
    pendingRequestsForMe,
    editingUser,
    allPendingRequests,
    appUsers,
  ]);

  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(
    null,
  );
  const handleResolveAccessRequest = async (
    requestId: string,
    approve: boolean,
  ) => {
    if (!firestore || !auth || !user || !isClientePortalRole(user.role)) return;
    setResolvingRequestId(requestId);
    try {
      const request = pendingRequestsForMe.find((r) => r.id === requestId);
      if (!request) return;
      const requestRef = doc(firestore, "access_requests", requestId);
      await updateDoc(requestRef, {
        status: approve ? "approved" : "rejected",
        resolvedAt: new Date().toISOString(),
        resolvedByUserId: user.id,
      });
      if (approve) {
        const userIdToAdd = request.requestedByUserId;
        const cpfNorm = normalizeDocumentDigits(request.cpfOfInterested || "");
        const matchesDoc = (entity: { cpfCnpj?: string; id?: string }) =>
          normalizeDocumentDigits(entity.cpfCnpj) === cpfNorm;

        const clientPool = [
          ...(myClients ?? []),
          ...(clientById ? [clientById] : []),
          ...(linkedClient ? [linkedClient] : []),
        ];
        const empreendedorPool = [
          ...(myEmpreendedores ?? []),
          ...(empreendedorById ? [empreendedorById] : []),
          ...(linkedEmpreendedor ? [linkedEmpreendedor] : []),
        ];

        let clientsToUpdate = clientPool.filter(matchesDoc);
        let empreendedoresToUpdate = empreendedorPool.filter(matchesDoc);

        if (clientsToUpdate.length === 0 && empreendedoresToUpdate.length === 0) {
          const lookup = await lookupClientAndEmpreendedorByDocument(
            firestore,
            request.cpfOfInterested || "",
          );
          if (lookup.client?.id) {
            const linkedClientRecord = {
              ...lookup.client,
              id: lookup.client.id,
            } as Client;
            clientsToUpdate = [linkedClientRecord];
            if (portalUid) {
              await updateDoc(doc(firestore, "clients", lookup.client.id), {
                userId: portalUid,
              });
            }
          }
          if (lookup.empreendedor?.id) {
            const linkedEmpRecord = {
              ...lookup.empreendedor,
              id: lookup.empreendedor.id,
            } as Empreendedor;
            empreendedoresToUpdate = [linkedEmpRecord];
            if (portalUid) {
              await updateDoc(doc(firestore, "empreendedores", lookup.empreendedor.id), {
                userId: portalUid,
              });
            }
          }
        }
        const isConsultorRequest =
          getAccessRequestType(request) === "consultor_representante";
        for (const c of clientsToUpdate) {
          await updateDoc(doc(firestore, "clients", c.id), isConsultorRequest
            ? {
                approvedConsultorIds: arrayUnion(userIdToAdd),
                primaryConsultorUid: userIdToAdd,
              }
            : {
                approvedUserIds: arrayUnion(userIdToAdd),
              });
        }
        for (const e of empreendedoresToUpdate) {
          await updateDoc(doc(firestore, "empreendedores", e.id), isConsultorRequest
            ? {
                approvedConsultorIds: arrayUnion(userIdToAdd),
                primaryConsultorUid: userIdToAdd,
              }
            : {
                approvedUserIds: arrayUnion(userIdToAdd),
              });
        }
        if (isConsultorRequest && portalUid) {
          await createConsultorAssignment(firestore, {
            consultorUid: userIdToAdd,
            titularUid: portalUid,
            clientId: clientsToUpdate[0]?.id,
            empreendedorIds: empreendedoresToUpdate.map((e) => e.id),
            assignedByUid: portalUid,
          });
        }
      }
      toast({
        title: approve ? "Acesso aprovado" : "Pedido rejeitado",
        description: approve
          ? getAccessRequestType(request) === "consultor_representante"
            ? "O consultor poderá operar seus dados ambientais."
            : "O usuário poderá acessar seus dados."
          : "O pedido foi recusado.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível processar. Tente novamente.",
      });
    } finally {
      setResolvingRequestId(null);
    }
  };

  const handleRevokeRepresentativeAccess = async (
    representativeUserId: string,
  ) => {
    if (!firestore || !user || !isClientePortalRole(user.role)) return;
    setRevokingRepresentativeId(representativeUserId);
    try {
      const cpfNormsToMatch = new Set<string>();
      const addCpfFrom = (entity: { cpfCnpj?: string } | undefined | null) => {
        if (!entity?.cpfCnpj) return;
        const digits = entity.cpfCnpj.replace(/\D/g, "");
        if (digits.length >= 11) {
          cpfNormsToMatch.add(digits);
          cpfNormsToMatch.add(entity.cpfCnpj);
        }
      };
      myClients?.forEach(addCpfFrom);
      myEmpreendedores?.forEach(addCpfFrom);

      // Remove o representante das listas approvedUserIds em todos os clientes/empreendedores associados.
      const updates: Promise<unknown>[] = [];
      (myClients || []).forEach((c) => {
        if (c.approvedUserIds?.includes(representativeUserId)) {
          updates.push(
            updateDoc(doc(firestore, "clients", c.id), {
              approvedUserIds: arrayRemove(representativeUserId),
            }),
          );
        }
      });
      (myEmpreendedores || []).forEach((e) => {
        if (e.approvedUserIds?.includes(representativeUserId)) {
          updates.push(
            updateDoc(doc(firestore, "empreendedores", e.id), {
              approvedUserIds: arrayRemove(representativeUserId),
            }),
          );
        }
      });
      await Promise.all(updates);

      setApprovedRepresentatives((prev) =>
        prev.filter(
          (rep) =>
            rep.uid !== representativeUserId && rep.id !== representativeUserId,
        ),
      );

      toast({
        title: "Acesso revogado",
        description:
          "O representante não poderá mais acessar seus dados como titular.",
      });
    } catch (e) {
      console.error("Erro ao revogar acesso de representante", e);
      toast({
        variant: "destructive",
        title: "Erro ao revogar acesso",
        description: "Não foi possível revogar o acesso. Tente novamente.",
      });
    } finally {
      setRevokingRepresentativeId(null);
    }
  };

  const handleRevokeConsultorAccess = async (consultorUserId: string) => {
    if (!firestore || !user || !isClientePortalRole(user.role)) return;
    setRevokingConsultorId(consultorUserId);
    try {
      const updates: Promise<unknown>[] = [];
      (myClients || []).forEach((c) => {
        if (c.approvedConsultorIds?.includes(consultorUserId)) {
          updates.push(
            updateDoc(doc(firestore, "clients", c.id), {
              approvedConsultorIds: arrayRemove(consultorUserId),
              ...(c.primaryConsultorUid === consultorUserId
                ? { primaryConsultorUid: "" }
                : {}),
            }),
          );
        }
      });
      (myEmpreendedores || []).forEach((e) => {
        if (e.approvedConsultorIds?.includes(consultorUserId)) {
          updates.push(
            updateDoc(doc(firestore, "empreendedores", e.id), {
              approvedConsultorIds: arrayRemove(consultorUserId),
              ...(e.primaryConsultorUid === consultorUserId
                ? { primaryConsultorUid: "" }
                : {}),
            }),
          );
        }
      });
      await Promise.all(updates);
      setApprovedConsultors((prev) =>
        prev.filter(
          (c) => c.uid !== consultorUserId && c.id !== consultorUserId,
        ),
      );
      toast({
        title: "Acesso revogado",
        description:
          "O consultor não poderá mais operar seus dados ambientais.",
      });
    } catch (e) {
      console.error("Erro ao revogar acesso de consultor", e);
      toast({
        variant: "destructive",
        title: "Erro ao revogar acesso",
        description: "Não foi possível revogar o acesso. Tente novamente.",
      });
    } finally {
      setRevokingConsultorId(null);
    }
  };

  if (isClientePortalRole(user?.role)) {
    const clientUser = clientProfile || user;

    return (
      <>
        <div className="flex flex-col h-full">
          <PageHeader title="Meu Perfil" />
          <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
            <TooltipProvider>
              {isLoadingProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Carregando Perfil...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              )}
              {clientUser && !isLoadingProfile && (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle>{clientUser.name}</CardTitle>
                          <CardDescription>
                            Suas informações de perfil e de acesso.
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(clientUser);
                            setIsDialogOpen(true);
                          }}
                        >
                          Atualizar / Editar Cadastro
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <h4 className="font-semibold text-foreground">
                        Informações Pessoais
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem label="Email" value={clientUser.email} />
                        <DetailItem
                          label="Telefone"
                          value={(clientUser as any).phone}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem
                          label="CPF"
                          value={formatCpfDisplay(
                            clientUser.cpf || (clientUser as any).userCpf,
                          )}
                        />
                        <DetailItem
                          label="Data de Nascimento"
                          value={
                            clientUser.dataNascimento
                              ? new Date(
                                  clientUser.dataNascimento,
                                ).toLocaleDateString("pt-BR")
                              : ""
                          }
                        />
                      </div>
                      <DetailItem
                        label="CNPJs Vinculados"
                        value={clientUser.cnpjs}
                      />
                      <Separator />
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">
                          Plano e Acesso
                        </h4>
                        <Button
                          size="sm"
                          onClick={() => setIsUpgradeOpen(true)}
                          className="gap-1.5 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                          Alterar Plano
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <DetailItem
                          label="Pacote Contratado"
                          value={getPackageLabel((clientUser as any).package)}
                        />
                        <DetailItem
                          label="Nível de Acesso"
                          value={getRoleText(clientUser.role)}
                        />
                        <DetailItem
                          label="Status da Conta"
                          value={
                            clientUser.status === "active" ? "Ativo" : "Inativo"
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {isClientePortalRole(user?.role) ? (
                  <>
                  <TitularDelegateInviteCard
                    titularUser={(clientProfile || user)!}
                    titularDocuments={titularDocumentList}
                  />
                  <Card id="access-requests-card">
                    <CardHeader>
                      <CardTitle>
                        Consentimento de acesso (representantes e consultores)
                      </CardTitle>
                      <CardDescription>
                        Aceite ou recuse pedidos de representantes e
                        consultores-representantes que solicitaram acesso aos
                        seus dados (CPF/CNPJ do titular ou do empreendedor).
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {pendingRequestsForMe.length > 0 ? (
                        pendingRequestsForMe.map((req) => (
                          <div
                            key={req.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-foreground">
                                  {req.requestedByName}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {getAccessRequestType(req) ===
                                  "consultor_representante"
                                    ? "Consultor-Representante"
                                    : "Representante"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                E-mail: {req.requestedByEmail}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Solicitou acesso ao CPF/CNPJ:{" "}
                                {formatCpfCnpjDisplay(req.cpfOfInterested)}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={resolvingRequestId === req.id}
                                    onClick={() =>
                                      handleResolveAccessRequest(req.id, false)
                                    }
                                  >
                                    Recusar
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Recusar o pedido de acesso deste
                                    representante aos seus dados
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    disabled={resolvingRequestId === req.id}
                                    onClick={() =>
                                      handleResolveAccessRequest(req.id, true)
                                    }
                                  >
                                    Aceitar
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Aceitar o pedido e conceder a este
                                    representante acesso aos seus dados
                                    (cliente/empreendedor)
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground py-2">
                            Nenhum pedido de acesso pendente. Quando um
                            representante ou consultor solicitar acesso, você
                            poderá aceitar ou recusar aqui.
                          </p>
                          <p className="text-xs text-muted-foreground border-t pt-2">
                            Se alguém já pediu acesso ao CNPJ do empreendedor e
                            não aparece aqui: confira se o{" "}
                            <strong>CNPJ está salvo</strong> no seu perfil ou no
                            cadastro de Empreendedores vinculado à sua conta, e se
                            o solicitante informou o{" "}
                            <strong>mesmo documento</strong> (com ou sem
                            pontuação).
                          </p>
                        </div>
                      )}

                      {/* Representantes já aprovados */}
                      <div className="space-y-2 border-t pt-3">
                        <h4 className="text-sm font-semibold text-foreground">
                          Representantes com acesso aprovado aos seus dados
                        </h4>
                        {isLoadingApprovedReps ? (
                          <p className="text-xs text-muted-foreground">
                            Carregando representantes...
                          </p>
                        ) : approvedRepresentatives.length > 0 ? (
                          <div className="space-y-2">
                            {approvedRepresentatives.map((rep) => (
                              <div
                                key={rep.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border px-3 py-2 bg-muted/40"
                              >
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {rep.name}{" "}
                                    <span className="text-xs text-muted-foreground">
                                      (Representante)
                                    </span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {rep.email}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive border-destructive hover:bg-destructive/10"
                                    disabled={
                                      revokingRepresentativeId === rep.uid
                                    }
                                    onClick={() =>
                                      handleRevokeRepresentativeAccess(
                                        rep.uid || rep.id,
                                      )
                                    }
                                  >
                                    {revokingRepresentativeId === rep.uid
                                      ? "Revogando..."
                                      : "Revogar acesso"}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Nenhum representante aprovado no momento. Assim que
                            você aceitar um pedido, ele aparecerá aqui com a
                            opção de revogar o acesso a qualquer momento.
                          </p>
                        )}
                      </div>
                      <TitularSentInvitesList
                        invites={delegateInvites}
                        titularUid={portalUid || user?.id || ""}
                      />
                    </CardContent>
                  </Card>

                  <Card id="consultor-access-requests-card">
                    <CardHeader>
                      <CardTitle>
                        Consultores-representantes aprovados
                      </CardTitle>
                      <CardDescription>
                        Pedidos pendentes de consultores aparecem no card
                        &quot;Consentimento de acesso&quot; acima. Aqui ficam os
                        consultores já autorizados.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 border-t pt-3">
                        <h4 className="text-sm font-semibold text-foreground">
                          Consultores com acesso aprovado
                        </h4>
                        {isLoadingApprovedConsultors ? (
                          <p className="text-xs text-muted-foreground">
                            Carregando consultores...
                          </p>
                        ) : approvedConsultors.length > 0 ? (
                          <div className="space-y-2">
                            {approvedConsultors.map((consultor) => (
                              <div
                                key={consultor.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border px-3 py-2 bg-muted/40"
                              >
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {consultor.name}{" "}
                                    <span className="text-xs text-muted-foreground">
                                      (Consultor-Representante)
                                    </span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {consultor.email}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive hover:bg-destructive/10"
                                  disabled={
                                    revokingConsultorId === consultor.uid
                                  }
                                  onClick={() =>
                                    handleRevokeConsultorAccess(
                                      consultor.uid || consultor.id,
                                    )
                                  }
                                >
                                  {revokingConsultorId === consultor.uid
                                    ? "Revogando..."
                                    : "Revogar acesso"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Nenhum consultor aprovado no momento.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </>
                  ) : null}

                  {isClientePortalRole(user?.role) && accessRequestsError && (
                    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
                      <CardContent className="pt-4 space-y-2">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Não foi possível carregar os pedidos de acesso.
                        </p>
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          Para o titular poder aprovar ou rejeitar
                          representantes, o administrador deve publicar as
                          regras do Firestore: no terminal, na pasta do projeto,
                          execute{" "}
                          <code className="rounded bg-amber-200/50 dark:bg-amber-900/50 px-1">
                            npm run deploy:rules
                          </code>
                          . É preciso estar logado no Firebase (
                          <code className="rounded bg-amber-200/50 dark:bg-amber-900/50 px-1">
                            firebase login
                          </code>
                          ).
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-destructive/30">
                    <CardHeader>
                      <CardTitle className="text-destructive flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Exclusão de Dados
                      </CardTitle>
                      <CardDescription>
                        Você pode remover apenas seu usuário de acesso (login)
                        ou solicitar a exclusão completa da conta. Os dados nos
                        submenus Clientes e Empreendedores só podem ser
                        excluídos pelo administrador.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (clientUser) {
                            setUserToDelete(clientUser);
                            setIsAlertOpen(true);
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir usuário de acesso
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Remove apenas seu perfil de acesso. Você será deslogado.
                        Dados em Clientes/Empreendedores não são alterados.
                      </p>
                      <Separator />
                      <Button
                        variant="destructive"
                        onClick={() => setIsDeleteAccountOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir minha conta e dados
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Remove sua conta de autenticação e seu perfil.
                        Irreversível.
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </TooltipProvider>
          </main>
        </div>

        <UpgradeDialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} />

        <AlertDialog
          open={isDeleteAccountOpen}
          onOpenChange={setIsDeleteAccountOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Excluir sua conta permanentemente?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação{" "}
                <span className="font-semibold">não pode ser desfeita</span>. Ao
                confirmar, todos os seus dados pessoais, incluindo nome, e-mail,
                telefone, CPF e histórico de uso serão removidos permanentemente
                da plataforma AmbientaR. Você perderá acesso ao sistema e não
                poderá recuperar sua conta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingAccount}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingAccount
                  ? "Excluindo..."
                  : "Sim, excluir minha conta"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Excluir seu usuário de acesso?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Será removido apenas o seu <strong>usuário de acesso</strong>{" "}
                (perfil de login). Você será deslogado. Os dados nos submenus{" "}
                <strong>Clientes</strong> e <strong>Empreendedores</strong> não
                serão alterados; apenas o administrador pode excluí-los.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Sim, excluir meu usuário de acesso
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-xl h-full max-h-[90dvh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Atualizar Cadastro</DialogTitle>
              <DialogDescription>
                Altere seus dados de acesso e informações pessoais.
              </DialogDescription>
            </DialogHeader>
            <UserForm
              currentUser={editingUser || clientUser}
              onSuccess={() => setIsDialogOpen(false)}
              representativesForThisClient={representativesForClientInDialog}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const approvedTitularesForConsultor =
    user?.role !== "consultor_representante"
      ? []
      : (() => {
          const byCpf = new Map<
            string,
            { name: string; cpfCnpj: string; type: "cliente" | "empreendedor" }
          >();
          const add = (
            item: { name: string; cpfCnpj?: string },
            type: "cliente" | "empreendedor",
          ) => {
            const key = (item.cpfCnpj || "").replace(/\D/g, "");
            if (key.length >= 11 && !byCpf.has(key)) {
              byCpf.set(key, {
                name: item.name,
                cpfCnpj: item.cpfCnpj || "",
                type,
              });
            }
          };
          myApprovedClientsAsConsultor?.forEach((c) => add(c, "cliente"));
          myApprovedEmpreendedoresAsConsultor?.forEach((e) =>
            add(e, "empreendedor"),
          );
          return Array.from(byCpf.values());
        })();

  if (user?.role === "consultor_representante") {
    const consultorUser = clientProfile || user;

    return (
      <>
        <div className="flex flex-col h-full">
          <PageHeader title="Meu Perfil" />
          <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
            <TooltipProvider>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>{consultorUser?.name}</CardTitle>
                      <CardDescription>
                        Perfil de consultor-representante. Opere licenças,
                        outorgas e cadastros dos titulares que aprovaram sua
                        carteira.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUser(consultorUser || null);
                        setIsDialogOpen(true);
                      }}
                    >
                      Atualizar / Editar Cadastro
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DetailItem label="Email" value={consultorUser?.email} />
                  <DetailItem
                    label="Nível de Acesso"
                    value={getRoleText("consultor_representante")}
                  />
                </CardContent>
              </Card>

              <DelegateInviteAckCard
                user={consultorUser as AppUser}
                invites={delegateInvites}
              />

              <DelegateAccessPortfolioCard
                role="consultor_representante"
                accessRequests={myDelegateAccessRequests}
                approvedTitulares={approvedTitularesForConsultor}
                requesterUserId={consultorUid || user?.id || ""}
                requesterName={consultorUser?.name || ""}
                requesterEmail={consultorUser?.email || ""}
              />
            </TooltipProvider>
          </main>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-xl h-full max-h-[90dvh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Atualizar Cadastro</DialogTitle>
            </DialogHeader>
            <UserForm
              currentUser={editingUser || consultorUser}
              onSuccess={() => setIsDialogOpen(false)}
              representativeRequestedCpfsCnpjs={myDelegatePendingCpfsCnpjs}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Lista única de titulares que aprovaram este representante (por CPF para deduplicar cliente/empreendedor).
  // Computação sem hook para evitar violação de "Rules of Hooks" por conta de retornos condicionais.
  const approvedTitularesForRep =
    user?.role !== "representative"
      ? []
      : (() => {
          const byCpf = new Map<
            string,
            { name: string; cpfCnpj: string; type: "cliente" | "empreendedor" }
          >();
          const add = (
            item: { name: string; cpfCnpj?: string },
            type: "cliente" | "empreendedor",
          ) => {
            const key = (item.cpfCnpj || "").replace(/\D/g, "");
            if (key.length >= 11 && !byCpf.has(key)) {
              byCpf.set(key, {
                name: item.name,
                cpfCnpj: item.cpfCnpj || "",
                type,
              });
            }
          };
          myApprovedClientsAsRep?.forEach((c) => add(c, "cliente"));
          myApprovedEmpreendedoresAsRep?.forEach((e) => add(e, "empreendedor"));
          return Array.from(byCpf.values());
        })();

  // Perfil do representante: lista de titulares que aprovaram seu acesso.
  if (user?.role === "representative") {
    const repUser = clientProfile || user;

    return (
      <>
        <div className="flex flex-col h-full">
          <PageHeader title="Meu Perfil" />
          <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
            <TooltipProvider>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>{repUser?.name}</CardTitle>
                      <CardDescription>
                        Perfil de representante. Você tem acesso aos dados dos
                        titulares listados abaixo.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUser(repUser || null);
                        setIsDialogOpen(true);
                      }}
                    >
                      Atualizar / Editar Cadastro
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold text-foreground">
                    Informações Pessoais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Email" value={repUser?.email} />
                    <DetailItem
                      label="Telefone"
                      value={(repUser as any)?.phone}
                    />
                  </div>
                  <DetailItem
                    label="CPF pessoal"
                    value={formatCpfDisplay((repUser as any)?.userCpf)}
                  />
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem
                      label="Nível de Acesso"
                      value={getRoleText(repUser?.role || "representative")}
                    />
                    <DetailItem
                      label="Status da Conta"
                      value={repUser?.status === "active" ? "Ativo" : "Inativo"}
                    />
                  </div>
                </CardContent>
              </Card>

              <DelegateInviteAckCard
                user={repUser as AppUser}
                invites={delegateInvites}
              />

              <DelegateAccessPortfolioCard
                role="representative"
                accessRequests={myDelegateAccessRequests}
                approvedTitulares={approvedTitularesForRep}
                requesterUserId={repUid || user?.id || ""}
                requesterName={repUser?.name || ""}
                requesterEmail={repUser?.email || ""}
                showCarteiraLink={false}
              />

              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Exclusão de Dados
                  </CardTitle>
                  <CardDescription>
                    Você pode remover apenas seu usuário de acesso (login). Os
                    dados dos clientes/empreendedores são dos titulares e só
                    podem ser excluídos por eles ou pelo administrador.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (repUser) {
                        setUserToDelete(repUser);
                        setIsAlertOpen(true);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir meu usuário de acesso
                  </Button>
                </CardContent>
              </Card>
            </TooltipProvider>
          </main>
        </div>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Excluir seu usuário de acesso?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Será removido apenas o seu usuário de acesso (perfil de login).
                Você será deslogado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Sim, excluir meu usuário de acesso
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-xl h-full max-h-[90dvh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Atualizar Cadastro</DialogTitle>
              <DialogDescription>
                Altere seus dados de acesso e informações pessoais.
              </DialogDescription>
            </DialogHeader>
            <UserForm
              currentUser={editingUser || repUser}
              onSuccess={() => setIsDialogOpen(false)}
              representativeRequestedCpf={
                myDelegatePendingCpfsCnpjs[0] ?? undefined
              }
              representativeRequestedCpfsCnpjs={myDelegatePendingCpfsCnpjs}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Usuários">
          {user?.role === "admin" && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Adicionar Usuário
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
          {user?.role === "admin" && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Liberar e-mail bloqueado
                </CardTitle>
                <CardDescription>
                  Use quando o perfil já foi apagado mas o login (Firebase
                  Auth) ainda impede criar o mesmo e-mail — ex.: após exclusão
                  antiga só no Firestore.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(adminSdkConfigured === false || showOrphanEmailSetupHelp) && (
                  <FirebaseAdminSetupHelp
                    variant="banner"
                    emailHint={orphanEmail.trim() || undefined}
                  />
                )}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor="orphan-email">E-mail</Label>
                    <Input
                      id="orphan-email"
                      type="email"
                      placeholder="financeiro@exemplo.com.br"
                      value={orphanEmail}
                      onChange={(e) => setOrphanEmail(e.target.value)}
                      disabled={isReleasingOrphanEmail}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isReleasingOrphanEmail || !orphanEmail.trim()}
                    onClick={handleReleaseOrphanEmail}
                  >
                    {isReleasingOrphanEmail ? "Liberando…" : "Liberar e-mail"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({
                      length:
                        user?.role === "admin" ||
                        user?.role === "supervisor" ||
                        user?.role === "diretor_fauna"
                          ? 5
                          : user?.role === "financial"
                            ? 3
                            : 1,
                    }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className="h-28 w-full rounded-lg"
                      />
                    ))}
                  {appUsers?.map((appUser) => (
                    <Card
                      key={appUser.id}
                      className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4">
                          <div className="min-w-0 space-y-2">
                            <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                              {appUser.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "h-2.5 w-2.5 shrink-0 rounded-full",
                                    isUserConsideredOnline(appUser, presenceNow)
                                      ? "bg-green-500"
                                      : "bg-red-500",
                                  )}
                                />
                                {isUserConsideredOnline(appUser, presenceNow)
                                  ? "Online"
                                  : "Offline"}
                              </span>
                              <span className="hidden sm:inline">·</span>
                              <span className="hidden sm:inline break-all">
                                {appUser.email}
                              </span>
                            </div>
                            <p className="hidden text-sm text-muted-foreground lg:block">
                              {formatCpfCnpjDisplay(
                                appUser.cpf ||
                                  (appUser.cnpjs && appUser.cnpjs[0]),
                              ) || "CPF/CNPJ não informado"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {getRoleText(appUser.role)}
                              </span>
                              <Badge
                                variant={
                                  appUser.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                                className={cn(
                                  appUser.status === "active" &&
                                    "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                                  appUser.status === "inactive" &&
                                    "bg-slate-500/20 text-slate-700 border-slate-500/30 hover:bg-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
                                  appUser.status === "pending_invite" &&
                                    "bg-amber-500/20 text-amber-800 border-amber-500/30 dark:text-amber-300",
                                )}
                              >
                                {appUser.status === "active"
                                  ? "Ativo"
                                  : appUser.status === "pending_invite"
                                    ? "Convite pendente"
                                    : "Inativo"}
                              </Badge>
                            </div>
                          </div>
                          <Separator className="bg-border/60" />
                          <div className="flex flex-wrap items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 shrink-0"
                                  type="button"
                                  onClick={() => handleView(appUser)}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Visualizar</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Visualizar detalhes</p>
                              </TooltipContent>
                            </Tooltip>
                            {canEditUserInUsersList(
                              user?.role,
                              sessionUid ?? user?.uid ?? user?.id,
                              appUser,
                            ) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    type="button"
                                    onClick={() => handleEdit(appUser)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {appUser.id === sessionUid ||
                                    appUser.uid === sessionUid
                                      ? "Editar meu cadastro"
                                      : "Editar usuário"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {canDeleteUser(appUser) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                    type="button"
                                    onClick={() => openDeleteConfirm(appUser)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {(appUser.id === sessionTargetUid ||
                                      appUser.uid === sessionTargetUid) &&
                                    (isClientePortalRole(user?.role) ||
                                      user?.role === "representative")
                                      ? "Excluir usuário de acesso (apenas seus dados de acesso; Clientes/Empreendedores não são alterados)"
                                      : "Excluir usuário (somente administrador)"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {(user?.role === "admin" ||
                              user?.role === "supervisor") && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() =>
                                        handleGenerateLog(appUser, "txt")
                                      }
                                    >
                                      <FileText className="h-4 w-4" />
                                      <span className="sr-only">
                                        Exportar log como .txt
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Exportar log como .txt</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() =>
                                        handleGenerateLog(appUser, "pdf")
                                      }
                                    >
                                      <FileDown className="h-4 w-4" />
                                      <span className="sr-only">
                                        Exportar log como .pdf
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Exportar log como .pdf</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!isLoading && (!appUsers || appUsers.length === 0) && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhum usuário encontrado.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl h-full max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar usuário" : "Adicionar usuário"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do usuário abaixo.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            currentUser={editingUser}
            onSuccess={() => setIsDialogOpen(false)}
            representativeRequestedCpf={
              editingUser?.role === "representative"
                ? (allPendingRequests?.find(
                    (r) => r.requestedByUserId === editingUser.id,
                  )?.cpfOfInterested ?? null)
                : undefined
            }
            representativesForThisClient={representativesForClientInDialog}
            representativeRequestedCpfsCnpjs={
              editingUser?.role === "representative"
                ? ((allPendingRequests
                    ?.filter((r) => r.requestedByUserId === editingUser.id)
                    .map((r) => r.cpfOfInterested)
                    .filter(Boolean) as string[]) ?? [])
                : undefined
            }
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{viewingUser?.name}</DialogTitle>
            <DialogDescription>
              Detalhes do usuário cadastrado no sistema.
            </DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <DetailItem label="Nome Completo" value={viewingUser.name} />
              <DetailItem label="Email" value={viewingUser.email} />
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Nível de Acesso"
                  value={getRoleText(viewingUser.role)}
                />
                <DetailItem
                  label="Status da Conta"
                  value={viewingUser.status === "active" ? "Ativo" : "Inativo"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Status Online"
                  value={
                    isUserConsideredOnline(viewingUser, presenceNow)
                      ? "Online"
                      : "Offline"
                  }
                />
                <DetailItem
                  label="Último Login"
                  value={
                    viewingUser.lastLogin
                      ? new Date(
                          viewingUser.lastLogin.seconds * 1000,
                        ).toLocaleString("pt-BR")
                      : "Nunca"
                  }
                />
              </div>
              <Separator />
              <h4 className="font-semibold text-foreground">Documentos</h4>
              <DetailItem
                label="CPF"
                value={formatCpfDisplay(
                  viewingUser.cpf || (viewingUser as any).userCpf,
                )}
              />
              <DetailItem label="CNPJs Vinculados" value={viewingUser.cnpjs} />
              <DetailItem
                label="Data de Nascimento"
                value={
                  viewingUser.dataNascimento
                    ? new Date(viewingUser.dataNascimento).toLocaleDateString(
                        "pt-BR",
                      )
                    : ""
                }
              />
              {viewingUser.platformSubscriptionAcceptanceId ? (
                <>
                  <Separator />
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Contrato de plataforma</p>
                      <p className="text-xs text-muted-foreground">
                        Cópia do aceite no cadastro (somente admin altera ou apaga).
                      </p>
                    </div>
                    <PlatformSubscriptionAcceptanceViewer
                      acceptanceId={viewingUser.platformSubscriptionAcceptanceId}
                      userLabel={viewingUser.name}
                      compact
                    />
                  </div>
                </>
              ) : null}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToDelete &&
              sessionTargetUid &&
              (userToDelete.id === sessionTargetUid ||
                userToDelete.uid === sessionTargetUid) &&
              (isClientePortalRole(user?.role) ||
                (user?.role as UserRole | undefined) === "representative")
                ? "Excluir seu usuário de acesso?"
                : "Você tem certeza?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete &&
              sessionTargetUid &&
              (userToDelete.id === sessionTargetUid ||
                userToDelete.uid === sessionTargetUid) &&
              (isClientePortalRole(user?.role) ||
                (user?.role as UserRole | undefined) === "representative") ? (
                <>
                  Será removido apenas o seu <strong>usuário de acesso</strong>{" "}
                  (perfil de login). Você será deslogado. Os dados nos submenus{" "}
                  <strong>Clientes</strong> e <strong>Empreendedores</strong>{" "}
                  não serão alterados; apenas o administrador pode excluí-los.
                </>
              ) : (
                <>
                  Esta ação não pode ser desfeita. Remove o perfil, a conta de
                  login (Firebase Auth), notificações e pedidos de acesso de{" "}
                  <span className="font-semibold">{userToDelete?.name}</span>.
                  O e-mail ficará livre para novo cadastro.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {userToDelete &&
              sessionTargetUid &&
              (userToDelete.id === sessionTargetUid ||
                userToDelete.uid === sessionTargetUid) &&
              (isClientePortalRole(user?.role) ||
                (user?.role as UserRole | undefined) === "representative")
                ? "Sim, excluir meu usuário de acesso"
                : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
