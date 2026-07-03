"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
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
import { FileText, Folder } from "lucide-react";
import { OnedriveDownloadButton } from "@/components/onedrive/onedrive-download-button";

type CatalogEntry = {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  itemId: string;
  mimeType?: string;
};

const BETA_ROLES = new Set([
  "admin",
  "technical",
  "gestor",
  "supervisor",
  "financial",
]);

export function PastaClienteView() {
  const { user, auth } = useFirebase();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [clientId, setClientId] = React.useState(
    searchParams?.get("clientId") || "",
  );
  const [entries, setEntries] = React.useState<CatalogEntry[]>([]);
  const [folderPath, setFolderPath] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const canAccessBeta = user && BETA_ROLES.has(user.role);

  const load = async () => {
    if (!clientId.trim()) {
      toast({ variant: "destructive", title: "Informe o ID do cliente" });
      return;
    }
    setLoading(true);
    try {
      const headers = await getAdminApiRequestHeaders(auth);
      const res = await fetch(
        `/api/onedrive/catalog?clientId=${encodeURIComponent(clientId.trim())}`,
        { headers },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível carregar o catálogo.");
      }
      setEntries(data.entries || []);
      setFolderPath(data.link?.oneDrivePath || null);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const q = searchParams?.get("clientId");
    if (q && canAccessBeta) {
      setClientId(q);
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canAccessBeta]);

  if (user && !canAccessBeta) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Pasta do cliente" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Em breve</CardTitle>
              <CardDescription>
                Esta área será liberada para clientes gestão e representantes após
                os testes administrativos.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Pasta do cliente"
        description="Documentos no OneDrive (somente leitura na beta administrativa)."
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Consultar pasta vinculada</CardTitle>
            <CardDescription>
              Ficheiros permanecem no OneDrive; esta lista vem do catálogo
              sincronizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="cid">ID do cliente</Label>
                <Input
                  id="cid"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>
              <Button type="button" disabled={loading} onClick={() => void load()}>
                Carregar
              </Button>
            </div>
            {folderPath && (
              <p className="text-sm text-muted-foreground">
                Pasta OneDrive: <strong>{folderPath}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        {entries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Arquivos e pastas ({entries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between py-2 gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {e.isFolder ? (
                        <Folder className="h-4 w-4 shrink-0 text-amber-600" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      <span className="truncate text-sm">{e.name}</span>
                      {e.isFolder && <Badge variant="outline">pasta</Badge>}
                    </div>
                    {!e.isFolder && clientId && (
                      <OnedriveDownloadButton
                        auth={auth}
                        itemId={e.itemId}
                        clientId={clientId}
                        fileName={e.name}
                        className="h-auto p-0 text-xs shrink-0"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
