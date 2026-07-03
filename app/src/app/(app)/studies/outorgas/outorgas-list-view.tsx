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
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  errorEmitter,
} from "@/firebase";
import {
  collection,
  doc,
  deleteDoc,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import type {
  OutorgaProcesso,
  Empreendedor,
  AppUser,
} from "@/lib/types";
import { getEtapaLabel } from "@/lib/outorga-processo";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { handleFirestoreFormError } from "@/lib/firestore-form-errors";
import { FirestorePermissionError } from "@/firebase/errors";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { isClientePortalRole, canPerformOperationalWrite } from "@/lib/role-guards";
import { useStudyListEntityFilter } from "@/hooks/use-study-list-entity-filter";
import { StudyListEntityFilterCard } from "@/components/studies/study-list-entity-filter-card";

const canPerformWriteActions = (user: AppUser | null): boolean => {
  if (!user) return false;
  return canPerformOperationalWrite(user.role);
};

export function OutorgasListView() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<
    string[] | undefined
  >(undefined);

  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isClientePortalRole(user?.role) && firestore) {
      setEmpreendedorIdsForUser(undefined); // Reset before fetching
      const currentUser = user!;
      const userDocuments = [
        currentUser.cpf || currentUser.userCpf,
        ...(currentUser.cnpjs || []),
      ].filter(Boolean) as string[];
      if (userDocuments.length > 0) {
        const empreendedoresRef = collection(firestore, "empreendedores");
        const q = query(
          empreendedoresRef,
          where("cpfCnpj", "in", userDocuments),
        );
        getDocs(q)
          .then((snapshot) => {
            const ids = snapshot.docs.map((doc) => doc.id);
            setEmpreendedorIdsForUser(
              ids.length > 0 ? ids : ["invalid-placeholder"],
            );
          })
          .catch((err) => {
            console.error("Error fetching empreendedor IDs:", err);
            setEmpreendedorIdsForUser(["invalid-placeholder"]);
          });
      } else {
        setEmpreendedorIdsForUser(["invalid-placeholder"]);
      }
    } else if (user) {
      // For non-client users, we don't need to filter by empreendedor
      setEmpreendedorIdsForUser([]);
    }
  }, [user, firestore]);

  const processosQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined)
      return null;

    if (isClientePortalRole(user.role)) {
      if (empreendedorIdsForUser.length > 0) {
        return query(
          collection(firestore, "outorga_processos"),
          where("empreendedorId", "in", empreendedorIdsForUser),
          limit(200),
        );
      }
      return null;
    }

    return query(collection(firestore, "outorga_processos"), limit(200));
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: processos, isLoading: isLoadingProcessos } =
    useCollection<OutorgaProcesso>(processosQuery);

  const {
    filterEmpreendedorId,
    setFilterEmpreendedorId,
    filterProjectId,
    setFilterProjectId,
    filtered: filteredProcessos,
  } = useStudyListEntityFilter(processos);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "empreendedores"), limit(200)) : null),
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = useMemo(
    () => new Map(empreendedores?.map((c) => [c.id, c.name])),
    [empreendedores],
  );

  const isLoading =
    isLoadingProcessos ||
    isLoadingEmpreendedores ||
    (isClientePortalRole(user?.role) && empreendedorIdsForUser === undefined);

  const handleAddNew = () => {
    router.push("/studies/outorgas/new");
  };

  const handleOpenProcesso = (item: OutorgaProcesso) => {
    router.push(`/studies/outorgas/processo/${item.id}`);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "outorga_processos", itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Processo removido",
          description: "O processo de outorga foi removido.",
        });
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: "Erro ao excluir estudo",
          context: { path: docRef.path, operation: "delete" },
        }),
      )
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Processos de outorga (MG)">
          {canPerformWriteActions(user) && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Nova outorga
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <StudyListEntityFilterCard
            empreendedorId={filterEmpreendedorId}
            projectId={filterProjectId}
            onEmpreendedorIdChange={setFilterEmpreendedorId}
            onProjectIdChange={setFilterProjectId}
          />
          <Card>
            <CardHeader>
              <CardTitle>Processos em tramitação</CardTitle>
              <CardDescription>
                Escolha o código do modo de uso (Tabela 01 IGAM) ao iniciar. Após
                deferimento, registre a portaria em Documentos Ambientais → Outorgas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-lg" />
                  ))}
                {!isLoading &&
                  filteredProcessos.map((item) => (
                    <Card
                      key={item.id}
                      className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
                      onClick={() => handleOpenProcesso(item)}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="font-mono">
                                Cód. {item.modoUsoCodigo}
                              </Badge>
                              <Badge variant="outline">
                                {getEtapaLabel(item.etapaProcesso)}
                              </Badge>
                            </div>
                            <h3 className="text-base font-semibold leading-snug">
                              {item.modoUsoLabel}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {empreendedoresMap.get(item.empreendedorId) ||
                                "Empreendedor a definir"}
                              {item.processNumber
                                ? ` · Processo ${item.processNumber}`
                                : ""}
                            </p>
                          </div>
                          <div
                            className="flex gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenProcesso(item)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Abrir
                            </Button>
                            {canPerformWriteActions(user) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => openDeleteConfirm(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {!isLoading && filteredProcessos.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                    Nenhum processo. Clique em Nova outorga para escolher o
                    código do serviço.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente
              o pedido de outorga.
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




