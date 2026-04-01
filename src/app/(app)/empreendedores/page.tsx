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
  Import,
  Eye,
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
import { FirestorePermissionError } from "@/firebase/errors";
import { useAuth } from "@/firebase";
import { ClientImportDialog } from "./client-import-dialog";
import { useCadastroMenuDebug } from "@/lib/cadastro-menu-debug";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { formatCpfCnpjDisplay } from "@/lib/masks";
import { CardSearchInput } from "@/components/card-search-input";

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null | string[];
}) => {
  const display = Array.isArray(value)
    ? value.filter((s) => typeof s === "string" && s.length > 1).join(", ") ||
      (value.length > 0 ? value.join("") : "Não informado")
    : value || "Não informado";
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-sm text-muted-foreground">{display}</p>
    </div>
  );
};

export default function EmpreendedoresPage() {
  const router = useRouter();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<Empreendedor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const firestore = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();

  const canWrite =
    user &&
    (user.role === "admin" ||
      user.role === "supervisor" ||
      user.role === "gestor");

  const [fallbackEmpreendedores, setFallbackEmpreendedores] = useState<
    Empreendedor[] | null
  >(null);

  const empreendedoresQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    if (user.role === "client") {
      const userDocuments = [
        user.cpf || user.userCpf,
        ...(user.cnpjs || []),
      ].filter(Boolean) as string[];
      if (userDocuments.length > 0) {
        return query(
          collection(firestore, "empreendedores"),
          where("cpfCnpj", "in", userDocuments),
        );
      } else {
        return query(
          collection(firestore, "empreendedores"),
          where("cpfCnpj", "==", "invalid-placeholder-for-empty-query"),
        );
      }
    }

    if (user.role === "representative") {
      return query(
        collection(firestore, "empreendedores"),
        where("approvedUserIds", "array-contains", user.id),
      );
    }

    return collection(firestore, "empreendedores");
  }, [firestore, user]);

  const { data: empreendedores, isLoading } =
    useCollection<Empreendedor>(empreendedoresQuery);

  // Representante: fallback quando approvedUserIds não retorna nada — busca por access_requests aprovados e cpfCnpj.
  useEffect(() => {
    if (!firestore || !user || user.role !== "representative" || isLoading)
      return;
    if (empreendedores && empreendedores.length > 0) {
      setFallbackEmpreendedores(null);
      return;
    }
    const repUid = user.id ?? (user as any).uid;
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
          const digits = cpf.replace(/\D/g, "");
          if (digits.length >= 11) {
            cpfs.add(cpf);
            cpfs.add(digits);
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

  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== "development")
      return;
    console.groupCollapsed("[Cadastro Debug] Empreendedores");
    console.log("loading", isLoading);
    console.log("count", empreendedores?.length ?? 0);
    console.log("canWrite", canWrite);
    console.groupEnd();
  }, [isLoading, empreendedores?.length, canWrite]);

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

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Empreendedores">
          <div className="flex gap-2">
            {canWrite && (
              <>
                <Button
                  size="sm"
                  className="gap-1"
                  variant="outline"
                  onClick={() => setIsImportOpen(true)}
                >
                  <Import className="h-4 w-4" />
                  Importar de Clientes
                </Button>
                <Button size="sm" className="gap-1" onClick={handleAddNew}>
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Empreendedor
                </Button>
              </>
            )}
          </div>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Empreendedores</CardTitle>
              <CardDescription>
                {user?.role === "representative"
                  ? "Empreendedores dos titulares (clientes) que você representa — após aprovação de acesso em Configurações → Usuários."
                  : "Adicione, edite e visualize todos os seus empreendedores (clientes técnicos)."}
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
                  placeholder="Buscar por nome, CPF/CNPJ, email ou município..."
                  className="w-full"
                />
              </div>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        CPF/CNPJ
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Email
                      </TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-5 w-32" />
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Skeleton className="h-5 w-32" />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Skeleton className="h-5 w-48" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-24" />
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoading &&
                      filteredEmpreendedores.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {formatCpfCnpjDisplay(item.cpfCnpj)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {item.email}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
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
                              {canWrite && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
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
                                        className="text-destructive hover:text-destructive"
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
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && filteredEmpreendedores.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum empreendedor encontrado.
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{itemToView?.name}</DialogTitle>
            <DialogDescription>
              Detalhes do empreendedor cadastrado.
            </DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
              <DetailItem label="Nome / Razão Social" value={itemToView.name} />
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="CPF/CNPJ"
                  value={formatCpfCnpjDisplay(itemToView.cpfCnpj)}
                />
                <DetailItem label="Tipo" value={itemToView.entityType} />
              </div>
              <DetailItem label="CTF/IBAMA" value={itemToView.ctfIbama} />
              <Separator />
              <h4 className="font-semibold text-foreground">
                Contato & Endereço
              </h4>
              <DetailItem label="Email" value={itemToView.email} />
              <DetailItem label="Telefone" value={itemToView.phone} />
              <DetailItem
                label="Endereço"
                value={`${itemToView.address || ""}, ${itemToView.numero || ""}`}
              />
              <DetailItem label="Bairro/Distrito" value={itemToView.bairro} />
              <div className="grid grid-cols-3 gap-4">
                <DetailItem label="Município" value={itemToView.municipio} />
                <DetailItem label="UF" value={itemToView.uf} />
                <DetailItem label="CEP" value={itemToView.cep} />
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

      {canWrite && (
        <ClientImportDialog
          isOpen={isImportOpen}
          onOpenChange={setIsImportOpen}
          onImportSuccess={() => {
            setIsImportOpen(false);
          }}
        />
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente
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
