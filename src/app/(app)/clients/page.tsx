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
  PlusCircle,
  Eye,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";
import { ClientDuplicatesDialog } from "@/components/clients/client-duplicates-dialog";
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
  limit,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import type { Client } from "@/lib/types";
import { formatCepDisplay, formatCpfCnpjDisplay } from "@/lib/masks";
import {
  buildClientPayloadFromEmpreendedor,
  buildClientsByDocumentIndex,
  computeSyncEmpreendedorStats,
  resolveClientIdForEmpreendedor,
  type EmpreendedorForClientSync,
} from "@/lib/sync-empreendedor-to-client";
import {
  canWriteCommercialClients,
  isClientePortalRole,
} from "@/lib/role-guards";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";

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
  const [isDuplicatesDialogOpen, setIsDuplicatesDialogOpen] = useState(false);
  /** Representante: clientes encontrados por CPF/CNPJ (aprovação no empreendedor ou access_requests), quando o doc em `clients` não tem approvedUserIds. */
  const [fallbackClientsForRep, setFallbackClientsForRep] = useState<
    Client[] | null
  >(null);

  const { firestore, auth } = useFirebase();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const portalUid = resolvePortalAuthUid(user);

  const clientsQueryByUserId = useMemoFirebase(() => {
    if (!firestore || !user || !portalUid || !isClientePortalRole(user.role))
      return null;
    return query(
      collection(firestore, "clients"),
      where("userId", "==", portalUid),
    );
  }, [firestore, user, portalUid]);

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
    if (!firestore || !user || user.role !== "representative" || !portalUid)
      return null;
    return query(
      collection(firestore, "clients"),
      where("approvedUserIds", "array-contains", portalUid),
    );
  }, [firestore, user, portalUid]);

  const clientsQueryAdmin = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (
      user.role === "admin" ||
      user.role === "sales" ||
      user.role === "financial"
    ) {
      return query(collection(firestore, "clients"), limit(200));
    }
    return null;
  }, [firestore, user]);

  const { data: clientsByUserId, isLoading: isLoadingByUserId } =
    useCollection<Client>(clientsQueryByUserId);
  const { data: clientsByCpf, isLoading: isLoadingByCpf } =
    useCollection<Client>(clientsQueryByCpf);
  const { data: clientsRep, isLoading: isLoadingRep } =
    useCollection<Client>(clientsQueryRep);
  const { data: clientsAdmin, isLoading: isLoadingAdmin } =
    useCollection<Client>(clientsQueryAdmin);

  // Representante: unir clientes com approvedUserIds + clientes do titular pelo mesmo CPF/CNPJ (espelha lógica de empreendedores).
  useEffect(() => {
    if (!firestore || !user || user.role !== "representative") {
      setFallbackClientsForRep(null);
      return;
    }
    if (isLoadingRep) return;

    const db = firestore;
    const repUid = resolvePortalAuthUid(user);
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
  }, [firestore, user, clientsRep, isLoadingRep]);

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
      user?.role === "financial"
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

  const isLoading = isClientePortalRole(user?.role)
    ? isLoadingByUserId || isLoadingByCpf
    : user?.role === "representative"
      ? isLoadingRep || fallbackClientsForRep === null
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
      const [empreendedoresSnap, clientsSnap] = await Promise.all([
        getDocs(collection(firestore, "empreendedores")),
        getDocs(collection(firestore, "clients")),
      ]);

      const empreendedores: EmpreendedorForClientSync[] =
        empreendedoresSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EmpreendedorForClientSync, "id">),
        }));

      if (empreendedores.length === 0) {
        toast({
          title: "Sincronização concluída",
          description: "Nenhum empreendedor encontrado para sincronizar.",
        });
        return;
      }

      const clients: Array<Partial<Client> & { id: string }> =
        clientsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Partial<Client>),
        }));
      const clientsById = new Map<string, Partial<Client> & { id: string }>(
        clients.map((c) => [c.id, c]),
      );
      const initialClientIds = new Set<string>(clients.map((c) => c.id));
      const documentIndex = buildClientsByDocumentIndex(clients);

      let total = 0;
      let linkedExisting = 0;
      let newAtEmpreendedorId = 0;
      const chunkSize = 400; // margem de segurança do limite de 500 operações por batch
      for (let i = 0; i < empreendedores.length; i += chunkSize) {
        const chunk = empreendedores.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);

        chunk.forEach((emp) => {
          const targetClientId = resolveClientIdForEmpreendedor(
            emp,
            clientsById,
            documentIndex,
          );
          const payload = buildClientPayloadFromEmpreendedor(emp);
          const clientRef = doc(firestore, "clients", targetClientId);
          batch.set(clientRef, payload, { merge: true });

          const stats = computeSyncEmpreendedorStats(
            emp,
            targetClientId,
            initialClientIds,
          );
          total += 1;
          linkedExisting += stats.linkedExisting;
          newAtEmpreendedorId += stats.newAtEmpreendedorId;
        });

        await batch.commit();
      }

      const parts = [`${total} empreendedor(es) sincronizado(s).`];
      if (linkedExisting > 0) {
        parts.push(
          `${linkedExisting} vinculado(s) a cliente(s) já existente(s) (sem duplicar).`,
        );
      }
      if (newAtEmpreendedorId > 0) {
        parts.push(`${newAtEmpreendedorId} novo(s) em Clientes.`);
      }

      toast({
        title: "Sincronização concluída",
        description: parts.join(" "),
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
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => setIsDuplicatesDialogOpen(true)}
                >
                  <Copy className="h-4 w-4" />
                  Duplicatas CPF/CNPJ
                </Button>
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
              </>
            )}
            {canWriteCommercialClients(user?.role) && (
              <Button size="sm" className="gap-1" onClick={handleAddNew}>
                <PlusCircle className="h-4 w-4" />
                Adicionar Cliente
              </Button>
            )}
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
                  <div className="space-y-4">
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-28 w-full rounded-lg"
                        />
                      ))}
                    {!isLoading &&
                      filteredClients.map((client) => (
                        <Card
                          key={client.id}
                          className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4">
                              <div className="min-w-0 space-y-1.5">
                                <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                  {client.name}
                                </h3>
                                <p className="font-mono text-sm tabular-nums text-muted-foreground">
                                  {formatCpfCnpjDisplay(client.cpfCnpj)}
                                </p>
                                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                                  {client.email?.trim()
                                    ? client.email
                                    : "Sem e-mail"}
                                </p>
                              </div>
                              <Separator className="bg-border/60" />
                              <div className="flex flex-wrap items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      onClick={() => handleView(client)}
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">
                                        Visualizar
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Visualizar detalhes</p>
                                  </TooltipContent>
                                </Tooltip>
                                {canWriteCommercialClients(user?.role) && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 shrink-0"
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
                                          className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                          onClick={() =>
                                            openDeleteConfirm(client.id)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Deletar</span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Deletar cliente</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    {!isLoading && filteredClients.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                        Nenhum cliente encontrado para o filtro atual.
                      </div>
                    )}
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
            <div className="form-scroll-body max-h-[60vh] space-y-4">
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
                <DetailItem label="CEP" value={formatCepDisplay(clientToView.cep)} />
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

      {user?.role === "admin" && (
        <ClientDuplicatesDialog
          open={isDuplicatesDialogOpen}
          onOpenChange={setIsDuplicatesDialogOpen}
        />
      )}
    </>
  );
}
