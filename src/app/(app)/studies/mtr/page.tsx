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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { useFirebase } from "@/firebase";

type MtrStatusResponse = {
  configured: boolean;
  homologDefault: boolean;
  baseUrlHint: string;
  docs: string;
};

export default function MtrMgPage() {
  const { auth, user } = useFirebase();
  const [status, setStatus] = React.useState<MtrStatusResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user || !auth) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Sessão inválida");
        const res = await fetch("/api/mtr/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as MtrStatusResponse;
        if (!cancelled) setStatus(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Falha ao consultar status MTR");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth, user]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="MTR-MG (resíduos)"
        description="Integração com o Manifesto de Transporte de Resíduos — SEMAD/FEAM MG (homologação)."
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status do servidor</CardTitle>
              <CardDescription>
                O proxy MTR corre no servidor; a chave FEAM nunca vai para o browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <p className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A consultar…
                </p>
              )}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {status && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Credencial FEAM:</span>
                    <Badge variant={status.configured ? "default" : "secondary"}>
                      {status.configured ? "Configurada" : "Não configurada"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Base API: <code className="text-xs">{status.baseUrlHint}</code>
                    {status.homologDefault ? " (homologação)" : ""}
                  </p>
                  {!status.configured && (
                    <p className="text-sm">
                      Defina <code className="text-xs">MTR_CHAVE_FEAM</code> em{" "}
                      <code className="text-xs">.env.local</code> ou nos segredos do App
                      Hosting e reinicie o servidor.
                    </p>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a href={status.docs} target="_blank" rel="noopener noreferrer">
                      Manual WebService MTR
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos passos (homologação)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Obter chave FEAM junto à SEMAD/FEAM.</p>
              <p>2. Testar <code className="text-xs">POST /api/mtr/proxy</code> com token de sessão.</p>
              <p>3. Validar consulta de manifesto em ambiente de homologação antes de produção.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
