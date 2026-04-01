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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  deleteDoc,
  query,
  where,
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
import { useToast } from "@/hooks/use-toast";
import { FirestorePermissionError } from "@/firebase/errors";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import { backupAndDeleteSingleCondicionante } from "@/lib/deleted-data-backup";
import { CardSearchInput } from "@/components/card-search-input";

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
  return (
    user.role === "admin" ||
    user.role === "gestor" ||
    user.role === "supervisor"
  );
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

  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<
    string[] | undefined
  >(undefined);

  useEffect(() => {
    if (user?.role === "client" && firestore) {
      setEmpreendedorIdsForUser(undefined);
      const isSelfRegistered = !!(user as any).package;

      if (isSelfRegistered) {
        const empreendedoresRef = collection(firestore, "empreendedores");
        const qByUserId = query(
          empreendedoresRef,
          where("userId", "==", user.id),
        );
        const qByApproved = query(
          empreendedoresRef,
          where("approvedUserIds", "array-contains", user.id),
        );
        const userDocs = documentVariants(user.cpf || user.userCpf, user.cnpjs);
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
        query(empreendedoresRef, where("userId", "==", user.id)),
      );
      const byApproved = getDocs(
        query(
          empreendedoresRef,
          where("approvedUserIds", "array-contains", user.id),
        ),
      );
      const userDocs = documentVariants(user.cpf || user.userCpf, user.cnpjs);
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
    if (user?.role === "client") {
      if (empreendedorIdsForUser === undefined) return null;
      if (empreendedorIdsForUser.length === 0) return null;
      return query(
        collection(firestore, "projects"),
        where("empreendedorId", "in", empreendedorIdsForUser),
      );
    }
    return collection(firestore, "projects");
  }, [firestore, user?.role, empreendedorIdsForUser]);
  const { data: projects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const licensesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (user?.role === "client") {
      if (empreendedorIdsForUser === undefined) return null;
      if (empreendedorIdsForUser.length === 0) return null;
      return query(
        collection(firestore, "licenses"),
        where("empreendedorId", "in", empreendedorIdsForUser),
      );
    }
    return collection(firestore, "licenses");
  }, [firestore, user?.role, empreendedorIdsForUser]);
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
    if (user?.role !== "client" || !firestore || projectIds.length === 0) {
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
  }, [user?.role, firestore, projectIds]);

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
    if (user?.role === "client") {
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
    return collection(firestore, "condicionantes");
  }, [firestore, user?.role, referenceIdsForClient, empreendedorIdsForUser]);

  const {
    data: condicionantesSingle,
    isLoading: isLoadingCondicionantesSingle,
    error: condicionantesError,
  } = useCollection<Condicionante>(condicionantesQuerySingle);

  const condicionantesQueryChunk0 = useMemoFirebase(() => {
    if (
      !firestore ||
      user?.role !== "client" ||
      referenceIdChunks.length < 1 ||
      referenceIdChunks[0].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[0]),
    );
  }, [firestore, user?.role, referenceIdChunks]);
  const condicionantesQueryChunk1 = useMemoFirebase(() => {
    if (
      !firestore ||
      user?.role !== "client" ||
      referenceIdChunks.length < 2 ||
      referenceIdChunks[1].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[1]),
    );
  }, [firestore, user?.role, referenceIdChunks]);
  const condicionantesQueryChunk2 = useMemoFirebase(() => {
    if (
      !firestore ||
      user?.role !== "client" ||
      referenceIdChunks.length < 3 ||
      referenceIdChunks[2].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[2]),
    );
  }, [firestore, user?.role, referenceIdChunks]);
  const condicionantesQueryChunk3 = useMemoFirebase(() => {
    if (
      !firestore ||
      user?.role !== "client" ||
      referenceIdChunks.length < 4 ||
      referenceIdChunks[3].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[3]),
    );
  }, [firestore, user?.role, referenceIdChunks]);
  const condicionantesQueryChunk4 = useMemoFirebase(() => {
    if (
      !firestore ||
      user?.role !== "client" ||
      referenceIdChunks.length < 5 ||
      referenceIdChunks[4].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[4]),
    );
  }, [firestore, user?.role, referenceIdChunks]);

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
    if (user?.role === "client" && referenceIdChunks.length > 1) {
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
    user?.role,
    referenceIdChunks.length,
    condicionantesChunk0,
    condicionantesChunk1,
    condicionantesChunk2,
    condicionantesChunk3,
    condicionantesChunk4,
  ]);

  const condicionantes = condicionantesMerged ?? condicionantesSingle ?? null;
  const isLoadingCondicionantes =
    user?.role === "client" && referenceIdChunks.length > 1
      ? isLoadingChunk0 ||
        isLoadingChunk1 ||
        isLoadingChunk2 ||
        isLoadingChunk3 ||
        isLoadingChunk4
      : isLoadingCondicionantesSingle;

  const outorgasQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (user?.role === "client") {
      if (!empreendedorIdsForUser || empreendedorIdsForUser.length === 0)
        return null;
      return query(
        collection(firestore, "outorgas"),
        where("empreendedorId", "in", empreendedorIdsForUser),
      );
    }
    return collection(firestore, "outorgas");
  }, [firestore, user?.role, empreendedorIdsForUser]);
  const { data: outorgas, isLoading: isLoadingOutorgas } =
    useCollection<WaterPermit>(outorgasQuery);

  const intervencoesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (user?.role === "client") {
      if (!empreendedorIdsForUser || empreendedorIdsForUser.length === 0)
        return null;
      return query(
        collection(firestore, "intervencoes"),
        where("empreendedorId", "in", empreendedorIdsForUser),
      );
    }
    return collection(firestore, "intervencoes");
  }, [firestore, user?.role, empreendedorIdsForUser]);
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
    (user?.role === "client" && empreendedorIdsForUser === undefined) ||
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

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "condicionantes", itemToDelete);
    backupAndDeleteSingleCondicionante({
      firestore,
      condicionanteId: itemToDelete,
      user,
      reason: "Exclusão manual na tela de condicionantes",
    })
      .then(() => {
        toast({
          title: "Condicionante deletada",
          description: "A condicionante foi removida com backup de segurança.",
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: "delete",
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  };

  const getStatusVariant = (status: Condicionante["status"]) => {
    switch (status) {
      case "Pendente":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
      case "Em execução":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "Cumprida":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
      case "Atrasada":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-700 border-slate-500/30";
    }
  };

  const renderConditionantesTable = (items: Condicionante[]) => (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-2/5">Descrição</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Recorrência</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">Anexo</TableHead>
            {canPerformWriteActions(user) && (
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium max-w-xs truncate">
                {item.description}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(item.dueDate ?? "")}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.recurrence ?? "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={"outline"}
                  className={cn(getStatusVariant(item.status))}
                >
                  {item.status ?? "—"}
                </Badge>
              </TableCell>
              <TableCell>
                {item.fileUrl ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild variant="ghost" size="icon">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Paperclip className="h-4 w-4" />
                          <span className="sr-only">Fazer download</span>
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fazer download</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              {canPerformWriteActions(user) && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Editar condicionante"
                          size="icon"
                          variant="ghost"
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
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteConfirm(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Excluir condicionante (com backup)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
          renderConditionantesTable(filteredCondicionantes)
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
                      {renderConditionantesTable(items)}
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
                      {renderConditionantesTable(items)}
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
                        {renderConditionantesTable(items)}
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
          {user?.role === "client" ? renderClientView() : renderManagerView()}
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
