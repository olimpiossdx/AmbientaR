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
import { PlusCircle, Import, Eye, Pencil, Trash2, Copy } from "lucide-react";
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
import type { Client, Empreendedor } from "@/lib/types";
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
import { useToast } from "@/hooks/use-toast";
import { handleFirestoreFormError } from "@/lib/firestore-form-errors";
import { useAuth } from "@/firebase";
import { ClientImportDialog } from "./client-import-dialog";
import { EmpreendedorDuplicatesDialog } from "@/components/empreendedores/empreendedor-duplicates-dialog";
import { useCadastroMenuDebug } from "@/lib/cadastro-menu-debug";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { formatCepDisplay, formatCpfCnpjDisplay } from "@/lib/masks";
import { CardSearchInput } from "@/components/card-search-input";
import { CtfIbamaDetailSection } from "@/components/ctf-ibama/ctf-ibama-detail-section";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";
import { buildCpfCnpjVariants } from "@/lib/document-lookup";
import {
  isClientePortalRole,
  canWriteCadastroClienteAutonomo,
  isCadastroReadOnlyClienteGestao,
  canImportEmpreendedoresFromClients,
  canWriteCadastro,
} from "@/lib/role-guards";

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null | string[];
}) => {
  const display = Array.isArray(value)
    ? value.filter((s) => typeof s === "string" && s.length > 1).join(", ") ||
      (value.length > 0 ? value.join("") : "N├úo informado")
    : value || "N├úo informado";
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-sm text-muted-foreground">{display}</p>
    </div>
  );
};

export function EmpreendedoresListView() {
  const router = useRouter();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDuplicatesDialogOpen, setIsDuplicatesDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<Empreendedor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const firestore = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();

  const canWrite = Boolean(user && canWriteCadastro(user.role));

  const canImportFromClients =
    Boolean(user) && canImportEmpreendedoresFromClients(user?.role);

  const [fallbackEmpreendedores, setFallbackEmpreendedores] = useState<
    Empreendedor[] | null
  >(null);

  const empreendedoresQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    if (isClientePortalRole(user.role)) {
      const userDocuments = [
        user.cpf || user.userCpf,
        ...(user.cnpjs || []),
      ].filter(Boolean) as string[];
      if (userDocuments.length > 0) {
        return query(
          collection(firestore, "empreendedores"),
          where("cpfCnpj", "in", userDocuments),
          limit(200),
        );
      } else {
        return query(
          collection(firestore, "empreendedores"),
          where("cpfCnpj", "==", "invalid-placeholder-for-empty-query"),
          limit(1),
        );
      }
    }

    if (user.role === "representative") {
      const repUid = resolvePortalAuthUid(user);
      if (!repUid) return null;
      return query(
        collection(firestore, "empreendedores"),
        where("approvedUserIds", "array-contains", repUid),
        limit(200),
      );
    }

    if (user.role === "consultor_representante") {
      const consultorUid = resolvePortalAuthUid(user);
      if (!consultorUid) return null;
      return query(
        collection(firestore, "empreendedores"),
        where("approvedConsultorIds", "array-contains", consultorUid),
        limit(200),
      );
    }

    return query(collection(firestore, "empreendedores"), limit(200));
  }, [firestore, user]);

  const { data: empreendedores, isLoading } =
    useCollection<Empreendedor>(empreendedoresQuery);

  // Representante: fallback quando approvedUserIds n├úo retorna nada ÔÇö busca por access_requests aprovados e cpfCnpj.
  useEffect(() => {
    if (!firestore || !user || user.role !== "representative" || isLoading)
      return;
    if (empreendedores && empreendedores.length > 0) {
      setFallbackEmpreendedores(null);
      return;
    }
    const repUid = resolvePortalAuthUid(user);
    if (!repUid) {
      setFallbackEmpreendedores([]);
      return;
    }
    const accessRequestsRef = collection(firestore, "access_requests");
    const empreendedoresRef = collection(firestore, "empreendedores");
    const qApproved = query(
      accessRequestsRef,
      where("status", "==", "approved"),
      where("requestedByUserId", "==", repUid),
    );
    getDocs(qApproved)
      .then((snap) => {
        if (snap.docs.length === 0) {
          setFallbackEmpreendedores([]);
          return;
        }
        const cpfs = new Set<string>();
        snap.docs.forEach((d) => {
          const cpf = (d.data().cpfOfInterested || "").trim();
          for (const variant of buildCpfCnpjVariants(cpf)) {
            cpfs.add(variant);
          }
        });
        const cpfList = Array.from(cpfs).slice(0, 10);
        if (cpfList.length === 0) {
          setFallbackEmpreendedores([]);
          return;
        }
        const qEmp = query(empreendedoresRef, where("cpfCnpj", "in", cpfList));
        getDocs(qEmp)
          .then((snapEmp) => {
            const list: Empreendedor[] = snapEmp.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Empreendedor,
            );
            setFallbackEmpreendedores(list);
          })
          .catch(() => setFallbackEmpreendedores([]));
      })
      .catch(() => setFallbackEmpreendedores([]));
  }, [firestore, user, isLoading, empreendedores]);

  const displayedEmpreendedores = useMemo(
    () =>
      empreendedores && empreendedores.length > 0
        ? empreendedores
        : (fallbackEmpreendedores ?? []),
    [empreendedores, fallbackEmpreendedores],
  );

  const filteredEmpreendedores = useMemo(() => {
    if (!displayedEmpreendedores.length) return [];
    const term = searchTerm.trim().toLowerCase();
    const base = !term
      ? displayedEmpreendedores
      : displayedEmpreendedores.filter((item) => {
      const name = item.name?.toLowerCase() ?? "";
      const cpfCnpj = item.cpfCnpj?.toLowerCase() ?? "";
      const email = item.email?.toLowerCase() ?? "";
      const municipio = item.municipio?.toLowerCase() ?? "";
      return (
        name.includes(term) ||
        cpfCnpj.includes(term) ||
        email.includes(term) ||
        municipio.includes(term)
      );
    });
    return [...base].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" }),
    );
  }, [displayedEmpreendedores, searchTerm]);

  useCadastroMenuDebug();

  const handleAddNew = () => {
    router.push("/empreendedores/new");
  };

  const handleEdit = (item: Empreendedor) => {
    router.push(`/empreendedores/${item.id}/edit`);
  };

  const handleView = (item: Empreendedor) => {
    setItemToView(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;

    const docRef = doc(firestore, "empreendedores", itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Empreendedor deletado",
          description: "O empreendedor foi removido com sucesso.",
        });
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: 'Erro ao excluir empreendedor',
          context: {
          path: docRef.path,
          operation: 'delete',
        },
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
        <PageHeader title="Empreendedores">
          <div className="flex w-full min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {user?.role === "admin" && (
              <Button
                size="sm"
                className="gap-1 sm:shrink-0"
                variant="outline"
                onClick={() => setIsDuplicatesDialogOpen(true)}
              >
                <Copy className="h-4 w-4 shrink-0" />
                Duplicatas CPF/CNPJ
              </Button>
            )}
            {canImportFromClients && (
              <Button
                size="sm"
                className="gap-1 sm:shrink-0"
                variant="outline"
                onClick={() => setIsImportOpen(true)}
              >
                <Import className="h-4 w-4 shrink-0" />
                Importar de Clientes
              </Button>
            )}
            {canWrite && (
              <Button
                size="sm"
                className="gap-1 sm:shrink-0"
                onClick={handleAddNew}
              >
                <PlusCircle className="h-4 w-4 shrink-0" />
                Adicionar Empreendedor
              </Button>
            )}
          </div>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Empreendedores</CardTitle>
              <CardDescription>
                {user?.role === "representative"
                  ? "Empreendedores dos titulares (clientes) que voc├¬ representa ÔÇö ap├│s aprova├º├úo de acesso em Configura├º├Áes ÔåÆ Usu├írios."
                  : canWriteCadastroClienteAutonomo(user?.role)
                    ? "Adicione, edite e exclua os empreendedores ligados ao seu cadastro aut├┤nomo."
                    : isCadastroReadOnlyClienteGestao(user?.role)
                      ? "Visualize os empreendedores vinculados ao seu perfil Cliente Gest├úo. Altera├º├Áes de cadastro s├úo feitas pela consultoria."
                      : "Adicione, edite e visualize os empreendedores (clientes t├®cnicos)."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="text-sm text-muted-foreground">
                  {displayedEmpreendedores.length
                    ? `Total: ${displayedEmpreendedores.length} empreendedor(es)`
                    : null}
                </div>
                <CardSearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar por nome, CPF/CNPJ, email ou munic├¡pio..."
                  className="w-full"
                />
              </div>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  {!isLoading &&
                    filteredEmpreendedores.map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-1.5">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {item.name}
                              </h3>
                              <p className="font-mono text-sm tabular-nums text-muted-foreground">
                                {formatCpfCnpjDisplay(item.cpfCnpj)}
                              </p>
                              {item.email ? (
                                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                                  {item.email}
                                </p>
                              ) : null}
                            </div>
                            <Separator className="bg-border/60" />
                            <div className="flex flex-wrap items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    onClick={() => handleView(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Visualizar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualizar detalhes</p>
                                </TooltipContent>
                              </Tooltip>
                              {canWrite ? (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        onClick={() => handleEdit(item)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar empreendedor</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                        onClick={() =>
                                          openDeleteConfirm(item.id)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Deletar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Deletar empreendedor</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && filteredEmpreendedores.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                      Nenhum empreendedor encontrado.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{itemToView?.name}</DialogTitle>
            <DialogDescription>
              Detalhes do empreendedor cadastrado.
            </DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <DetailItem label="Nome / Raz├úo Social" value={itemToView.name} />
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="CPF/CNPJ"
                  value={formatCpfCnpjDisplay(itemToView.cpfCnpj)}
                />
                <DetailItem label="Tipo" value={itemToView.entityType} />
              </div>
              <CtfIbamaDetailSection entity={itemToView} />
              <h4 className="font-semibold text-foreground">
                Contato & Endere├ºo
              </h4>
              <DetailItem label="Email" value={itemToView.email} />
              <DetailItem label="Telefone" value={itemToView.phone} />
              <DetailItem
                label="Endere├ºo"
                value={`${itemToView.address || ""}, ${itemToView.numero || ""}`}
              />
              <DetailItem label="Bairro/Distrito" value={itemToView.bairro} />
              <div className="grid grid-cols-3 gap-4">
                <DetailItem label="Munic├¡pio" value={itemToView.municipio} />
                <DetailItem label="UF" value={itemToView.uf} />
                <DetailItem label="CEP" value={formatCepDisplay(itemToView.cep)} />
              </div>
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

      {canImportFromClients && (
        <ClientImportDialog
          isOpen={isImportOpen}
          onOpenChange={setIsImportOpen}
          onImportSuccess={() => {
            setIsImportOpen(false);
          }}
        />
      )}

      {user?.role === "admin" && (
        <EmpreendedorDuplicatesDialog
          open={isDuplicatesDialogOpen}
          onOpenChange={setIsDuplicatesDialogOpen}
        />
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voc├¬ tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta a├º├úo n├úo pode ser desfeita. Isso ir├í deletar permanentemente
              o empreendedor.
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
