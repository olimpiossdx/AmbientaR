"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, MapPin, Plus, Satellite } from "lucide-react";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FAD_ROUTE_BASE } from "@/lib/fiscal-ambiental/constants";
import { listFadWorkspaces } from "@/lib/fiscal-ambiental/fad-api-client";
import type { FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { Badge } from "@/components/ui/badge";

export function FadDashboardClient() {
  const { user, isInitialized } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    if (!isInitialized) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user) {
          setError("Faça login para continuar.");
          return;
        }
        const token = await getFadAuthToken();
        const result = await listFadWorkspaces(token);
        if (!result.ok) throw new Error(result.error);
        if (!cancelled) setWorkspaces(result.data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro ao carregar imóveis.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isInitialized]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar imóveis…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fiscal Ambiental Digital</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Crie um imóvel, defina a área no mapa e prepare o acervo de imagens INPE/CBERS.
            A montagem satelital (Fase 1) ficará disponível em seguida.
          </p>
        </div>
        <Button asChild>
          <Link href={`${FAD_ROUTE_BASE}/workspace/novo`}>
            <Plus className="mr-2 h-4 w-4" />
            Novo imóvel
          </Link>
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Satellite className="h-5 w-5" />
              Comece por aqui
            </CardTitle>
            <CardDescription>
              Ainda não há imóveis registados. Crie um workspace com o perímetro da propriedade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`${FAD_ROUTE_BASE}/workspace/novo`}>
                <MapPin className="mr-2 h-4 w-4" />
                Definir área do imóvel
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <li key={ws.id}>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{ws.name}</CardTitle>
                    <Badge variant={ws.aoi ? "default" : "secondary"}>
                      {ws.aoi ? "Área definida" : "Rascunho"}
                    </Badge>
                  </div>
                  {ws.areaHa != null ? (
                    <CardDescription>{ws.areaHa.toLocaleString("pt-BR")} ha</CardDescription>
                  ) : (
                    <CardDescription>Sem perímetro</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`${FAD_ROUTE_BASE}/workspace/${ws.id}`}>Editar área</Link>
                  </Button>
                  {ws.aoi ? (
                    <Button asChild size="sm">
                      <Link href={`${FAD_ROUTE_BASE}/montar-acervo?workspace=${ws.id}`}>
                        Montar acervo
                      </Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
