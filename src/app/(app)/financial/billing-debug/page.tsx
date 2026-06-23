"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase } from "@/firebase";
import { getBearerApiHeaders } from "@/lib/api-client-auth";
import { useToast } from "@/hooks/use-toast";
import { parseUnifiedApiResponse } from "@/lib/api-response";
import { Badge } from "@/components/ui/badge";

type DebugOverview = {
  phases?: Array<{ id: number; name: string; description: string }>;
  sicoob?: {
    mockMode: boolean;
    ready: boolean;
    notes: string[];
  };
};

export default function BillingDebugPage() {
  const { auth, user } = useFirebase();
  const { toast } = useToast();
  const [secret, setSecret] = React.useState("");
  const [overview, setOverview] = React.useState<DebugOverview | null>(null);
  const [log, setLog] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  const headers = React.useCallback(async () => {
    const base = auth ? await getBearerApiHeaders(auth) : {};
    if (secret.trim()) {
      return { ...base, "x-billing-debug-secret": secret.trim() };
    }
    return base;
  }, [auth, secret]);

  const appendLog = (label: string, data: unknown) => {
    setLog(
      (prev) =>
        `${prev}\n\n--- ${label} ${new Date().toLocaleTimeString("pt-BR")} ---\n${JSON.stringify(data, null, 2)}`,
    );
  };

  const runGet = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/debug", { headers: await headers() });
      const parsed = await parseUnifiedApiResponse<DebugOverview>(res);
      if (!parsed.ok) throw new Error(parsed.message);
      setOverview(parsed.data);
      appendLog("GET overview", parsed.data);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Debug falhou",
        description: e instanceof Error ? e.message : "Erro",
      });
    } finally {
      setLoading(false);
    }
  };

  const runPhase = async (phase: number, extra?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/debug", {
        method: "POST",
        headers: { ...(await headers()), "Content-Type": "application/json" },
        body: JSON.stringify({ phase, ...extra }),
      });
      const parsed = await parseUnifiedApiResponse(res);
      if (!parsed.ok) throw new Error(parsed.message);
      appendLog(`POST fase ${phase}`, parsed.data);
      toast({ title: `Fase ${phase} executada` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: `Fase ${phase} falhou`,
        description: e instanceof Error ? e.message : "Erro",
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "admin" && user?.role !== "financial" && user?.role !== "supervisor") {
    return (
      <div className="p-6">
        <PageHeader title="Debug Billing" />
        <p className="text-muted-foreground">Acesso restrito a admin/financeiro/supervisor.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Debug — PIX Sicoob / Assinatura" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Autenticação do debugger</CardTitle>
            <CardDescription>
              Admin logado ou header <code>x-billing-debug-secret</code> igual a{" "}
              <code>BILLING_DEBUG_SECRET</code> no servidor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-w-md">
            <Label htmlFor="dbg-secret">BILLING_DEBUG_SECRET (opcional)</Label>
            <Input
              id="dbg-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Somente se não for admin"
            />
            <Button type="button" onClick={runGet} disabled={loading}>
              Carregar status (GET)
            </Button>
            {overview?.sicoob ? (
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant={overview.sicoob.ready ? "default" : "destructive"}>
                  Sicoob {overview.sicoob.ready ? "pronto" : "incompleto"}
                </Badge>
                {overview.sicoob.mockMode ? <Badge variant="outline">Mock</Badge> : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fases</CardTitle>
            <CardDescription>Execute cada fase e veja o log abaixo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((p) => (
              <Button
                key={p}
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() =>
                  runPhase(p, p === 3 || p === 4 ? { packageId: "basico" } : p === 6 ? { dryRun: true } : {})
                }
              >
                Fase {p}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded border bg-muted p-3 text-xs whitespace-pre-wrap">
              {log || "Execute uma fase para ver resultados."}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
