"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { getFadWorkspace } from "@/lib/fiscal-ambiental/fad-api-client";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useAuth } from "@/firebase";
import type { FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { FadWorkspaceForm } from "@/components/fiscal-ambiental/fad-workspace-form";

export function FadWorkspaceEditPage({ workspaceId }: { workspaceId: string }) {
  const { user, isInitialized } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [workspace, setWorkspace] = React.useState<FadWorkspace | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!isInitialized) return;
    (async () => {
      try {
        if (!user) throw new Error("Faça login para continuar.");
        const token = await getFadAuthToken();
        const result = await getFadWorkspace(token, workspaceId);
        if (!result.ok) throw new Error(result.error);
        if (!cancelled) setWorkspace(result.data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro ao carregar imóvel.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isInitialized, workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar…
      </div>
    );
  }

  if (error || !workspace) {
    return <p className="text-sm text-destructive">{error ?? "Imóvel não encontrado."}</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Editar imóvel</h1>
        <p className="text-sm text-muted-foreground">{workspace.name}</p>
      </div>
      <FadWorkspaceForm mode="edit" workspace={workspace} />
    </div>
  );
}
