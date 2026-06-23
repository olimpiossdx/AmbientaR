"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
import { useFirebase } from "@/firebase";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { parseApiJsonResponse } from "@/lib/parse-api-json";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Cloud, FolderSync, Link2, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { OnedriveDownloadButton } from "@/components/onedrive/onedrive-download-button";

const OAUTH_RETURN_PATH = "/settings/onedrive-integration";

function formatGraphError(message: string): string {
  if (message.includes("SPO license")) {
    return `${message} — O tenant Azure não tem SharePoint/OneDrive empresarial. Use Microsoft 365 Business com SPO ou defina ONEDRIVE_GRAPH_AUTH_MODE=delegated e ligue a conta pessoal abaixo.`;
  }
  return message;
}

const PILOT_FOLDER_DEFAULT =
  "Pimenta Ltda/CLIENTES/Luciano Rodrigues Branquinho";

type StatusPayload = {
  success?: boolean;
  enabled?: boolean;
  configured?: boolean;
  graphAuthMode?: "app" | "delegated";
  delegatedConnected?: boolean;
  graphOk?: boolean;
  graphError?: string;
  syncSource?: {
    driveId?: string;
    driveName?: string;
    lastSyncAt?: string;
    lastSyncStatus?: string;
    lastSyncError?: string;
  };
};

type CatalogEntry = {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  mimeType?: string;
  size?: number;
  itemId: string;
};

export function OnedriveIntegrationPanel({ className }: { className?: string }) {
  const { user, auth } = useFirebase();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<StatusPayload | null>(null);
  const [clientId, setClientId] = React.useState("");
  const [folderPath, setFolderPath] = React.useState(PILOT_FOLDER_DEFAULT);
  const [entries, setEntries] = React.useState<CatalogEntry[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = React.useState(false);

  const loadStatus = React.useCallback(async () => {
    const headers = await getAdminApiRequestHeaders(auth);
    const res = await fetch("/api/onedrive/status", { headers });
    const data = await parseApiJsonResponse<StatusPayload>(res);
    if (!res.ok) {
      throw new Error(
        (data as StatusPayload & { error?: string }).error ||
          "Falha ao carregar estado OneDrive.",
      );
    }
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
    void loadStatus().catch(console.error);
  }, [searchParams, toast, loadStatus]);

  const connectMicrosoft = async () => {
    setOauthBusy(true);
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch(
        `/api/onedrive-consumer/auth/start?returnPath=${encodeURIComponent(OAUTH_RETURN_PATH)}`,
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

  if (user && user.role !== "admin") {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>
            Disponível apenas para administradores na fase beta.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const runBootstrap = async () => {
    setBusy("bootstrap");
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch("/api/onedrive/status", {
        method: "POST",
        headers,
      });
      const data = await parseApiJsonResponse<
        StatusPayload & { error?: string; created?: boolean }
      >(res);
      if (!res.ok) throw new Error(data.error || "Falha ao inicializar drive");
      toast({ title: "Drive conectado", description: data.syncSource?.driveName });
      await loadStatus();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      toast({
        variant: "destructive",
        title: "Erro",
        description: formatGraphError(raw),
      });
    } finally {
      setBusy(null);
    }
  };

  const runLink = async () => {
    if (!clientId.trim() || !folderPath.trim()) {
      toast({
        variant: "destructive",
        title: "Preencha cliente e pasta",
      });
      return;
    }
    setBusy("link");
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch("/api/onedrive/link", {
        method: "POST",
        headers,
        body: JSON.stringify({
          clientId: clientId.trim(),
          folderPath: folderPath.trim(),
        }),
      });
      const data = await parseApiJsonResponse<{ error?: string; folderPath?: string }>(
        res,
      );
      if (!res.ok) throw new Error(data.error || "Falha ao vincular pasta");
      toast({
        title: "Pasta vinculada",
        description: data.folderPath,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao vincular",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(null);
    }
  };

  const runSync = async () => {
    if (!clientId.trim()) {
      toast({ variant: "destructive", title: "Informe o clientId" });
      return;
    }
    setBusy("sync");
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch("/api/onedrive/sync", {
        method: "POST",
        headers,
        body: JSON.stringify({ clientId: clientId.trim() }),
      });
      const data = await parseApiJsonResponse<{
        error?: string;
        itemsProcessed?: number;
        pages?: number;
      }>(res);
      if (!res.ok) throw new Error(data.error || "Falha no sync");
      toast({
        title: "Sync concluído",
        description: `${data.itemsProcessed} itens processados (${data.pages} páginas)`,
      });
      await loadCatalog();
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

  const loadCatalog = async () => {
    if (!clientId.trim()) return;
    setBusy("catalog");
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch(
        `/api/onedrive/catalog?clientId=${encodeURIComponent(clientId.trim())}`,
        { headers },
      );
      const data = await parseApiJsonResponse<{
        error?: string;
        entries?: CatalogEntry[];
      }>(res);
      if (!res.ok) throw new Error(data.error || "Falha ao listar catálogo");
      setEntries(data.entries || []);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao listar",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={cn("space-y-6 max-w-4xl", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Estado da conexão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={status?.enabled ? "default" : "secondary"}>
                ONEDRIVE_SYNC_ENABLED: {status?.enabled ? "sim" : "não"}
              </Badge>
              <Badge variant={status?.configured ? "default" : "secondary"}>
                Graph configurado: {status?.configured ? "sim" : "não"}
              </Badge>
              <Badge variant={status?.graphOk ? "default" : "destructive"}>
                Token: {status?.graphOk ? "ok" : "falhou"}
              </Badge>
              {status?.graphAuthMode && (
                <Badge variant="outline">
                  Modo Graph: {status.graphAuthMode}
                </Badge>
              )}
              {status?.graphAuthMode === "delegated" && (
                <Badge variant={status.delegatedConnected ? "default" : "secondary"}>
                  Conta ligada: {status.delegatedConnected ? "sim" : "não"}
                </Badge>
              )}
            </div>
            {status?.syncSource?.driveName && (
              <p className="text-sm text-muted-foreground">
                Drive: {status.syncSource.driveName} ({status.syncSource.driveId})
              </p>
            )}
            {status?.graphError && (
              <p className="text-sm text-destructive">
                {formatGraphError(status.graphError)}
              </p>
            )}
            {status?.graphAuthMode === "app" && status?.graphOk && (
              <p className="text-sm text-muted-foreground">
                Modo <strong>app</strong> (client credentials) exige tenant Microsoft
                365 com licença SharePoint/OneDrive empresarial. Contas pessoais
                (@outlook) precisam de{" "}
                <code className="text-xs">ONEDRIVE_GRAPH_AUTH_MODE=delegated</code>.
              </p>
            )}
            {!status?.enabled && status?.configured && (
              <p className="text-sm text-muted-foreground">
                Defina <code className="text-xs">ONEDRIVE_SYNC_ENABLED=true</code> no{" "}
                <code className="text-xs">.env.local</code> (dev) ou no App Hosting
                (produção) e reinicie / faça rollout para bootstrap, sync e vínculo
                de pastas (separado de{" "}
                <code className="text-xs">ONEDRIVE_RAG_ENABLED</code> da Biblioteca IA).
              </p>
            )}
            {!status?.configured && (
              <p className="text-sm text-muted-foreground">
                Configure <code className="text-xs">MICROSOFT_GRAPH_TENANT_ID</code>,{" "}
                <code className="text-xs">MICROSOFT_GRAPH_CLIENT_ID</code> e{" "}
                <code className="text-xs">MICROSOFT_GRAPH_CLIENT_SECRET</code> no{" "}
                <code className="text-xs">.env.local</code> ou nos secrets do App
                Hosting. Ver{" "}
                <Link href="/ai-lab/cloud-library" className="underline">
                  Biblioteca IA (OneDrive)
                </Link>{" "}
                e <code className="text-xs">docs/CLOUD-RAG-ONEDRIVE.md</code>.
              </p>
            )}
            {status?.syncSource?.lastSyncError && (
              <p className="text-sm text-destructive">
                Último erro: {status.syncSource.lastSyncError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {status?.graphAuthMode === "delegated" && !status.delegatedConnected && (
                <Button
                  type="button"
                  disabled={oauthBusy}
                  onClick={() => void connectMicrosoft()}
                >
                  Ligar conta Microsoft
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={busy === "bootstrap"}
                onClick={() => void runBootstrap()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Detectar drive (bootstrap)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Vincular pasta do cliente
            </CardTitle>
            <CardDescription>
              Piloto: Luciano — caminho relativo ao drive (sem SERVIDOR\). O
              cliente em Firestore deve ter o mesmo CPF/CNPJ do cadastro; após
              vincular, use Sync e no formulário de cliente/empreendedor clique
              em «Buscar por CPF» para preencher com os documentos da pasta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">ID do cliente (Firestore)</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="ID em clients/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folderPath">Caminho da pasta no OneDrive</Label>
              <Input
                id="folderPath"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={busy === "link"}
                onClick={() => void runLink()}
              >
                Vincular pasta
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy === "sync"}
                onClick={() => void runSync()}
              >
                <FolderSync className="h-4 w-4 mr-2" />
                Sincronizar catálogo
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy === "catalog"}
                onClick={() => void loadCatalog()}
              >
                Listar catálogo
              </Button>
            </div>
          </CardContent>
        </Card>

        {entries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Catálogo ({entries.length})</CardTitle>
              <CardDescription>
                Metadados no Firestore — download via Graph sob demanda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 max-h-96 overflow-auto">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 py-1 border-b">
                    <span className="font-medium truncate">{e.name}</span>
                    {e.isFolder ? (
                      <Badge variant="outline">pasta</Badge>
                    ) : (
                      <OnedriveDownloadButton
                        auth={auth}
                        itemId={e.itemId}
                        clientId={clientId}
                        fileName={e.name}
                        className="h-auto p-0 text-xs"
                      />
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Ver também{" "}
                <Link
                  href={`/documentos-ambientais/pasta-cliente?clientId=${encodeURIComponent(clientId)}`}
                  className="underline"
                >
                  Pasta do cliente (beta)
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
