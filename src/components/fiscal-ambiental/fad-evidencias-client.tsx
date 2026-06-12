"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FAD_ROUTE_BASE } from "@/lib/fiscal-ambiental/constants";
import {
  deleteEvidence,
  listEvidence,
  listFadWorkspaces,
  type FadEvidenceDto,
} from "@/lib/fiscal-ambiental/fad-api-client";
import type { FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useToast } from "@/hooks/use-toast";
import { FadImageCompareSlider } from "./fad-image-compare-slider";

export function FadEvidenciasClient() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [items, setItems] = React.useState<FadEvidenceDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const token = await getFadAuthToken();
        const res = await listFadWorkspaces(token);
        if (res.ok && res.data.length) {
          setWorkspaces(res.data);
          setWorkspaceId(res.data[0]!.id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadEvidence = React.useCallback(async (wsId: string) => {
    const token = await getFadAuthToken();
    const res = await listEvidence(token, wsId);
    if (res.ok) setItems(res.data);
  }, []);

  React.useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    loadEvidence(workspaceId).finally(() => setLoading(false));
  }, [workspaceId, loadEvidence]);

  const handleDelete = async (evidenceId: string) => {
    const token = await getFadAuthToken();
    const res = await deleteEvidence(token, workspaceId, evidenceId);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erro", description: res.error });
      return;
    }
    await loadEvidence(workspaceId);
  };

  if (loading && !workspaces.length) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Central de evidências</h1>
          <p className="text-sm text-muted-foreground">
            Comparações e timelapses guardados do acervo.
          </p>
        </div>
        <div className="space-y-1">
          <Label>Imóvel</Label>
          <Select value={workspaceId} onValueChange={setWorkspaceId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma evidência guardada.{" "}
          <Link href={`${FAD_ROUTE_BASE}/comparador`} className="text-primary underline">
            Criar comparação
          </Link>
        </p>
      ) : (
        <ul className="space-y-6">
          {items.map((item) => (
            <li key={item.id}>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    {item.description ? (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {item.kind === "comparison" && item.beforeDate && item.afterDate
                        ? `${item.beforeDate} → ${item.afterDate}`
                        : item.createdAt.slice(0, 10)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => handleDelete(item.id)}
                    aria-label="Remover evidência"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {item.kind === "comparison" &&
                  item.beforePreviewUrl &&
                  item.afterPreviewUrl ? (
                    <FadImageCompareSlider
                      beforeUrl={item.beforePreviewUrl}
                      afterUrl={item.afterPreviewUrl}
                      beforeLabel={item.beforeDate ?? "Antes"}
                      afterLabel={item.afterDate ?? "Depois"}
                    />
                  ) : item.framePreviewUrls?.length ? (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {item.framePreviewUrls.filter(Boolean).map((url, i) => (
                        <div
                          key={url}
                          className="relative h-24 w-36 shrink-0 overflow-hidden rounded border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Pré-visualização indisponível.</p>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
