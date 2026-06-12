"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { GeoJSON } from "geojson";
import { Loader2 } from "lucide-react";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FAD_ROUTE_BASE } from "@/lib/fiscal-ambiental/constants";
import {
  createFadWorkspace,
  updateFadWorkspace,
} from "@/lib/fiscal-ambiental/fad-api-client";
import type { FadAoiSource, FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { useToast } from "@/hooks/use-toast";
import { FadAoiEditor } from "./fad-aoi-editor";

type FadWorkspaceFormProps = {
  mode: "create" | "edit";
  workspace?: FadWorkspace;
};

export function FadWorkspaceForm({ mode, workspace }: FadWorkspaceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState(workspace?.name ?? "");
  const [carCode, setCarCode] = React.useState(workspace?.carCode ?? "");
  const [polygon, setPolygon] = React.useState<
    GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  >(workspace?.aoi ?? null);
  const [aoiSource, setAoiSource] = React.useState<FadAoiSource | undefined>(
    workspace?.aoiSource,
  );
  const [saving, setSaving] = React.useState(false);

  const handlePolygonChange = (
    geo: GeoJSON.Polygon | GeoJSON.MultiPolygon | null,
    source: FadAoiSource,
  ) => {
    setPolygon(geo);
    setAoiSource(source);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ variant: "destructive", title: "Indique o nome do imóvel." });
      return;
    }

    setSaving(true);
    try {
      const token = await getFadAuthToken();
      if (mode === "create") {
        const result = await createFadWorkspace(token, {
          name: trimmed,
          aoi: polygon ?? undefined,
          aoiSource: polygon ? aoiSource : undefined,
          carCode: carCode.trim() || undefined,
        });
        if (!result.ok) throw new Error(result.error);
        toast({ title: "Imóvel criado." });
        router.push(`${FAD_ROUTE_BASE}/workspace/${result.data.id}`);
        return;
      }

      if (!workspace) return;
      const result = await updateFadWorkspace(token, workspace.id, {
        name: trimmed,
        aoi: polygon ?? undefined,
        aoiSource: polygon ? aoiSource : undefined,
        carCode: carCode.trim() || undefined,
      });
      if (!result.ok) throw new Error(result.error);
      toast({ title: "Alterações guardadas." });
      router.push(`${FAD_ROUTE_BASE}/dashboard`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: err instanceof Error ? err.message : "Não foi possível guardar.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fad-name">Nome do imóvel / área</Label>
        <Input
          id="fad-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Fazenda São João"
          maxLength={200}
          required
        />
      </div>

      <FadAoiEditor
        polygon={polygon}
        onPolygonChange={handlePolygonChange}
        carCode={carCode}
        onCarCodeChange={setCarCode}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === "create" ? "Criar imóvel" : "Guardar alterações"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`${FAD_ROUTE_BASE}/dashboard`)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
