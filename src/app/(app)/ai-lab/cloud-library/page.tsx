"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFirebase } from "@/firebase";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { parseApiJsonResponse } from "@/lib/parse-api-json";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Cloud, Database, FolderSync, Link2, Search, Unlink } from "lucide-react";
import { useSearchParams } from "next/navigation";

type StatusPayload = {
  enabled?: boolean;
  searchEnabled?: boolean;
  configured?: boolean;
  graphAuthMode?: "app" | "delegated";
  delegatedConnected?: boolean;
  graphOk?: boolean;
  graphError?: string;
  libraryRootPath?: string;
  stats?: {
    files?: number;
    chunks?: number;
    indexStatus?: Record<string, number>;
  };
};

export default function CloudLibraryPage() {
  const { user, auth } = useFirebase();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<StatusPayload | null>(null);
  const [oauthBusy, setOauthBusy] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [lastSyncJobId, setLastSyncJobId] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [pathPrefix, setPathPrefix] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<
    { fileName: string; path: string; chunkText: string; score: number }[]
  >([]);

  const loadStatus = React.useCallback(async () => {
    const headers = await getAdminApiRequestHeaders(auth);
    const res = await fetch("/api/cloud-rag/status", { headers });
    const data = await parseApiJsonResponse<StatusPayload & { success?: boolean; error?: string }>(res);
    if (!res.ok) throw new Error(data.error || "Falha ao carregar estado da biblioteca.");
    setStatus(data);
    return data;
  }, [auth]);

  React.useEffect(() => {
    if (user?.role === "admin") {
      void loadStatus().catch(console.error);
    }
  }, [user?.role, loadStatus]);

  React.useEffect(() => {
    if (!searchParams) return;
    const authResult = searchParams.get("onedriveAuth");
    if (!authResult) return;
    const message = searchParams.get("onedriveAuthMessage");
    toast({
      variant: authResult === "success" ? "default" : "destructive",
      title:
        authResult === "success"
          ? "OneDrive ligado"
          : "Falha ao ligar OneDrive",
      description: message || undefined,
    });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("onedriveAuth");
      url.searchParams.delete("onedriveAuthMessage");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [searchParams, toast]);

  const connectMicrosoft = async () => {
    setOauthBusy(true);
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch(
        "/api/onedrive-consumer/auth/start?returnPath=/ai-lab/cloud-library",
        { headers },
      );
      const data = await parseApiJsonResponse<{ authUrl?: string; error?: string }>(
        res,
      );
      if (!res.ok || !data.authUrl) {
        throw new Error(data.error || "Não foi possível iniciar o login Microsoft.");
      }
      window.location.href = data.authUrl;
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Login Microsoft",
        description: e instanceof Error ? e.message : String(e),
      });
      setOauthBusy(false);
    }
  };

  const disconnectMicrosoft = async () => {
    setOauthBusy(true);
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch("/api/onedrive-consumer/auth/disconnect", {
        method: "POST",
        headers,
      });
      const data = await parseApiJsonResponse<{ success?: boolean; error?: string }>(
        res,
      );
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao desligar conta.");
      }
      toast({ title: "Conta Microsoft desligada" });
      await loadStatus();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Desligar conta",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setOauthBusy(false);
    }
  };

  if (user && user.role !== "admin") {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Biblioteca IA (OneDrive)" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Disponível apenas para administradores.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  const runSync = async (continueJob = false) => {
    setBusy("sync");
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch("/api/cloud-rag/sync", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: continueJob ? lastSyncJobId || undefined : undefined,
          continueDelta: continueJob,
        }),
      });
      const data = await parseApiJsonResponse<{
        success?: boolean;
        error?: string;
        jobId?: string;
        completed?: boolean;
        itemsProcessed?: number;
        pages?: number;
      }>(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha ao sincronizar biblioteca.");
      }
      if (data.jobId) setLastSyncJobId(data.jobId);
      toast({
        title: data.completed ? "Sync concluído" : "Lote de sync",
        description: `${data.itemsProcessed} item(ns), ${data.pages} página(s).`,
      });
      await loadStatus();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro no sync",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(null);
    }
  };

  const runIndex = async () => {
    setBusy("index");
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch("/api/cloud-rag/index", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await parseApiJsonResponse<{
        success?: boolean;
        error?: string;
        message?: string;
        indexed?: number;
      }>(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha na indexação.");
      }
      toast({
        title: "Indexação",
        description: data.message || `${data.indexed} ficheiro(s) indexado(s).`,
      });
      await loadStatus();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro na indexação",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(null);
    }
  };

  const runSearch = async () => {
    setBusy("search");
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch("/api/cloud-rag/search", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          pathPrefix: pathPrefix || undefined,
          maxChunks: 12,
        }),
      });
      const data = await parseApiJsonResponse<{
        success?: boolean;
        error?: string;
        chunks?: Array<{
          fileName: string;
          path: string;
          chunkText: string;
          score?: number;
        }>;
      }>(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Falha na pesquisa.");
      }
      setSearchResults(
        Array.isArray(data.chunks)
          ? data.chunks.map((c) => ({
              fileName: c.fileName,
              path: c.path,
              chunkText: c.chunkText,
              score: Number(c.score || 0),
            }))
          : [],
      );
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro na pesquisa",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Biblioteca IA (OneDrive)"
        description="Sync, indexação e pesquisa na nuvem — módulo separado do import local."
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={status?.enabled ? "default" : "secondary"}>
                ONEDRIVE_RAG_ENABLED: {status?.enabled ? "sim" : "não"}
              </Badge>
              <Badge variant="outline">
                Auth: {status?.graphAuthMode || "app"}
              </Badge>
              {status?.graphAuthMode === "delegated" && (
                <Badge
                  variant={status?.delegatedConnected ? "default" : "secondary"}
                >
                  Conta: {status?.delegatedConnected ? "ligada" : "não ligada"}
                </Badge>
              )}
              <Badge variant={status?.graphOk ? "default" : "destructive"}>
                Graph: {status?.graphOk ? "ok" : "falhou"}
              </Badge>
            </div>
            {status?.graphAuthMode === "delegated" && (
              <div className="flex flex-wrap gap-2 pt-1">
                {!status.delegatedConnected ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={oauthBusy}
                    onClick={() => void connectMicrosoft()}
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    Ligar conta Microsoft
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={oauthBusy}
                    onClick={() => void disconnectMicrosoft()}
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    Desligar conta
                  </Button>
                )}
              </div>
            )}
            {status?.libraryRootPath && (
              <p className="text-sm text-muted-foreground">
                Raiz: {status.libraryRootPath}
              </p>
            )}
            {status?.stats && (
              <p className="text-sm">
                Ficheiros: {status.stats.files ?? 0} · Chunks:{" "}
                {status.stats.chunks ?? 0}
                {status.stats.indexStatus && (
                  <>
                    {" "}
                    · pending: {status.stats.indexStatus.pending ?? 0} ·
                    indexed: {status.stats.indexStatus.indexed ?? 0}
                  </>
                )}
              </p>
            )}
            {status?.graphError && (
              <p className="text-sm text-destructive">{status.graphError}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadStatus()}
            >
              Atualizar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderSync className="h-5 w-5" />
              1. Sincronizar catálogo
            </CardTitle>
            <CardDescription>
              Inventário de ficheiros no OneDrive (metadados no Firestore).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy === "sync"}
              onClick={() => void runSync(false)}
            >
              Sincronizar biblioteca
            </Button>
            {lastSyncJobId && (
              <Button
                type="button"
                variant="secondary"
                disabled={busy === "sync"}
                onClick={() => void runSync(true)}
              >
                Continuar sync ({lastSyncJobId.slice(0, 8)}…)
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              2. Indexar texto
            </CardTitle>
            <CardDescription>
              Extrai texto bruto e gera chunks pesquisáveis (lote).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              disabled={busy === "index"}
              onClick={() => void runIndex()}
            >
              Indexar pendentes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              3. Testar pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="q">Consulta</Label>
              <Input
                id="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="termo, CPF/CNPJ, assunto..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefixo de pasta (opcional)</Label>
              <Input
                id="prefix"
                value={pathPrefix}
                onChange={(e) => setPathPrefix(e.target.value)}
                placeholder="Pimenta Ltda/CLIENTES/..."
              />
            </div>
            <Button
              type="button"
              disabled={busy === "search" || !searchQuery.trim()}
              onClick={() => void runSearch()}
            >
              Pesquisar
            </Button>
            {searchResults.length > 0 && (
              <ul className="text-sm space-y-3 max-h-96 overflow-auto border rounded-md p-3">
                {searchResults.map((r, i) => (
                  <li key={`${r.path}-${i}`} className="border-b pb-2">
                    <p className="font-medium">
                      {r.fileName}{" "}
                      <span className="text-muted-foreground text-xs">
                        score {r.score}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.path}
                    </p>
                    <Textarea
                      readOnly
                      className="mt-1 text-xs h-20"
                      value={r.chunkText.slice(0, 800)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
