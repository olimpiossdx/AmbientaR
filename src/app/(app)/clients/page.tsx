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
  Eye,
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
  writeBatch,
} from "firebase/firestore";
import type { Client } from "@/lib/types";
import { formatCpfCnpjDisplay } from "@/lib/masks";
import { isClientePortalRole } from "@/lib/role-guards";

function documentVariants(
  cpf: string | undefined,
  cnpjs: string[] | undefined,
): string[] {
  const raw = [cpf, ...(cnpjs || [])].filter(Boolean) as string[];
  const set = new Set<string>();
  raw.forEach((v) => {
    set.add(v);
    const d = v.replace(/\D/g, "");
    if (d.length >= 11) set.add(d);
  });
  return Array.from(set).slice(0, 10);
}
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
import { logUserAction } from "@/lib/audit-log";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
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

export default function ClientsPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [clientToView, setClientToView] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncingFromEmpreendedores, setIsSyncingFromEmpreendedores] =
    useState(false);
  /** Representante: clientes encontrados por CPF/CNPJ (aprovação no empreendedor ou access_requests), quando o doc em `clients` não tem approvedUserIds. */
  const [fallbackClientsForRep, setFallbackClientsForRep] = useState<
    Client[] | null
  >(null);

  const { firestore, auth } = useFirebase();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const clientsQueryByUserId = useMemoFirebase(() => {
    if (!firestore || !user || !isClientePortalRole(user.role)) return null;
    return query(
      collection(firestore, "clients"),
      where("userId", "==", user.id),
    );
  }, [firestore, user]);

  const clientsQueryByCpf = useMemoFirebase(() => {
    if (!firestore || !user || !isClientePortalRole(user.role)) return null;
    const variants = documentVariants(user.cpf || user.userCpf, user.cnpjs);
    if (variants.length === 0)
      return query(
        collection(firestore, "clients"),
        where("cpfCnpj", "==", "__none__"),
      );
    return query(
      collection(firestore, "clients"),
      where("cpfCnpj", "in", variants),
    );
  }, [firestore, user]);

  const clientsQueryRep = useMemoFirebase(() => {
    if (!firestore || !user || user.role !== "representative") return null;
    return query(
      collection(firestore, "clients"),
      where("approvedUserIds", "array-contains", user.id),
    );
  }, [firestore, user]);

  const clientsQueryAdmin = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (
      user.role === "admin" ||
      user.role === "sales" ||
      user.role === "financial" ||
      user.role === "supervisor"
    ) {
      return collection(firestore, "clients");
    }
    return null;
  }, [firestore, user]);

  const { data: clientsByUserId } = useCollection<Client>(clientsQueryByUserId);
  const { data: clientsByCpf } = useCollection<Client>(clientsQueryByCpf);
  const { data: clientsRep } = useCollection<Client>(clientsQueryRep);
  const { data: clientsAdmin, isLoading: isLoadingAdmin } =
    useCollection<Client>(clientsQueryAdmin);

  // Representante: unir clientes com approvedUserIds + clientes do titular pelo mesmo CPF/CNPJ (espelha lógica de empreendedores).
  useEffect(() => {
    if (!firestore || !user || user.role !== "representative") {
      setFallbackClientsForRep(null);
      return;
    }
    if (clientsRep === undefined) return;

    const db = firestore;
    const repUid = user.id ?? (user as { uid?: string }).uid;
    if (!repUid) {
      setFallbackClientsForRep([]);
      return;
    }

    let cancelled = false;

    async function loadFallbackClients() {
      const cpfs = new Set<string>();
      try {
        const qReq = query(
          collection(db, "access_requests"),
          where("status", "==", "approved"),
          where("requestedByUserId", "==", repUid),
        );
        const reqSnap = await getDocs(qReq);
        reqSnap.docs.forEach((d) => {
          const cpf = String(d.data().cpfOfInterested || "").trim();
          const digits = cpf.replace(/\D/g, "");
          if (digits.length >= 11) {
            cpfs.add(cpf);
            cpfs.add(digits);
          }
        });

        const qEmp = query(
          collection(db, "empreendedores"),
          where("approvedUserIds", "array-contains", repUid),
        );
        const empSnap = await getDocs(qEmp);
        empSnap.docs.forEach((d) => {
          const raw = String((d.data() as { cpfCnpj?: string }).cpfCnpj || "")
            .trim();
          if (!raw) return;
          const digits = raw.replace(/\D/g, "");
          cpfs.add(raw);
          if (digits.length >= 11) cpfs.add(digits);
        });
      } catch {
        if (!cancelled) setFallbackClientsForRep([]);
        return;
      }

      const cpfList = Array.from(cpfs);
      if (cpfList.length === 0) {
        if (!cancelled) setFallbackClientsForRep([]);
        return;
      }

      const clientsRef = collection(db, "clients");
      const chunks: string[][] = [];
      for (let i = 0; i < cpfList.length; i += 10) {
        chunks.push(cpfList.slice(i, i + 10));
      }

      try {
        const snaps = await Promise.all(
          chunks.map((batch) =>
            getDocs(query(clientsRef, where("cpfCnpj", "in", batch))),
          ),
        );
        if (cancelled) return;
        const byId = new Map<string, Client>();
        snaps.forEach((snap) => {
          snap.docs.forEach((docSnap) => {
            byId.set(docSnap.id, {
              id: docSnap.id,
              ...docSnap.data(),
            } as Client);
          });
        });
        setFallbackClientsForRep(Array.from(byId.values()));
      } catch {
        if (!cancelled) setFallbackClientsForRep([]);
      }
    }

    void loadFallbackClients();
    return () => {
      cancelled = true;
    };
  }, [firestore, user, clientsRep]);

  const clients = useMemo(() => {
    if (isClientePortalRole(user?.role)) {
      const byId = clientsByUserId ?? [];
      const byCpf = clientsByCpf ?? [];
      const merged = new Map<string, Client>();
      [...byId, ...byCpf].forEach((c) => merged.set(c.id, c));
      return Array.from(merged.values());
    }
    if (user?.role === "representative") {
      const primary = clientsRep ?? [];
      const extra =
        fallbackClientsForRep === null ? [] : fallbackClientsForRep;
      const merged = new Map<string, Client>();
      [...primary, ...extra].forEach((c) => merged.set(c.id, c));
      return Array.from(merged.values());
    }
    if (
      user?.role === "admin" ||
      user?.role === "sales" ||
      user?.role === "financial" ||
      user?.role === "supervisor"
    )
      return clientsAdmin ?? [];
    return [];
  }, [
    user,
    clientsByUserId,
    clientsByCpf,
    clientsRep,
    clientsAdmin,
    fallbackClientsForRep,
  ]);

  const isLoading =
    isClientePortalRole(user?.role)
      ? clientsByUserId === undefined || clientsByCpf === undefined
      : user?.role === "representative"
        ? clientsRep === undefined || fallbackClientsForRep === null
        : isLoadingAdmin;

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const term = searchTerm.trim().toLowerCase();
    const base = !term
      ? clients
      : clients.filter((client) => {
      const name = client.name?.toLowerCase() ?? "";
      const email = client.email?.toLowerCase() ?? "";
      const cpfCnpj = client.cpfCnpj ?? "";
      return (
        name.includes(term) || email.includes(term) || cpfCnpj.includes(term)
      );
    });
    return [...base].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" }),
    );
  }, [clients, searchTerm]);

  const handleAddNew = () => {
    router.push("/clients/new");
  };

  const handleSyncEmpreendedoresToClients = async () => {
    if (!firestore) return;
    setIsSyncingFromEmpreendedores(true);
    try {
      const empreendedoresSnap = await getDocs(
        collection(firestore, "empreendedores"),
      );
      const empreendedores = empreendedoresSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      if (empreendedores.length === 0) {
        toast({
          title: "Sincronização concluída",
          description: "Nenhum empreendedor encontrado para sincronizar.",
        });
        return;
      }

      let updatedCount = 0;
      const chunkSize = 400; // margem de segurança do limite de 500 operações por batch
      for (let i = 0; i < empreendedores.length; i += chunkSize) {
        const chunk = empreendedores.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);

        chunk.forEach((emp) => {
          const cpfCnpjDigits = String(emp.cpfCnpj || "").replace(/\D/g, "");
          const entityType = Array.isArray(emp.entityType)
            ? emp.entityType.includes("Pessoa Jurídica")
              ? "Pessoa Jurídica"
              : emp.entityType.includes("Produtor Rural")
                ? "Produtor Rural"
                : "Pessoa Física"
            : emp.entityType || "Pessoa Física";

          const payload = {
            name: emp.name || "",
            cpfCnpj: cpfCnpjDigits,
            entityType,
            phone: emp.phone || "",
            email: emp.email || "",
            dataNascimento: emp.dataNascimento || "",
            ctfIbama: emp.ctfIbama || "",
            address: emp.address || "",
            numero: emp.numero || "",
            bairro: emp.bairro || "",
            municipio: emp.municipio || "",
            uf: emp.uf || "",
            cep: emp.cep || "",
            userId: emp.userId || "",
          };

          const clientRef = doc(firestore, "clients", emp.id);
          batch.set(clientRef, payload, { merge: true });
          updatedCount += 1;
        });

        await batch.commit();
      }

      toast({
        title: "Sincronização concluída",
        description: `${updatedCount} cadastro(s) de empreendedor sincronizado(s) em Clientes.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha na sincronização",
        description:
          "Não foi possível sincronizar os empreendedores em clientes.",
      });
    } finally {
      setIsSyncingFromEmpreendedores(false);
    }
  };

  const handleEdit = (client: Client) => {
    router.push(`/clients/${client.id}/edit`);
  };

  const handleView = (client: Client) => {
    setClientToView(client);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (clientId: string) => {
    setClientToDelete(clientId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !auth || !clientToDelete) return;

    const clientDocRef = doc(firestore, "clients", clientToDelete);
    deleteDoc(clientDocRef)
      .then(() => {
        toast({
          title: "Cliente deletado",
          description: "O cliente foi removido com sucesso.",
        });
        const deletedClient = clients?.find((c) => c.id === clientToDelete);
        logUserAction(firestore, auth, "delete_client", {
          clientId: clientToDelete,
          clientName: deletedClient?.name || "N/A",
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: clientDocRef.path,
          operation: "delete",
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setClientToDelete(null);
      });
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Clientes">
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={handleSyncEmpreendedoresToClients}
                disabled={isSyncingFromEmpreendedores}
              >
                {isSyncingFromEmpreendedores
                  ? "Sincronizando..."
                  : "Sincronizar Empreendedores"}
              </Button>
            )}
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Adicionar Cliente
            </Button>
          </div>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Clientes</CardTitle>
              <CardDescription>
                Adicione, edite e visualize todos os seus clientes comerciais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      {clients?.length
                        ? `Total: ${clients.length} cliente(s)`
                        : null}
                    </div>
                    <CardSearchInput
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Buscar por nome, CPF/CNPJ ou email..."
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-3 md:hidden">
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-4 space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-36" />
                          </CardContent>
                        </Card>
                      ))}
                    {!isLoading &&
                      filteredClients.map((client) => (
                      <Card key={client.id} className="rounded-xl border-border/70 shadow-sm">
                        <CardContent className="p-4 space-y-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{client.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCpfCnpjDisplay(client.cpfCnpj)}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {client.email || "Sem e-mail"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(client)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(client)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => openDeleteConfirm(client.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    {!isLoading && filteredClients.length === 0 && (
                      <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                        Nenhum cliente encontrado para o filtro atual.
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF/CNPJ</TableHead>
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
                            <TableCell>
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
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            {client.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatCpfCnpjDisplay(client.cpfCnpj)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {client.email}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleView(client)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Visualizar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualizar detalhes</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(client)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar cliente</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => openDeleteConfirm(client.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Deletar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Deletar cliente</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!isLoading && filteredClients.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            Nenhum cliente encontrado para o filtro atual.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{clientToView?.name}</DialogTitle>
            <DialogDescription>
              Detalhes do cliente cadastrado.
            </DialogDescription>
          </DialogHeader>
          {clientToView && (
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
              <DetailItem
                label="Nome / Razão Social"
                value={clientToView.name}
              />
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="CPF/CNPJ"
                  value={formatCpfCnpjDisplay(clientToView.cpfCnpj)}
                />
                <DetailItem label="Tipo" value={clientToView.entityType} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Identidade (RG)"
                  value={clientToView.identidade}
                />
                <DetailItem
                  label="Órgão Emissor"
                  value={clientToView.emissor}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Nacionalidade"
                  value={clientToView.nacionalidade}
                />
                <DetailItem
                  label="Estado Civil"
                  value={clientToView.estadoCivil}
                />
              </div>
              <DetailItem
                label="Data de Nascimento"
                value={
                  clientToView.dataNascimento
                    ? new Date(clientToView.dataNascimento).toLocaleDateString(
                        "pt-BR",
                      )
                    : ""
                }
              />
              <DetailItem label="CTF/IBAMA" value={clientToView.ctfIbama} />
              <Separator />
              <h4 className="font-semibold text-foreground">
                Contato & Endereço
              </h4>
              <DetailItem label="Email" value={clientToView.email} />
              <DetailItem label="Telefone" value={clientToView.phone} />
              <DetailItem
                label="Endereço"
                value={`${clientToView.address || ""}, ${clientToView.numero || ""}`}
              />
              <DetailItem label="Bairro/Distrito" value={clientToView.bairro} />
              <div className="grid grid-cols-3 gap-4">
                <DetailItem label="Município" value={clientToView.municipio} />
                <DetailItem label="UF" value={clientToView.uf} />
                <DetailItem label="CEP" value={clientToView.cep} />
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

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente
              o cliente.
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
