"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { CardSearchInput } from "@/components/card-search-input";
import { RecordViewDialog } from "@/components/shared/record-view-dialog";
import {
  Loader2,
  Paperclip,
  PlusCircle,
  RefreshCw,
  Download,
  Trash2,
} from "lucide-react";
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
} from "@/firebase";
import {
  collection,
  doc,
  query,
  updateDoc,
  where,
  deleteDoc,
} from "firebase/firestore";
import type { Empreendedor, MtrDeclaracao } from "@/lib/types";
import { usePortalEmpreendedorIds } from "@/hooks/use-portal-empreendedor-ids";
import { useMtrAutoSync } from "@/hooks/use-mtr-auto-sync";
import {
  mtrSourceLabel,
  mtrTipoLabel,
  parseMtrTimestamp,
} from "@/lib/mtr/mtr-declaracao-utils";
import {
  fetchMtrPdfBase64,
  fetchMtrSessionToken,
} from "@/lib/mtr/mtr-api-client";
import { mtrCredentialsFromEmpreendedor } from "@/lib/mtr/mtr-sync-service";
import {
  uploadFileToStorage,
  deleteFileAtStoragePath,
  storagePathFromDownloadUrl,
} from "@/lib/storage-upload";
import { useToast } from "@/hooks/use-toast";
import { MtrDeclaracaoUploadForm } from "./mtr-declaracao-upload-form";
import { MtrSyncDialog } from "./mtr-sync-dialog";
import { cn } from "@/lib/utils";
import { handleFirestoreFormError } from "@/lib/firestore-form-errors";
import { canPerformOperationalWrite } from "@/lib/role-guards";

type MtrStatusResponse = { configured: boolean };

const INTERNAL_BATCH_ROLES = new Set([
  "admin",
  "technical",
  "gestor",
  "supervisor",
  "advogado",
]);

function base64ToPdfFile(base64: string, name: string): File {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], name, { type: "application/pdf" });
}

export default function MtrDeclaracaoPage() {
  const { firestore, auth, user } = useFirebase();
  const { toast } = useToast();
  const portalEmpreendedorIds = usePortalEmpreendedorIds();

  const [selectedEmpreendedorId, setSelectedEmpreendedorId] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isSyncOpen, setIsSyncOpen] = React.useState(false);
  const [mtrConfigured, setMtrConfigured] = React.useState<boolean | null>(null);
  const [batchSyncing, setBatchSyncing] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<MtrDeclaracao | null>(
    null,
  );

  const canDelete = canPerformOperationalWrite(user?.role) || user?.role === "technical" || user?.role === "advogado";
  const canBatchAll =
    user?.role != null && INTERNAL_BATCH_ROLES.has(user.role);

  React.useEffect(() => {
    if (!user || !auth) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/mtr/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = (await res.json()) as MtrStatusResponse;
        if (!cancelled) setMtrConfigured(json.configured);
      } catch {
        if (!cancelled) setMtrConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth, user]);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const { data: empreendedoresRaw, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const empreendedores = React.useMemo(() => {
    if (!empreendedoresRaw) return undefined;
    if (portalEmpreendedorIds === undefined) return undefined;
    if (portalEmpreendedorIds.length === 0) return empreendedoresRaw;
    if (portalEmpreendedorIds[0] === "invalid-placeholder") return [];
    return empreendedoresRaw.filter((e) =>
      portalEmpreendedorIds.includes(e.id),
    );
  }, [empreendedoresRaw, portalEmpreendedorIds]);

  const { syncing: autoSyncing, runBatch } = useMtrAutoSync({
    empreendedores,
    mtrConfigured,
    enabled: true,
  });

  React.useEffect(() => {
    if (!selectedEmpreendedorId && empreendedores?.length === 1) {
      setSelectedEmpreendedorId(empreendedores[0].id);
    }
  }, [empreendedores, selectedEmpreendedorId]);

  const selectedEmpreendedor = React.useMemo(
    () => empreendedores?.find((e) => e.id === selectedEmpreendedorId) ?? null,
    [empreendedores, selectedEmpreendedorId],
  );

  const empreendedorById = React.useMemo(
    () => new Map(empreendedoresRaw?.map((e) => [e.id, e]) ?? []),
    [empreendedoresRaw],
  );

  const declaracoesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (selectedEmpreendedorId) {
      return query(
        collection(firestore, "mtrDeclaracoes"),
        where("empreendedorId", "==", selectedEmpreendedorId),
      );
    }
    if (portalEmpreendedorIds && portalEmpreendedorIds.length > 0) {
      if (portalEmpreendedorIds[0] === "invalid-placeholder") return null;
      if (portalEmpreendedorIds.length <= 10) {
        return query(
          collection(firestore, "mtrDeclaracoes"),
          where("empreendedorId", "in", portalEmpreendedorIds),
        );
      }
    }
    return collection(firestore, "mtrDeclaracoes");
  }, [firestore, user, selectedEmpreendedorId, portalEmpreendedorIds]);

  const { data: declaracoesRaw, isLoading: isLoadingDeclaracoes } =
    useCollection<MtrDeclaracao>(declaracoesQuery);

  const declaracoes = React.useMemo(() => {
    if (!declaracoesRaw) return undefined;
    let list = declaracoesRaw;
    if (
      portalEmpreendedorIds &&
      portalEmpreendedorIds.length > 0 &&
      portalEmpreendedorIds[0] !== "invalid-placeholder" &&
      portalEmpreendedorIds.length > 10 &&
      !selectedEmpreendedorId
    ) {
      const allowed = new Set(portalEmpreendedorIds);
      list = list.filter((d) => allowed.has(d.empreendedorId));
    }
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (d) =>
          d.titulo?.toLowerCase().includes(term) ||
          d.externalCodigo?.toLowerCase().includes(term),
      );
    }
    return [...list].sort((a, b) => {
      const ta = parseMtrTimestamp(a.syncedAt ?? a.createdAt)?.getTime() ?? 0;
      const tb = parseMtrTimestamp(b.syncedAt ?? b.createdAt)?.getTime() ?? 0;
      return tb - ta;
    });
  }, [declaracoesRaw, portalEmpreendedorIds, selectedEmpreendedorId, searchTerm]);

  const empreendedorMap = React.useMemo(
    () => new Map(empreendedoresRaw?.map((e) => [e.id, e.name]) ?? []),
    [empreendedoresRaw],
  );

  const syncSelectedViaApi = React.useCallback(async () => {
    if (!auth?.currentUser || !selectedEmpreendedorId) return;
    setBatchSyncing(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/mtr/sync-batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ empreendedorIds: [selectedEmpreendedorId] }),
      });
      const json = (await res.json()) as {
        added?: number;
        error?: string;
        results?: Array<{ added: number; error?: string }>;
      };
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const added = json.added ?? 0;
      toast({
        title: "Sincronização concluída",
        description:
          added > 0
            ? `${added} documento(s) importado(s).`
            : "Nenhum documento novo no período.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Falha na sincronização",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBatchSyncing(false);
    }
  }, [auth, selectedEmpreendedorId, toast]);

  const syncAllAuto = React.useCallback(async () => {
    if (!auth?.currentUser) return;
    setBatchSyncing(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/mtr/sync-batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ onlyAutoEnabled: true }),
      });
      const json = (await res.json()) as { added?: number; error?: string };
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      toast({
        title: "Sync automático em lote",
        description: `${json.added ?? 0} documento(s) novos em todos os empreendedores configurados.`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Falha no sync em lote",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBatchSyncing(false);
    }
  }, [auth, toast]);

  const handleDownloadPdfFromApi = async (item: MtrDeclaracao) => {
    if (!firestore || !auth?.currentUser) return;
    const emp =
      empreendedorById.get(item.empreendedorId) ?? selectedEmpreendedor;
    const credentials = emp ? mtrCredentialsFromEmpreendedor(emp) : null;
    if (!credentials) {
      setIsSyncOpen(true);
      toast({
        title: "Credenciais necessárias",
        description: "Configure o acesso MTR no cadastro do empreendedor.",
      });
      return;
    }
    if (!item.externalCodigo) return;

    setDownloadingId(item.id);
    try {
      const sessionToken = await auth.currentUser.getIdToken();
      const mtrToken = await fetchMtrSessionToken(sessionToken, credentials);
      const path =
        item.tipo === "cdf"
          ? `/buscaPdfCdf/${item.externalCodigo}`
          : `/buscaPdfManifestoPorCodigoBarras/${item.externalCodigo}`;
      const pdfBase64 = await fetchMtrPdfBase64(sessionToken, mtrToken, path);
      const file = base64ToPdfFile(
        pdfBase64,
        `mtr-${item.externalCodigo}.pdf`,
      );
      const fileUrl = await uploadFileToStorage(
        file,
        `mtr-declaracao/${item.empreendedorId}/${Date.now()}-${item.externalCodigo}.pdf`,
      );
      await updateDoc(doc(firestore, "mtrDeclaracoes", item.id), { fileUrl });
      toast({ title: "PDF guardado" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Falha ao baixar PDF",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "mtrDeclaracoes", itemToDelete.id);
    try {
      if (itemToDelete.fileUrl) {
        const path = storagePathFromDownloadUrl(itemToDelete.fileUrl);
        if (path) {
          await deleteFileAtStoragePath(path).catch(() => undefined);
        }
      }
      await deleteDoc(docRef);
      toast({ title: "Registro removido" });
    } catch (serverError) {
      handleFirestoreFormError(serverError, {
        toast,
        title: "Erro ao excluir registro",
        context: { path: docRef.path, operation: "delete" },
      });
    } finally {
      setItemToDelete(null);
    }
  };

  const isLoading =
    isLoadingEmpreendedores ||
    isLoadingDeclaracoes ||
    portalEmpreendedorIds === undefined;

  const formatDate = (value: unknown) => {
    const d = parseMtrTimestamp(value);
    return d ? d.toLocaleDateString("pt-BR") : "—";
  };

  const syncing = autoSyncing || batchSyncing;

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader
          title="MTR-Declaração"
          description="Listagem por empreendedor, sync automático MTR-MG e upload de PDF."
        >
          <div className="flex flex-wrap gap-2">
            {canBatchAll && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-1"
                disabled={mtrConfigured === false || syncing}
                onClick={() => void syncAllAuto()}
              >
                {batchSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync todos (auto)
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={!selectedEmpreendedorId || mtrConfigured === false || syncing}
              onClick={() => void syncSelectedViaApi()}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar agora
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={!selectedEmpreendedorId || mtrConfigured === false}
              onClick={() => setIsSyncOpen(true)}
            >
              Credenciais MTR
            </Button>
            <Button
              size="sm"
              className="gap-1"
              onClick={() => setIsUploadOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Enviar PDF
            </Button>
          </div>
        </PageHeader>

        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
          {mtrConfigured === false && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="py-3 text-sm text-muted-foreground">
                Configure <code className="text-xs">MTR_CHAVE_FEAM</code> no
                servidor para busca automática. Upload manual de PDF continua
                disponível.
              </CardContent>
            </Card>
          )}

          {autoSyncing && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sincronização automática em curso…
            </p>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Empreendedor</CardTitle>
              <CardDescription>
                Selecione o cliente. Com sync automático ativo no cadastro, a
                atualização corre ao abrir esta página e a cada 6 horas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={selectedEmpreendedorId || "__all__"}
                  onValueChange={(v) =>
                    setSelectedEmpreendedorId(v === "__all__" ? "" : v)
                  }
                >
                  <SelectTrigger className="sm:max-w-md">
                    <SelectValue placeholder="Todos (visíveis)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos os empreendedores</SelectItem>
                    {empreendedores?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                        {emp.mtrIntegracao?.autoSyncEnabled ? " · auto" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <CardSearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar título ou código…"
                  className="sm:max-w-xs"
                />
              </div>
              {selectedEmpreendedor?.mtrIntegracao?.lastSyncAt && (
                <p className="text-xs text-muted-foreground">
                  Última sync:{" "}
                  {new Date(
                    selectedEmpreendedor.mtrIntegracao.lastSyncAt,
                  ).toLocaleString("pt-BR")}
                  {selectedEmpreendedor.mtrIntegracao.lastSyncSummary
                    ? ` — ${selectedEmpreendedor.mtrIntegracao.lastSyncSummary}`
                    : ""}
                  {selectedEmpreendedor.mtrIntegracao.lastSyncError && (
                    <span className="text-destructive block">
                      Erro: {selectedEmpreendedor.mtrIntegracao.lastSyncError}
                    </span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos MTR</CardTitle>
              <CardDescription>
                CDFs, manifestos e declarações (upload ou importação API — últimos
                30 dias).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendedor</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && declaracoes?.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          Nenhum documento. Ative o sync no cadastro do
                          empreendedor ou envie um PDF.
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading &&
                      declaracoes?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-[140px] truncate">
                            {empreendedorMap.get(item.empreendedorId) ?? "—"}
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {item.titulo}
                            {item.externalCodigo && (
                              <span className="block text-xs text-muted-foreground font-normal">
                                {item.externalCodigo}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{mtrTipoLabel(item.tipo)}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {mtrSourceLabel(item.source)}
                          </TableCell>
                          <TableCell>{formatDate(item.syncedAt ?? item.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {item.fileUrl ? (
                                <>
                                  <RecordViewDialog
                                    title={item.titulo}
                                    fileUrl={item.fileUrl}
                                    triggerLabel="Ver PDF"
                                    labels={{ attachmentEmpty: "Sem PDF." }}
                                  >
                                    <p className="text-muted-foreground text-xs">
                                      {mtrTipoLabel(item.tipo)} ·{" "}
                                      {mtrSourceLabel(item.source)}
                                    </p>
                                  </RecordViewDialog>
                                  <Button asChild variant="ghost" size="icon">
                                    <a
                                      href={item.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label="Abrir PDF"
                                    >
                                      <Paperclip className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </>
                              ) : item.source !== "upload" && item.externalCodigo ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  disabled={downloadingId === item.id}
                                  onClick={() => void handleDownloadPdfFromApi(item)}
                                >
                                  {downloadingId === item.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                  PDF
                                </Button>
                              ) : null}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  aria-label="Excluir"
                                  onClick={() => setItemToDelete(item)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {!isLoading &&
                  declaracoes?.map((item) => (
                    <Card key={item.id} className="rounded-xl border-border/70">
                      <CardContent className="p-4 space-y-2">
                        <p className="font-medium">{item.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {empreendedorMap.get(item.empreendedorId)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{mtrTipoLabel(item.tipo)}</Badge>
                          <Badge variant="secondary" className={cn("text-xs")}>
                            {mtrSourceLabel(item.source)}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {item.fileUrl ? (
                            <Button asChild variant="outline" size="sm" className="flex-1">
                              <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                Abrir PDF
                              </a>
                            </Button>
                          ) : item.source !== "upload" && item.externalCodigo ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              disabled={downloadingId === item.id}
                              onClick={() => void handleDownloadPdfFromApi(item)}
                            >
                              Baixar PDF
                            </Button>
                          ) : null}
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive shrink-0"
                              onClick={() => setItemToDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <MtrDeclaracaoUploadForm
            empreendedores={empreendedores}
            defaultEmpreendedorId={selectedEmpreendedorId || undefined}
            onSuccess={() => setIsUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <MtrSyncDialog
        open={isSyncOpen}
        onOpenChange={setIsSyncOpen}
        empreendedor={selectedEmpreendedor}
        onSynced={() => void runBatch()}
      />

      <AlertDialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento MTR?</AlertDialogTitle>
            <AlertDialogDescription>
              O registro &quot;{itemToDelete?.titulo}&quot; será removido
              {itemToDelete?.fileUrl ? " junto com o PDF no Storage" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
