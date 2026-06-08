"use client";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isClientePortalRole } from "@/lib/role-guards";
import {
  createConsultorAssignment,
  getAccessRequestType,
} from "@/lib/consultor-assignments";
import { usePresenceClock } from "@/hooks/use-user-presence";
import type {
  AppUser,
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
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { useLocalBranding } from "@/hooks/use-local-branding";
import {
  buildApprovedTitularesFromEntities,
  canDeleteUser as canDeleteTargetUser,
} from "@/features/users/lib/user-display";
import { exportUserAuditLog } from "@/features/users/services/export-user-audit-log";
import { ClientPortalUsersView } from "@/features/users/components/ClientPortalUsersView";
import { ConsultorPortalUsersView } from "@/features/users/components/ConsultorPortalUsersView";
import { RepresentativePortalUsersView } from "@/features/users/components/RepresentativePortalUsersView";
import { AdminUsersManagementView } from "@/features/users/components/AdminUsersManagementView";
import {
  filterAccessRequestsForDelegate,
} from "@/lib/delegate-access-requests";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { deleteUser } from "firebase/auth";
import { logUserAction } from "@/lib/audit-log";
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
    canDeleteTargetUser(target, sessionTargetUid, user?.role);

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
    await exportUserAuditLog({
      firestore,
      logUser,
      format,
      brandingData,
      pdfImages,
      isPdfImagesLoading,
      hasBrandingUrls,
      toast,
    });
  };

  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

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
    if (!clientUser) return null;

    return (
      <ClientPortalUsersView
        clientUser={clientUser}
        isLoadingProfile={isLoadingProfile}
        editingUser={editingUser}
        isDialogOpen={isDialogOpen}
        onDialogOpenChange={setIsDialogOpen}
        onEditProfile={() => {
          setEditingUser(clientUser);
          setIsDialogOpen(true);
        }}
        onFormSuccess={() => setIsDialogOpen(false)}
        representativesForClientInDialog={representativesForClientInDialog}
        isUpgradeOpen={isUpgradeOpen}
        onUpgradeOpenChange={setIsUpgradeOpen}
        pendingRequestsForMe={pendingRequestsForMe}
        resolvingRequestId={resolvingRequestId}
        onResolveAccessRequest={handleResolveAccessRequest}
        approvedRepresentatives={approvedRepresentatives}
        isLoadingApprovedReps={isLoadingApprovedReps}
        revokingRepresentativeId={revokingRepresentativeId}
        onRevokeRepresentative={handleRevokeRepresentativeAccess}
        approvedConsultors={approvedConsultors}
        isLoadingApprovedConsultors={isLoadingApprovedConsultors}
        revokingConsultorId={revokingConsultorId}
        onRevokeConsultor={handleRevokeConsultorAccess}
        accessRequestsError={accessRequestsError}
        isAlertOpen={isAlertOpen}
        onAlertOpenChange={setIsAlertOpen}
        onConfirmDeleteAccess={handleDelete}
        onCancelDelete={() => setUserToDelete(null)}
        isDeleteAccountOpen={isDeleteAccountOpen}
        onDeleteAccountOpenChange={setIsDeleteAccountOpen}
        isDeletingAccount={isDeletingAccount}
        onConfirmDeleteAccount={handleDeleteAccount}
        onRequestDeleteAccess={() => {
          setUserToDelete(clientUser);
          setIsAlertOpen(true);
        }}
        onRequestDeleteAccount={() => setIsDeleteAccountOpen(true)}
      />
    );
  }

  const approvedTitularesForConsultor =
    user?.role !== "consultor_representante"
      ? []
      : buildApprovedTitularesFromEntities(
          myApprovedClientsAsConsultor,
          myApprovedEmpreendedoresAsConsultor,
        );

  if (user?.role === "consultor_representante") {
    const consultorUser = clientProfile || user;
    if (!consultorUser) return null;

    return (
      <ConsultorPortalUsersView
        consultorUser={consultorUser}
        editingUser={editingUser}
        isDialogOpen={isDialogOpen}
        onDialogOpenChange={setIsDialogOpen}
        onEditProfile={() => {
          setEditingUser(consultorUser);
          setIsDialogOpen(true);
        }}
        onFormSuccess={() => setIsDialogOpen(false)}
        myDelegateAccessRequests={myDelegateAccessRequests}
        approvedTitulares={approvedTitularesForConsultor}
        consultorUid={consultorUid || user?.id || ""}
        myDelegatePendingCpfsCnpjs={myDelegatePendingCpfsCnpjs}
      />
    );
  }

  // Lista única de titulares que aprovaram este representante (por CPF para deduplicar cliente/empreendedor).
  // Computação sem hook para evitar violação de "Rules of Hooks" por conta de retornos condicionais.
  const approvedTitularesForRep =
    user?.role !== "representative"
      ? []
      : buildApprovedTitularesFromEntities(
          myApprovedClientsAsRep,
          myApprovedEmpreendedoresAsRep,
        );

  // Perfil do representante: lista de titulares que aprovaram seu acesso.
  if (user?.role === "representative") {
    const repUser = clientProfile || user;
    if (!repUser) return null;

    return (
      <RepresentativePortalUsersView
        repUser={repUser}
        editingUser={editingUser}
        isDialogOpen={isDialogOpen}
        onDialogOpenChange={setIsDialogOpen}
        onEditProfile={() => {
          setEditingUser(repUser);
          setIsDialogOpen(true);
        }}
        onFormSuccess={() => setIsDialogOpen(false)}
        myDelegateAccessRequests={myDelegateAccessRequests}
        approvedTitulares={approvedTitularesForRep}
        repUid={repUid || user?.id || ""}
        myDelegatePendingCpfsCnpjs={myDelegatePendingCpfsCnpjs}
        isAlertOpen={isAlertOpen}
        onAlertOpenChange={setIsAlertOpen}
        onConfirmDeleteAccess={handleDelete}
        onCancelDelete={() => setUserToDelete(null)}
        onRequestDeleteAccess={() => {
          setUserToDelete(repUser);
          setIsAlertOpen(true);
        }}
      />
    );
  }

  return (
    <AdminUsersManagementView
      currentRole={user?.role}
      sessionUid={sessionUid}
      sessionTargetUid={sessionTargetUid}
      isAdmin={user?.role === "admin"}
      onAddNew={handleAddNew}
      orphanEmail={orphanEmail}
      onOrphanEmailChange={setOrphanEmail}
      isReleasingOrphanEmail={isReleasingOrphanEmail}
      adminSdkConfigured={adminSdkConfigured}
      showOrphanEmailSetupHelp={showOrphanEmailSetupHelp}
      onReleaseOrphanEmail={handleReleaseOrphanEmail}
      isLoading={isLoading}
      appUsers={appUsers}
      presenceNow={presenceNow}
      canDeleteUser={canDeleteUser}
      onView={handleView}
      onEdit={handleEdit}
      onDeleteConfirm={openDeleteConfirm}
      onExportLog={handleGenerateLog}
      isDialogOpen={isDialogOpen}
      onDialogOpenChange={setIsDialogOpen}
      editingUser={editingUser}
      onFormSuccess={() => setIsDialogOpen(false)}
      allPendingRequests={allPendingRequests}
      representativesForClientInDialog={representativesForClientInDialog}
      isViewOpen={isViewOpen}
      onViewOpenChange={setIsViewOpen}
      viewingUser={viewingUser}
      isAlertOpen={isAlertOpen}
      onAlertOpenChange={setIsAlertOpen}
      userToDelete={userToDelete}
      onConfirmDelete={handleDelete}
      onCancelDelete={() => setUserToDelete(null)}
    />
  );
}
