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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  MoreHorizontal,
  PlusCircle,
  History,
  Pencil,
  Trash2,
  Eye,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AppUser,
  AuditLog,
  CompanySettings,
  AccessRequest,
  Client,
  Empreendedor,
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
import {
  fetchBrandingImageAsBase64,
  getImageDimensions,
  calcPdfImageSize,
  applyImageOpacity,
} from "@/lib/branding-pdf";
import { useLocalBranding } from "@/hooks/use-local-branding";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { deleteUser } from "firebase/auth";
import jsPDF from "jspdf";
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
import { formatCpfDisplay, formatCpfCnpjDisplay } from "@/lib/masks";

/** Adiciona numeração de páginas no rodapé no formato página/total. */
function addPageNumbers(doc: jsPDF, bottomMarginMm: number = 10) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${i}/${pageCount}`,
      pageWidth - bottomMarginMm,
      pageHeight - bottomMarginMm,
      { align: "right" },
    );
  }
}

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
  const [revokingRepresentativeId, setRevokingRepresentativeId] = useState<
    string | null
  >(null);
  const router = useRouter();

  const { firestore, auth, user } = useFirebase();
  const { toast } = useToast();

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
      ["sales", "technical", "gestor", "client", "representative", "advogado"].includes(
        user.role,
      )
    ) {
      return query(
        collection(firestore, "users"),
        where("uid", "==", user.uid),
      );
    }

    return query(
      collection(firestore, "users"),
      where("uid", "==", "invalid-uid-for-non-admins"),
    );
  }, [firestore, user]);

  const { data: appUsers, isLoading } = useCollection<AppUser>(usersQuery);

  const { data: brandingData } = useLocalBranding();

  const getRoleText = (role: AppUser["role"]) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "client":
        return "Cliente (Titular)";
      case "representative":
        return "Representante";
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

  const canDeleteUser = (target: AppUser | null) =>
    !!target &&
    (user?.role === "admin" ||
      ((user?.role === "client" || user?.role === "representative") &&
        target.id === user?.id));

  const handleDelete = () => {
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
    const isSelfDelete = userToDelete.id === user?.id;
    const userDocRef = doc(firestore, "users", userToDelete.id);
    deleteDoc(userDocRef)
      .then(async () => {
        if (user?.role === "admin" && !isSelfDelete) {
          logUserAction(firestore, auth, "delete_user", {
            deletedUserId: userToDelete.uid,
            deletedUserName: userToDelete.name,
          });
        }
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
          } catch (err: any) {
            await auth.signOut();
            if (err?.code === "auth/requires-recent-login") {
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
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: "delete",
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setUserToDelete(null);
      });
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
        const { default: jsPDF } = await import("jspdf");
        const doc = new jsPDF({ unit: "mm", format: "a4" });

        const headerBase64 = await fetchBrandingImageAsBase64(
          brandingData?.headerImageUrl,
        );
        const footerBase64 = await fetchBrandingImageAsBase64(
          brandingData?.footerImageUrl,
        );
        const watermarkBase64Raw = await fetchBrandingImageAsBase64(
          brandingData?.watermarkImageUrl,
        );
        const watermarkBase64 = watermarkBase64Raw
          ? await applyImageOpacity(watermarkBase64Raw, 0.15)
          : null;

        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 15;

        if (headerBase64) {
          const dims = await getImageDimensions(headerBase64);
          const { w, h } = calcPdfImageSize(dims, pageWidth - 20, 30);
          doc.addImage(headerBase64, "PNG", 10, 10, w, h);
          yPos = 10 + h + 5;
        }

        if (watermarkBase64) {
          const imgProps = doc.getImageProperties(watermarkBase64);
          const aspectRatio = imgProps.width / imgProps.height;
          const watermarkWidth = 100;
          const watermarkHeight = watermarkWidth / aspectRatio;
          doc.addImage(
            watermarkBase64,
            "PNG",
            (pageWidth - watermarkWidth) / 2,
            (pageHeight - watermarkHeight) / 2,
            watermarkWidth,
            watermarkHeight,
            undefined,
            "FAST",
          );
        }

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
              yPos = 15;
            }

            doc.text(splitText, 15, yPos);
            yPos += splitText.length * 5 + 5;
            doc.setDrawColor(230, 230, 230);
            doc.line(15, yPos - 2.5, pageWidth - 15, yPos - 2.5);
            yPos += 5;
          });
        }

        if (footerBase64) {
          const fDims = await getImageDimensions(footerBase64);
          const { w: fw, h: fh } = calcPdfImageSize(fDims, pageWidth - 20, 20);
          const totalPages = doc.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.addImage(footerBase64, "PNG", 10, pageHeight - fh - 5, fw, fh);
          }
        }
        // Numeração de páginas alinhada à direita no rodapé.
        addPageNumbers(doc, 10);

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
    if (!firestore || !user || user.role !== "client") return null;
    return doc(firestore, "users", user.id);
  }, [firestore, user]);
  const { data: clientProfile, isLoading: isLoadingProfile } =
    useDoc<AppUser>(clientProfileDocRef);

  const accessRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "access_requests"),
      where("status", "==", "pending"),
    );
  }, [firestore, user]);
  const { data: allPendingRequests, error: accessRequestsError } =
    useCollection<AccessRequest>(accessRequestsQuery);

  const approvedRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "access_requests"),
      where("status", "==", "approved"),
    );
  }, [firestore, user]);
  const { data: allApprovedRequests } = useCollection<AccessRequest>(
    approvedRequestsQuery,
  );

  const myClientsQuery = useMemoFirebase(() => {
    if (!firestore || !user || user.role !== "client") return null;
    return query(
      collection(firestore, "clients"),
      where("userId", "==", user.id),
    );
  }, [firestore, user]);
  const { data: myClients } = useCollection<Client>(myClientsQuery);

  const myEmpreendedoresQuery = useMemoFirebase(() => {
    if (!firestore || !user || user.role !== "client") return null;
    return query(
      collection(firestore, "empreendedores"),
      where("userId", "==", user.id),
    );
  }, [firestore, user]);
  const { data: myEmpreendedores } = useCollection<Empreendedor>(
    myEmpreendedoresQuery,
  );

  // Representante: clientes e empreendedores que aprovaram este usuário (approvedUserIds contém o UID do representante).
  const repUid = useMemo(
    () =>
      user?.role === "representative" && user
        ? user.id || (user as any).uid
        : null,
    [user],
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

  const clientByIdRef = useMemoFirebase(() => {
    if (!firestore || !user || user.role !== "client") return null;
    return doc(firestore, "clients", user.id);
  }, [firestore, user]);
  const { data: clientById } = useDoc<Client>(clientByIdRef);
  const empreendedorByIdRef = useMemoFirebase(() => {
    if (!firestore || !user || user.role !== "client") return null;
    return doc(firestore, "empreendedores", user.id);
  }, [firestore, user]);
  const { data: empreendedorById } = useDoc<Empreendedor>(empreendedorByIdRef);

  const myCpfCnpjSet = useMemo(() => {
    const set = new Set<string>();
    const add = (v: string | undefined) => {
      if (v && String(v).trim()) {
        const d = String(v).replace(/\D/g, "");
        if (d.length >= 11) {
          set.add(d);
          set.add(v.trim());
        }
      }
    };
    myClients?.forEach((c) => add(c.cpfCnpj));
    myEmpreendedores?.forEach((e) => add(e.cpfCnpj));
    if (clientById?.cpfCnpj) add(clientById.cpfCnpj);
    if (empreendedorById?.cpfCnpj) add(empreendedorById.cpfCnpj);
    const profile = clientProfile || user;
    if (user?.role === "client" && profile) {
      add((profile as any).cpf);
      add((profile as any).userCpf);
    }
    return set;
  }, [
    myClients,
    myEmpreendedores,
    user,
    clientProfile,
    clientById,
    empreendedorById,
  ]);

  const pendingRequestsForMe = useMemo(() => {
    if (!allPendingRequests || myCpfCnpjSet.size === 0) return [];
    return allPendingRequests.filter((r) => {
      const normalized = (r.cpfOfInterested || "").replace(/\D/g, "");
      return (
        normalized.length >= 11 &&
        (myCpfCnpjSet.has(r.cpfOfInterested!) || myCpfCnpjSet.has(normalized))
      );
    });
  }, [allPendingRequests, myCpfCnpjSet]);

  // Pedidos já aprovados para este titular (base: access_requests.status = 'approved').
  const approvedRequestsForMe = useMemo(() => {
    if (!allApprovedRequests || myCpfCnpjSet.size === 0) return [];
    return allApprovedRequests.filter((r) => {
      const digits = (r.cpfOfInterested || "").replace(/\D/g, "");
      if (digits.length < 11) return false;
      return myCpfCnpjSet.has(r.cpfOfInterested!) || myCpfCnpjSet.has(digits);
    });
  }, [allApprovedRequests, myCpfCnpjSet]);

  // IDs de representantes aprovados (requestedByUserId dos pedidos aprovados).
  const approvedRepresentativeIds = useMemo(() => {
    const set = new Set<string>();
    approvedRequestsForMe.forEach((r) => {
      if (r.requestedByUserId) set.add(r.requestedByUserId);
    });
    return Array.from(set);
  }, [approvedRequestsForMe]);

  // Carrega detalhes dos representantes aprovados para exibir na UI.
  useEffect(() => {
    const loadRepresentatives = async () => {
      if (!firestore || !user || user.role !== "client") {
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
              reps.push({ id: docSnap.id, ...(docSnap.data() as AppUser) });
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

  /** Lista de representantes que solicitam ou têm acesso aos dados do cliente sendo editado (para exibir no form quando perfil = cliente). */
  const representativesForClientInDialog = useMemo((): {
    id: string;
    requestedByName: string;
    requestedByUserId: string;
    status: string;
    representativeCpf?: string;
  }[] => {
    if (user?.role === "client")
      return (pendingRequestsForMe || []).map((r) => ({
        id: r.id,
        requestedByName: r.requestedByName,
        requestedByUserId: r.requestedByUserId,
        status: r.status,
      }));
    if (!editingUser || editingUser.role !== "client" || !allPendingRequests)
      return [];
    const norm = (s: string) => (s || "").replace(/\D/g, "");
    const clientSet = new Set(
      [
        norm(editingUser.cpf || ""),
        norm((editingUser as { userCpf?: string }).userCpf || ""),
      ].filter(Boolean),
    );
    if (clientSet.size === 0) return [];
    return allPendingRequests
      .filter((r: AccessRequest) => {
        const n = norm(r.cpfOfInterested || "");
        return n.length >= 11 && clientSet.has(n);
      })
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
    if (!firestore || !auth || !user || user.role !== "client") return;
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
        const cpfNorm = (request.cpfOfInterested || "").replace(/\D/g, "");
        const clientsToUpdate = (myClients || []).filter(
          (c) =>
            (c.cpfCnpj || "").replace(/\D/g, "") === cpfNorm ||
            c.cpfCnpj === request.cpfOfInterested,
        );
        const empreendedoresToUpdate = (myEmpreendedores || []).filter(
          (e) =>
            (e.cpfCnpj || "").replace(/\D/g, "") === cpfNorm ||
            e.cpfCnpj === request.cpfOfInterested,
        );
        for (const c of clientsToUpdate) {
          await updateDoc(doc(firestore, "clients", c.id), {
            approvedUserIds: arrayUnion(userIdToAdd),
          });
        }
        for (const e of empreendedoresToUpdate) {
          await updateDoc(doc(firestore, "empreendedores", e.id), {
            approvedUserIds: arrayUnion(userIdToAdd),
          });
        }
      }
      toast({
        title: approve ? "Acesso aprovado" : "Pedido rejeitado",
        description: approve
          ? "O usuário poderá acessar seus dados."
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
    if (!firestore || !user || user.role !== "client") return;
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

  if (user?.role === "client") {
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

                  <Card id="access-requests-card">
                    <CardHeader>
                      <CardTitle>
                        Aprovar acesso de representantes aos seus dados
                      </CardTitle>
                      <CardDescription>
                        Como titular, você pode aceitar ou recusar pedidos de
                        representantes que queiram acessar seus dados. As
                        solicitações pendentes aparecem abaixo.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Pedidos pendentes */}
                      {pendingRequestsForMe.length > 0 ? (
                        pendingRequestsForMe.map((req) => (
                          <div
                            key={req.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-foreground">
                                Solicitante: {req.requestedByName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                E-mail: {req.requestedByEmail}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Solicitou acesso ao CPF (titular):{" "}
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
                            representante solicitar acesso aos seus dados
                            (Configurações → Usuários ou cadastro), você poderá
                            aceitar ou recusar aqui.
                          </p>
                          <p className="text-xs text-muted-foreground border-t pt-2">
                            Se um representante já se cadastrou pedindo acesso
                            ao seu CPF e não aparece aqui: confira se seu{" "}
                            <strong>CPF está salvo</strong> no seu perfil (botão
                            &quot;Atualizar / Editar Cadastro&quot; acima) e se
                            o representante informou{" "}
                            <strong>exatamente esse CPF</strong> (com ou sem
                            pontuação) no cadastro dele.
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
                    </CardContent>
                  </Card>

                  {accessRequestsError && (
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
                    label="CPF"
                    value={formatCpfDisplay(
                      repUser?.cpf || (repUser as any)?.userCpf,
                    )}
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

              <Card>
                <CardHeader>
                  <CardTitle>
                    Clientes (titulares) aos quais você tem acesso aprovado
                  </CardTitle>
                  <CardDescription>
                    Estes titulares aprovaram seu acesso aos dados deles. Você
                    pode visualizar e gerenciar as informações no menu Cadastro
                    (Clientes e Empreendedores) conforme permissão. O titular
                    pode revogar seu acesso a qualquer momento em Configurações
                    → Usuários.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {approvedTitularesForRep.length > 0 ? (
                    <div className="space-y-2">
                      {approvedTitularesForRep.map((t, i) => (
                        <div
                          key={`${t.cpfCnpj}-${i}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border px-3 py-2 bg-muted/40"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {t.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              CPF/CNPJ: {formatCpfCnpjDisplay(t.cpfCnpj)} ·{" "}
                              {t.type === "cliente"
                                ? "Cliente"
                                : "Empreendedor"}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="self-start sm:self-center"
                          >
                            Acesso aprovado
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      Nenhum titular aprovou seu acesso no momento. Quando um
                      cliente (titular) aceitar seu pedido de acesso em Meu
                      Perfil, ele aparecerá aqui e você poderá acessar os dados
                      no menu Cadastro.
                    </p>
                  )}
                </CardContent>
              </Card>

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
                allPendingRequests?.find(
                  (r) => r.requestedByUserId === user?.id,
                )?.cpfOfInterested ?? undefined
              }
              representativeRequestedCpfsCnpjs={
                (allPendingRequests
                  ?.filter((r) => r.requestedByUserId === user?.id)
                  .map((r) => r.cpfOfInterested)
                  .filter(Boolean) as string[]) ?? []
              }
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
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status Online</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Email
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        CPF/CNPJ
                      </TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right min-w-[152px] w-[152px]">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({
                        length:
                          user?.role === "admin" || user?.role === "supervisor"
                            ? 5
                            : 1,
                      }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-5 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Skeleton className="h-5 w-48" />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Skeleton className="h-5 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </TableCell>
                          <TableCell className="text-right min-w-[152px] w-[152px]">
                            <Skeleton className="h-8 w-32" />
                          </TableCell>
                        </TableRow>
                      ))}
                    {appUsers?.map((appUser) => (
                      <TableRow key={appUser.id}>
                        <TableCell className="font-medium">
                          {appUser.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "h-3 w-3 rounded-full",
                                appUser.isOnline
                                  ? "bg-green-500"
                                  : "bg-red-500",
                              )}
                            />
                            {appUser.isOnline ? "Online" : "Offline"}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {appUser.email}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {formatCpfCnpjDisplay(
                            appUser.cpf || (appUser.cnpjs && appUser.cnpjs[0]),
                          ) || "N/A"}
                        </TableCell>
                        <TableCell>{getRoleText(appUser.role)}</TableCell>
                        <TableCell>
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
                            )}
                          >
                            {appUser.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right min-w-[152px] w-[152px]">
                          <div className="flex items-center justify-end gap-1 flex-nowrap">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
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
                            {(user?.role === "admin" ||
                              (user?.role === "representative" &&
                                appUser.id === user?.id)) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(appUser)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {user?.role === "representative" &&
                                    appUser.id === user?.id
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
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => openDeleteConfirm(appUser)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {appUser.id === user?.id &&
                                    (user?.role === "client" ||
                                      user?.role === "representative")
                                      ? "Excluir usuário de acesso (apenas seus dados de acesso; Clientes/Empreendedores não são alterados)"
                                      : "Excluir usuário (somente administrador)"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {(user?.role === "admin" ||
                              user?.role === "supervisor") && (
                              <DropdownMenu>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <History className="h-4 w-4" />
                                        <span className="sr-only">
                                          Gerar Log
                                        </span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Gerar log de atividades</p>
                                  </TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent>
                                  <DropdownMenuLabel>
                                    Formato do Log
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleGenerateLog(appUser, "txt")
                                    }
                                  >
                                    Exportar como .txt
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleGenerateLog(appUser, "pdf")
                                    }
                                  >
                                    Exportar como .pdf
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && (!appUsers || appUsers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhum usuário encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
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
                  value={viewingUser.isOnline ? "Online" : "Offline"}
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
              {userToDelete?.id === user?.id &&
              (user?.role === "client" || user?.role === "representative")
                ? "Excluir seu usuário de acesso?"
                : "Você tem certeza?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete?.id === user?.id &&
              (user?.role === "client" || user?.role === "representative") ? (
                <>
                  Será removido apenas o seu <strong>usuário de acesso</strong>{" "}
                  (perfil de login). Você será deslogado. Os dados nos submenus{" "}
                  <strong>Clientes</strong> e <strong>Empreendedores</strong>{" "}
                  não serão alterados; apenas o administrador pode excluí-los.
                </>
              ) : (
                <>
                  Esta ação não pode ser desfeita. Isso irá deletar
                  permanentemente o usuário{" "}
                  <span className="font-semibold">{userToDelete?.name}</span>. A
                  conta de autenticação precisará ser removida manualmente se
                  necessário.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {userToDelete?.id === user?.id &&
              (user?.role === "client" || user?.role === "representative")
                ? "Sim, excluir meu usuário de acesso"
                : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
