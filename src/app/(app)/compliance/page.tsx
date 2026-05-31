"use client";
import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  ChevronDown,
  Droplets,
  FileCheck2,
  Trees,
  Paperclip,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  errorEmitter,
} from "@/firebase";
import {
  collection,
  doc,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import type {
  Condicionante,
  Project,
  WaterPermit,
  EnvironmentalIntervention,
  AppUser,
  Empreendedor,
  License,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { ComplianceForm } from "./compliance-form";
import { RecordViewDialog } from "@/components/shared/record-view-dialog";
import { useToast } from "@/hooks/use-toast";
import { FirestorePermissionError } from "@/firebase/errors";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { condicionanteStatusBadgeClass } from "@/lib/status-display-classes";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  backupAndDeleteSingleCondicionante,
  deleteCondicionanteDirect,
} from "@/lib/deleted-data-backup";
import { CardSearchInput } from "@/components/card-search-input";
import { fetchEmpreendedorIdsForPortalScope, isEmpreendedorScopedPortalRole } from "@/lib/portal-empreendedor-scope";
import {
  isClientePortalRole,
  isRepresentativeLikePortalRole,
  canManageCondicionantes,
  isAdminRole,
} from "@/lib/role-guards";

/** Variantes de CPF/CNPJ (original + só dígitos) para match no Firestore, máx 10. */
function documentVariants(
  cpf: string | undefined,
  cnpjs: string[] | undefined,
): string[] {
  const raw = [cpf, ...(cnpjs || [])].filter(Boolean) as string[];
  const set = new Set<string>();
  for (const v of raw) {
    set.add(v);
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 11) set.add(digits);
  }
  return Array.from(set).slice(0, 10);
}

const canPerformWriteActions = (user: AppUser | null): boolean => {
  if (!user) return false;
  if (isAdminRole(user.role)) return true;
  return canManageCondicionantes(user.role);
};

export default function CompliancePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Condicionante | null>(null);
  const [selectedType, setSelectedType] = useState<
    "licenca" | "outorga" | "intervencao"
  >("licenca");
  const [searchTerm, setSearchTerm] = useState("");

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const isClientLike = useMemo(
    () => isEmpreendedorScopedPortalRole(user?.role),
    [user?.role],
  );

  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<
    string[] | undefined
  >(undefined);

  useEffect(() => {
    if (isRepresentativeLikePortalRole(user?.role) && firestore && user) {
      setEmpreendedorIdsForUser(undefined);
      fetchEmpreendedorIdsForPortalScope(firestore, user)
        .then(setEmpreendedorIdsForUser)
        .catch(() => setEmpreendedorIdsForUser(["invalid-placeholder"]));
      return;
    }
    if (isClientePortalRole(user?.role) && firestore) {
      setEmpreendedorIdsForUser(undefined);
      const currentUser = user as AppUser;
      const isSelfRegistered = !!currentUser.package;

      if (isSelfRegistered) {
        const empreendedoresRef = collection(firestore, "empreendedores");
        const qByUserId = query(
          empreendedoresRef,
          where("userId", "==", currentUser.id),
        );
        const qByApproved = query(
          empreendedoresRef,
          where("approvedUserIds", "array-contains", currentUser.id),
        );
        const userDocs = documentVariants(currentUser.cpf || currentUser.userCpf, currentUser.cnpjs);
        const promiseCpf =
          userDocs.length > 0
            ? getDocs(
                query(empreendedoresRef, where("cpfCnpj", "in", userDocs)),
              )
            : Promise.resolve({ docs: [] });
        Promise.all([getDocs(qByUserId), getDocs(qByApproved), promiseCpf])
          .then(([snapUserId, snapApproved, snapCpf]) => {
            const ids = new Set<string>([
              ...snapUserId.docs.map((d) => d.id),
              ...snapApproved.docs.map((d) => d.id),
              ...snapCpf.docs.map((d) => d.id),
            ]);
            setEmpreendedorIdsForUser(
              ids.size > 0 ? Array.from(ids) : ["invalid-placeholder"],
            );
          })
          .catch(() => setEmpreendedorIdsForUser(["invalid-placeholder"]));
        return;
      }

      const empreendedoresRef = collection(firestore, "empreendedores");
      const byUserId = getDocs(
        query(empreendedoresRef, where("userId", "==", currentUser.id)),
      );
      const byApproved = getDocs(
        query(
          empreendedoresRef,
          where("approvedUserIds", "array-contains", currentUser.id),
        ),
      );
      const userDocs = documentVariants(currentUser.cpf || currentUser.userCpf, currentUser.cnpjs);
      if (userDocs.length > 0) {
        const qByDoc = query(
          empreendedoresRef,
          where("cpfCnpj", "in", userDocs),
        );
        Promise.all([byUserId, byApproved, getDocs(qByDoc)])
          .then(([snapUserId, snapApproved, snapDoc]) => {
            const ids = new Set<string>();
            snapUserId.docs.forEach((d) => ids.add(d.id));
            snapApproved.docs.forEach((d) => ids.add(d.id));
            snapDoc.docs.forEach((d) => ids.add(d.id));
            setEmpreendedorIdsForUser(
              ids.size > 0 ? Array.from(ids) : ["invalid-placeholder"],
            );
          })
          .catch(() => setEmpreendedorIdsForUser(["invalid-placeholder"]));
      } else {
        Promise.all([byUserId, byApproved])
          .then(([snapUserId, snapApproved]) => {
            const ids = new Set<string>([
              ...snapUserId.docs.map((d) => d.id),
              ...snapApproved.docs.map((d) => d.id),
            ]);
            setEmpreendedorIdsForUser(
              ids.size > 0 ? Array.from(ids) : ["invalid-placeholder"],
            );
          })
          .catch(() => setEmpreendedorIdsForUser(["invalid-placeholder"]));
      }
    } else if (user) {
      setEmpreendedorIdsForUser([]);
    }
  }, [user, firestore]);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (isClientLike) {
      if (empreendedorIdsForUser === undefined) return null;
      if (empreendedorIdsForUser.length === 0) return null;
      return query(
        collection(firestore, "projects"),
        where("empreendedorId", "in", empreendedorIdsForUser),
        limit(200),
      );
    }
    return query(collection(firestore, "projects"), limit(200));
  }, [firestore, isClientLike, empreendedorIdsForUser]);
  const { data: projects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const licensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (isClientLike) {
      if (empreendedorIdsForUser === undefined) return null;
      if (empreendedorIdsForUser.length === 0) return null;
      return query(
        collection(firestore, "licenses"),
        where("empreendedorId", "in", empreendedorIdsForUser),
        limit(200),
      );
    }
    return query(collection(firestore, "licenses"), limit(200));
  }, [firestore, isClientLike, empreendedorIdsForUser]);
  const { data: licenses, isLoading: isLoadingLicenses } =
    useCollection<License>(licensesQuery);

  const projectIds = useMemo(
    () => projects?.map((p) => p.id) || [],
    [projects],
  );
  const licenseIds = useMemo(
    () => licenses?.map((l) => l.id) || [],
    [licenses],
  );

  const [licenseIdsByProject, setLicenseIdsByProject] = useState<string[]>([]);
  useEffect(() => {
    if (!isClientLike || !firestore || projectIds.length === 0) {
      setLicenseIdsByProject([]);
      return;
    }
    const CHUNK = 10;
    const chunks: string[][] = [];
    for (let i = 0; i < projectIds.length; i += CHUNK)
      chunks.push(projectIds.slice(i, i + CHUNK));
    const promises = chunks.map((chunk) =>
      getDocs(
        query(
          collection(firestore, "licenses"),
          where("projectId", "in", chunk),
        ),
      ),
    );
    Promise.all(promises)
      .then((snapshots) => {
        const ids = new Set<string>();
        snapshots.forEach((snap) => snap.docs.forEach((d) => ids.add(d.id)));
        setLicenseIdsByProject(Array.from(ids));
      })
      .catch(() => setLicenseIdsByProject([]));
  }, [isClientLike, firestore, projectIds]);

  const CONDITIONANTES_CHUNK_SIZE = 10;
  const projectIdChunks = useMemo(() => {
    if (!projectIds.length || projectIds.length <= CONDITIONANTES_CHUNK_SIZE)
      return [projectIds];
    const chunks: string[][] = [];
    for (let i = 0; i < projectIds.length; i += CONDITIONANTES_CHUNK_SIZE) {
      chunks.push(projectIds.slice(i, i + CONDITIONANTES_CHUNK_SIZE));
    }
    return chunks;
  }, [projectIds]);

  const referenceIdsForClient = useMemo(() => {
    const ids = new Set<string>();
    licenseIds.forEach((id) => ids.add(id));
    licenseIdsByProject.forEach((id) => ids.add(id));
    projectIds.forEach((id) => ids.add(id));
    return Array.from(ids);
  }, [licenseIds, licenseIdsByProject, projectIds]);

  const referenceIdChunks = useMemo(() => {
    if (
      !referenceIdsForClient.length ||
      referenceIdsForClient.length <= CONDITIONANTES_CHUNK_SIZE
    )
      return [referenceIdsForClient];
    const chunks: string[][] = [];
    for (
      let i = 0;
      i < referenceIdsForClient.length;
      i += CONDITIONANTES_CHUNK_SIZE
    ) {
      chunks.push(
        referenceIdsForClient.slice(i, i + CONDITIONANTES_CHUNK_SIZE),
      );
    }
    return chunks;
  }, [referenceIdsForClient]);

  const condicionantesQuerySingle = useMemoFirebase(() => {
    if (!firestore) return null;
    if (isClientLike) {
      if (referenceIdsForClient.length === 0) {
        if (empreendedorIdsForUser && empreendedorIdsForUser.length > 0)
          return null;
        if (empreendedorIdsForUser === undefined) return null;
      }
      if (
        referenceIdsForClient.length > 0 &&
        referenceIdsForClient.length <= CONDITIONANTES_CHUNK_SIZE
      ) {
        return query(
          collection(firestore, "condicionantes"),
          where("referenceId", "in", referenceIdsForClient),
        );
      }
      return null;
    }
    return query(collection(firestore, "condicionantes"), limit(200));
  }, [firestore, isClientLike, referenceIdsForClient, empreendedorIdsForUser]);

  const {
    data: condicionantesSingle,
    isLoading: isLoadingCondicionantesSingle,
    error: condicionantesError,
  } = useCollection<Condicionante>(condicionantesQuerySingle);

  const condicionantesQueryChunk0 = useMemoFirebase(() => {
    if (
      !firestore ||
      !isClientLike ||
      referenceIdChunks.length < 1 ||
      referenceIdChunks[0].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[0]),
    );
  }, [firestore, isClientLike, referenceIdChunks]);
  const condicionantesQueryChunk1 = useMemoFirebase(() => {
    if (
      !firestore ||
      !isClientLike ||
      referenceIdChunks.length < 2 ||
      referenceIdChunks[1].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[1]),
    );
  }, [firestore, isClientLike, referenceIdChunks]);
  const condicionantesQueryChunk2 = useMemoFirebase(() => {
    if (
      !firestore ||
      !isClientLike ||
      referenceIdChunks.length < 3 ||
      referenceIdChunks[2].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[2]),
    );
  }, [firestore, isClientLike, referenceIdChunks]);
  const condicionantesQueryChunk3 = useMemoFirebase(() => {
    if (
      !firestore ||
      !isClientLike ||
      referenceIdChunks.length < 4 ||
      referenceIdChunks[3].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[3]),
    );
  }, [firestore, isClientLike, referenceIdChunks]);
  const condicionantesQueryChunk4 = useMemoFirebase(() => {
    if (
      !firestore ||
      !isClientLike ||
      referenceIdChunks.length < 5 ||
      referenceIdChunks[4].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[4]),
    );
  }, [firestore, isClientLike, referenceIdChunks]);

  const { data: condicionantesChunk0, isLoading: isLoadingChunk0 } =
    useCollection<Condicionante>(condicionantesQueryChunk0);
  const { data: condicionantesChunk1, isLoading: isLoadingChunk1 } =
    useCollection<Condicionante>(condicionantesQueryChunk1);
  const { data: condicionantesChunk2, isLoading: isLoadingChunk2 } =
    useCollection<Condicionante>(condicionantesQueryChunk2);
  const { data: condicionantesChunk3, isLoading: isLoadingChunk3 } =
    useCollection<Condicionante>(condicionantesQueryChunk3);
  const { data: condicionantesChunk4, isLoading: isLoadingChunk4 } =
    useCollection<Condicionante>(condicionantesQueryChunk4);

  const condicionantesMerged = useMemo(() => {
    if (isClientLike && referenceIdChunks.length > 1) {
      const lists = [
        condicionantesChunk0,
        condicionantesChunk1,
        condicionantesChunk2,
        condicionantesChunk3,
        condicionantesChunk4,
      ].filter(Boolean) as (Condicionante[] | null | undefined)[];
      const merged: Condicionante[] = [];
      const seen = new Set<string>();
      for (const list of lists) {
        if (!list) continue;
        for (const item of list) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
      }
      return merged;
    }
    return null;
  }, [
    isClientLike,
    referenceIdChunks.length,
    condicionantesChunk0,
    condicionantesChunk1,
    condicionantesChunk2,
    condicionantesChunk3,
    condicionantesChunk4,
  ]);

  const condicionantes = condicionantesMerged ?? condicionantesSingle ?? null;
  const isLoadingCondicionantes =
    isClientLike && referenceIdChunks.length > 1
      ? isLoadingChunk0 ||
        isLoadingChunk1 ||
        isLoadingChunk2 ||
        isLoadingChunk3 ||
        isLoadingChunk4
      : isLoadingCondicionantesSingle;

  const outorgasQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (isClientLike) {
      if (!empreendedorIdsForUser || empreendedorIdsForUser.length === 0)
        return null;
      return query(
        collection(firestore, "outorgas"),
        where("empreendedorId", "in", empreendedorIdsForUser),
        limit(200),
      );
    }
    return query(collection(firestore, "outorgas"), limit(200));
  }, [firestore, isClientLike, empreendedorIdsForUser]);
  const { data: outorgas, isLoading: isLoadingOutorgas } =
    useCollection<WaterPermit>(outorgasQuery);

  const intervencoesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (isClientLike) {
      if (!empreendedorIdsForUser || empreendedorIdsForUser.length === 0)
        return null;
      return query(
        collection(firestore, "intervencoes"),
        where("empreendedorId", "in", empreendedorIdsForUser),
        limit(200),
      );
    }
    return query(collection(firestore, "intervencoes"), limit(200));
  }, [firestore, isClientLike, empreendedorIdsForUser]);
  const { data: intervencoes, isLoading: isLoadingIntervencoes } =
    useCollection<EnvironmentalIntervention>(intervencoesQuery);

  const projectsMap = useMemo(
    () => new Map(projects?.map((p) => [p.id, p])),
    [projects],
  );
  const licensesMap = useMemo(
    () => new Map(licenses?.map((l) => [l.id, l])),
    [licenses],
  );
  const outorgasMap = useMemo(
    () => new Map(outorgas?.map((o) => [o.id, o])),
    [outorgas],
  );
  const intervencoesMap = useMemo(
    () => new Map(intervencoes?.map((i) => [i.id, i])),
    [intervencoes],
  );

  const isLoading =
    isLoadingCondicionantes ||
    isLoadingProjects ||
    isLoadingLicenses ||
    isLoadingOutorgas ||
    isLoadingIntervencoes ||
    (isClientLike && empreendedorIdsForUser === undefined) ||
    (!user && !!firestore);

  const filteredCondicionantes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = condicionantes || [];
    const termFiltered = !term
      ? base
      : base.filter((item) => {
      const descricao = (item.description || "").toLowerCase();
      const status = (item.status || "").toLowerCase();
      const recorrencia = (item.recurrence || "").toLowerCase();
      const vencimento = item.dueDate
        ? new Date(item.dueDate).toLocaleDateString("pt-BR").toLowerCase()
        : "";
      return (
        descricao.includes(term) ||
        status.includes(term) ||
        recorrencia.includes(term) ||
        vencimento.includes(term)
      );
    });
    return [...termFiltered].sort((a, b) =>
      (a.description || "").localeCompare(b.description || "", "pt-BR", {
        sensitivity: "base",
      }),
    );
  }, [condicionantes, searchTerm]);

  const { licencaGroups, outorgaGroups, intervencaoGroups } = useMemo(() => {
    if (!filteredCondicionantes)
      return {
        licencaGroups: new Map(),
        outorgaGroups: new Map(),
        intervencaoGroups: new Map(),
      };

    const licencaGroups = new Map<string, Condicionante[]>();
    const outorgaGroups = new Map<string, Condicionante[]>();
    const intervencaoGroups = new Map<string, Condicionante[]>();

    const sortByCreated = (a: Condicionante, b: Condicionante) => {
      const da = (a as Condicionante & { createdAt?: string }).createdAt || "";
      const db = (b as Condicionante & { createdAt?: string }).createdAt || "";
      return db.localeCompare(da);
    };

    filteredCondicionantes.forEach((item) => {
      const refType = String(item.referenceType ?? "")
        .trim()
        .toLowerCase();
      const refId = item.referenceId ?? "";
      if (!refId) return;
      if (refType === "licenca") {
        const group = licencaGroups.get(refId) || [];
        group.push(item);
        licencaGroups.set(refId, group);
      } else if (refType === "outorga") {
        const group = outorgaGroups.get(refId) || [];
        group.push(item);
        outorgaGroups.set(refId, group);
      } else if (refType === "intervencao") {
        const group = intervencaoGroups.get(refId) || [];
        group.push(item);
        intervencaoGroups.set(refId, group);
      }
    });

    licencaGroups.forEach((arr, k) =>
      licencaGroups.set(k, arr.sort(sortByCreated)),
    );
    outorgaGroups.forEach((arr, k) =>
      outorgaGroups.set(k, arr.sort(sortByCreated)),
    );
    intervencaoGroups.forEach((arr, k) =>
      intervencaoGroups.set(k, arr.sort(sortByCreated)),
    );

    return { licencaGroups, outorgaGroups, intervencaoGroups };
  }, [filteredCondicionantes]);

  const handleAddNew = (type: "licenca" | "outorga" | "intervencao") => {
    setEditingItem(null);
    setSelectedType(type);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Condicionante) => {
    setEditingItem(item);
    setSelectedType(item.referenceType);
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "condicionantes", itemToDelete);
    const condicionanteId = itemToDelete;

    try {
      await backupAndDeleteSingleCondicionante({
        firestore,
        condicionanteId,
        user,
        reason: "Exclusão manual na tela de condicionantes",
      });
      toast({
        title: "Condicionante deletada",
        description: "A condicionante foi removida com backup de segurança.",
      });
    } catch (firstError: unknown) {
      const code =
        firstError &&
        typeof firstError === "object" &&
        "code" in firstError
          ? String((firstError as { code?: string }).code)
          : "";

      if (canPerformWriteActions(user)) {
        try {
          await deleteCondicionanteDirect(firestore, condicionanteId);
          toast({
            title: "Condicionante deletada",
            description:
              code === "permission-denied"
                ? "Removida sem backup (permissão negada no backup). Publique as regras: npm run deploy:rules"
                : "Removida (backup não foi gravado, exclusão concluída).",
          });
        } catch (secondError: unknown) {
          const message =
            secondError instanceof Error
              ? secondError.message
              : "Não foi possível excluir a condicionante.";
          const secondCode =
            secondError &&
            typeof secondError === "object" &&
            "code" in secondError
              ? String((secondError as { code?: string }).code)
              : "";
          toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description:
              secondCode === "permission-denied"
                ? `${message} Execute npm run deploy:rules e confira se users/{uid}.role é "admin" no Firestore.`
                : message,
          });
          if (secondCode === "permission-denied") {
            errorEmitter.emit(
              "permission-error",
              new FirestorePermissionError({
                path: docRef.path,
                operation: "delete",
              }),
            );
          }
        }
      } else {
        const message =
          firstError instanceof Error
            ? firstError.message
            : "Não foi possível excluir a condicionante.";
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: message,
        });
        if (code === "permission-denied") {
          errorEmitter.emit(
            "permission-error",
            new FirestorePermissionError({
              path: docRef.path,
              operation: "delete",
            }),
          );
        }
      }
    } finally {
      setIsAlertOpen(false);
      setItemToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  };

  const getStatusVariant = (status: Condicionante["status"]) =>
    condicionanteStatusBadgeClass[status];

  const renderConditionantesList = (items: Condicionante[]) => (
    <TooltipProvider>
      <div className="space-y-4">
        {items.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4">
                <div className="min-w-0 space-y-2">
                  <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg line-clamp-3">
                    {item.description}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Vencimento: {formatDate(item.dueDate ?? "")} · Recorrência:{" "}
                    {item.recurrence ?? "—"}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn("w-fit", getStatusVariant(item.status))}
                  >
                    {item.status ?? "—"}
                  </Badge>
                </div>
                <Separator className="bg-border/60" />
                <div className="flex flex-wrap items-center gap-1">
                  <RecordViewDialog
                    title="Condicionante"
                    description="Visualização sem edição."
                    fileUrl={item.fileUrl}
                    labels={{
                      attachmentEmpty: "Sem anexo.",
                      zoomTitle: "Anexo da condicionante",
                    }}
                    triggerLabel="Visualizar condicionante"
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Descrição</p>
                        <p className="font-medium whitespace-pre-wrap">
                          {item.description}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Vencimento</p>
                          <p className="font-medium">
                            {formatDate(item.dueDate ?? "")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Recorrência</p>
                          <p className="font-medium">{item.recurrence ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <Badge
                          variant="outline"
                          className={cn(getStatusVariant(item.status))}
                        >
                          {item.status ?? "—"}
                        </Badge>
                      </div>
                    </div>
                  </RecordViewDialog>
                  {item.fileUrl ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                        >
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir anexo em nova aba"
                          >
                            <Paperclip className="h-4 w-4" />
                            <span className="sr-only">Abrir anexo em nova aba</span>
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Abrir em nova aba</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-xs text-muted-foreground px-1">—</span>
                  )}
                  {canPerformWriteActions(user) && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label="Editar condicionante"
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0"
                            type="button"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar condicionante</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label="Excluir condicionante"
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                            type="button"
                            onClick={() => openDeleteConfirm(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir condicionante (com backup)</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );

  const renderClientView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Minhas Condicionantes</CardTitle>
        <CardDescription>
          Acompanhe as condicionantes dos seus projetos.
        </CardDescription>
        <CardSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar descrição, status, recorrência..."
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          renderConditionantesList(filteredCondicionantes)
        )}
        {!isLoading && filteredCondicionantes.length === 0 && (
          <div className="h-24 text-center flex items-center justify-center border-2 border-dashed rounded-md">
            <p className="text-muted-foreground">
              Nenhuma condicionante encontrada para o filtro atual.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderManagerView = () => (
    <div className="flex flex-col gap-6">
      {condicionantesError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          Não foi possível carregar a lista de condicionantes. Verifique as
          regras de acesso no Firestore ou faça deploy das regras atualizadas.
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5" />
            Condicionantes de Licenças
          </CardTitle>
          <CardDescription>
            Condicionantes vinculadas a licenças ambientais.
          </CardDescription>
          <CardSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar descrição, status, recorrência..."
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {Array.from(licencaGroups.entries()).map(([refId, items]) => {
                const license = licensesMap.get(refId);
                const project = projectsMap.get(refId);
                const title = license
                  ? `${license.processNumber || license.permitNumber} — ${projectsMap.get(license.projectId)?.propertyName ?? "Fazenda"}`
                  : project
                    ? `${project.propertyName}${project.processNumber ? ` (${project.processNumber})` : ""}`
                    : `Referência ${refId}`;
                const subtitle = license
                  ? [
                      license.permitNumber,
                      projectsMap.get(license.projectId)?.propertyName,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : (project?.processNumber ?? refId);
                return (
                  <AccordionItem value={refId} key={refId}>
                    <AccordionTrigger>
                      <div className="flex flex-col items-start text-left">
                        <span className="font-semibold">{title}</span>
                        <span className="text-xs text-muted-foreground">
                          {subtitle}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {renderConditionantesList(items)}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
              {licencaGroups.size === 0 && (
                <div className="h-24 text-center flex items-center justify-center border-2 border-dashed rounded-md">
                  <p className="text-muted-foreground">
                    Nenhuma condicionante de licença encontrada.
                  </p>
                </div>
              )}
            </Accordion>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Condicionantes de Outorgas
          </CardTitle>
          <CardDescription>
            Condicionantes vinculadas a outorgas de uso de água.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {Array.from(outorgaGroups.entries()).map(([outorgaId, items]) => {
                const outorga = outorgasMap.get(outorgaId);
                return (
                  <AccordionItem value={outorgaId} key={outorgaId}>
                    <AccordionTrigger>
                      <div className="flex flex-col items-start text-left">
                        <span className="font-semibold">
                          {outorga?.description || "Outorga não encontrada"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {outorga?.permitNumber || outorgaId}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {renderConditionantesList(items)}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
              {outorgaGroups.size === 0 && (
                <div className="h-24 text-center flex items-center justify-center border-2 border-dashed rounded-md">
                  <p className="text-muted-foreground">
                    Nenhuma condicionante de outorga encontrada.
                  </p>
                </div>
              )}
            </Accordion>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trees className="w-5 h-5" />
            Condicionantes de Intervenção
          </CardTitle>
          <CardDescription>
            Condicionantes vinculadas a intervenções ambientais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {Array.from(intervencaoGroups.entries()).map(
                ([intervencaoId, items]) => {
                  const intervencao = intervencoesMap.get(intervencaoId);
                  return (
                    <AccordionItem value={intervencaoId} key={intervencaoId}>
                      <AccordionTrigger>
                        <div className="flex flex-col items-start text-left">
                          <span className="font-semibold">
                            {intervencao?.description ||
                              "Intervenção não encontrada"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {intervencao?.processNumber || intervencaoId}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {renderConditionantesList(items)}
                      </AccordionContent>
                    </AccordionItem>
                  );
                },
              )}
              {intervencaoGroups.size === 0 && (
                <div className="h-24 text-center flex items-center justify-center border-2 border-dashed rounded-md">
                  <p className="text-muted-foreground">
                    Nenhuma condicionante de intervenção encontrada.
                  </p>
                </div>
              )}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Gerenciamento de Condicionantes">
          {canPerformWriteActions(user) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Nova Condicionante
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  Selecione o tipo de referência
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAddNew("licenca")}>
                  Licença
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddNew("outorga")}>
                  Outorga
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddNew("intervencao")}>
                  Intervenção Ambiental
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {isClientLike ? renderClientView() : renderManagerView()}
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
          <ComplianceForm
            currentItem={editingItem}
            referenceType={selectedType}
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente
              a condicionante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}




