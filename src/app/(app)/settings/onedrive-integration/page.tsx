"use client";

import * as React from "react";
import Link from "next/link";
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
import { useFirebase } from "@/firebase";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Cloud, FolderSync, Link2, RefreshCw } from "lucide-react";
import { OnedriveDownloadButton } from "@/components/onedrive/onedrive-download-button";

const PILOT_FOLDER_DEFAULT =
  "Pimenta Ltda/CLIENTES/Luciano Rodrigues Branquinho";

type StatusPayload = {
  success?: boolean;
  enabled?: boolean;
  configured?: boolean;
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

export default function OnedriveIntegrationPage() {
  const { user, auth } = useFirebase();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<StatusPayload | null>(null);
  const [clientId, setClientId] = React.useState("");
  const [folderPath, setFolderPath] = React.useState(PILOT_FOLDER_DEFAULT);
  const [entries, setEntries] = React.useState<CatalogEntry[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);

  const loadStatus = React.useCallback(async () => {
    const headers = await getAdminApiRequestHeaders(auth);
    const res = await fetch("/api/onedrive/status", { headers });
    const data = (await res.json()) as StatusPayload;
    setStatus(data);
    return data;
  }, [auth]);

  React.useEffect(() => {
    if (user?.role === "admin") {
      void loadStatus().catch(console.error);
    }
  }, [user?.role, loadStatus]);

  if (user && user.role !== "admin") {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Integração OneDrive" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Disponível apenas para administradores na fase beta.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao inicializar drive");
      toast({ title: "Drive conectado", description: data.syncSource?.driveName });
      await loadStatus();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: e instanceof Error ? e.message : String(e),
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
      const data = await res.json();
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
      const data = await res.json();
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
      const data = await res.json();
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
    <div className="flex flex-col h-full">
      <PageHeader
        title="Integração OneDrive"
        description="Beta admin — catálogo leve no Firestore; ficheiros permanecem no OneDrive."
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-4xl">
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
            </div>
            {status?.syncSource?.driveName && (
              <p className="text-sm text-muted-foreground">
                Drive: {status.syncSource.driveName} ({status.syncSource.driveId})
              </p>
            )}
            {status?.graphError && (
              <p className="text-sm text-destructive">{status.graphError}</p>
            )}
            {status?.syncSource?.lastSyncError && (
              <p className="text-sm text-destructive">
                Último erro: {status.syncSource.lastSyncError}
              </p>
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
      </main>
    </div>
  );
}
