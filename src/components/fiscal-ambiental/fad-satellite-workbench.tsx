"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Download, Loader2, Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FAD_ROUTE_BASE } from "@/lib/fiscal-ambiental/constants";
import {
  assembleInpeMosaic,
  fetchInpeAvailability,
  getGeotiffDownloadUrl,
  listFadWorkspaces,
  preheatWorkspace,
  type FadMosaicDto,
  type InpeDayAvailability,
} from "@/lib/fiscal-ambiental/fad-api-client";
import type { FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FadSatelliteMap = dynamic(
  () => import("./fad-satellite-map").then((m) => m.FadSatelliteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
        A carregar mapa…
      </div>
    ),
  },
);

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2007 }, (_, i) => CURRENT_YEAR - i);

type FadSatelliteWorkbenchProps = {
  initialWorkspaceId?: string | null;
};

export function FadSatelliteWorkbench({ initialWorkspaceId }: FadSatelliteWorkbenchProps) {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState(initialWorkspaceId ?? "");
  const [year, setYear] = React.useState(CURRENT_YEAR);
  const [days, setDays] = React.useState<InpeDayAvailability[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [activeMosaic, setActiveMosaic] = React.useState<FadMosaicDto | null>(null);
  const [loadingDays, setLoadingDays] = React.useState(false);
  const [assembling, setAssembling] = React.useState(false);
  const [preheatStatus, setPreheatStatus] = React.useState<string | null>(null);

  const workspace = workspaces.find((w) => w.id === workspaceId);

  React.useEffect(() => {
    (async () => {
      try {
        const token = await getFadAuthToken();
        const res = await listFadWorkspaces(token);
        if (res.ok) {
          setWorkspaces(res.data);
          if (!workspaceId && res.data[0]) setWorkspaceId(res.data[0].id);
        }
      } catch {
        /* ignore */
      }
    })();
  }, [workspaceId]);

  React.useEffect(() => {
    if (initialWorkspaceId) setWorkspaceId(initialWorkspaceId);
  }, [initialWorkspaceId]);

  React.useEffect(() => {
    if (!workspaceId || !workspace?.aoi) {
      setDays([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingDays(true);
      try {
        const token = await getFadAuthToken();
        const res = await fetchInpeAvailability(token, workspaceId, year);
        if (!res.ok) throw new Error(res.error);
        if (!cancelled) setDays(res.data.days);
      } catch (e) {
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: e instanceof Error ? e.message : "Erro ao carregar calendário INPE.",
          });
          setDays([]);
        }
      } finally {
        if (!cancelled) setLoadingDays(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, year, workspace?.aoi, toast]);

  React.useEffect(() => {
    if (!workspaceId || !workspace?.aoi) return;
    let cancelled = false;
    setPreheatStatus("A carregar vista recente…");
    (async () => {
      try {
        const token = await getFadAuthToken();
        const res = await preheatWorkspace(token, workspaceId);
        if (cancelled) return;
        if (res.ok && res.data.mosaic?.previewUrl) {
          setActiveMosaic(res.data.mosaic);
          setSelectedDate(res.data.mosaic.requestedDate);
          setPreheatStatus("Vista recente pronta");
        } else {
          setPreheatStatus(null);
        }
      } catch {
        if (!cancelled) setPreheatStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, workspace?.aoi]);

  const onSelectDay = async (date: string) => {
    if (!workspaceId) return;
    setSelectedDate(date);
    setAssembling(true);
    try {
      const token = await getFadAuthToken();
      const res = await assembleInpeMosaic(token, workspaceId, date);
      if (!res.ok) throw new Error(res.error);
      setActiveMosaic(res.data.mosaic);
      toast({ title: "Imagem pronta", description: res.data.currentStep });
    } catch (e) {
      toast({
        variant: "destructive",
        title: e instanceof Error ? e.message : "Não foi possível montar a imagem.",
      });
    } finally {
      setAssembling(false);
    }
  };

  const onDownloadGeotiff = async () => {
    if (!workspaceId || !activeMosaic?.id) return;
    try {
      const token = await getFadAuthToken();
      const res = await getGeotiffDownloadUrl(token, workspaceId, activeMosaic.id);
      if (!res.ok) throw new Error(res.error);
      window.open(res.data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast({
        variant: "destructive",
        title: e instanceof Error ? e.message : "GeoTIFF indisponível.",
      });
    }
  };

  if (workspaces.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">Crie um imóvel com área definida para ver imagens INPE.</p>
        <Button asChild className="mt-4">
          <Link href={`${FAD_ROUTE_BASE}/workspace/novo`}>Novo imóvel</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Satellite className="h-5 w-5" />
            Imagens INPE / CBERS
          </h1>
          {preheatStatus ? (
            <p className="text-xs text-muted-foreground">{preheatStatus}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Imóvel</Label>
            <Select value={workspaceId} onValueChange={setWorkspaceId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Selecionar" />
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
          <div className="space-y-1">
            <Label>Ano</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!workspace?.aoi ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Este imóvel ainda não tem perímetro.{" "}
          <Link href={`${FAD_ROUTE_BASE}/workspace/${workspaceId}`} className="text-primary underline">
            Definir área
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Calendário</p>
            {loadingDays ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                A consultar INPE…
              </div>
            ) : days.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem imagens para este ano na área.</p>
            ) : (
              <div className="grid max-h-[420px] grid-cols-3 gap-1 overflow-y-auto sm:grid-cols-4">
                {days.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    disabled={assembling || d.quality === "none"}
                    onClick={() => onSelectDay(d.date)}
                    className={cn(
                      "rounded px-1 py-2 text-center text-xs transition-colors",
                      d.quality === "good" && "bg-emerald-600/20 hover:bg-emerald-600/30",
                      d.quality === "fair" && "bg-amber-500/20 hover:bg-amber-500/30",
                      d.quality === "none" && "bg-muted text-muted-foreground",
                      selectedDate === d.date && "ring-2 ring-primary",
                    )}
                    title={`${d.label} · ${d.cloudCover != null ? `${d.cloudCover}% nuvem` : "nuvem n/d"}`}
                  >
                    {d.date.slice(8, 10)}/{d.date.slice(5, 7)}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Verde = boa · Amarelo = parcial · Cinza = nublado
            </p>
            {activeMosaic ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onDownloadGeotiff}
              >
                <Download className="mr-2 h-4 w-4" />
                Descarregar GeoTIFF
              </Button>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="h-[min(55vh,520px)] min-h-[300px] overflow-hidden rounded-lg border">
              <FadSatelliteMap
                aoi={workspace.aoi}
                previewUrl={activeMosaic?.previewUrl}
                bounds={workspace.bbox}
              />
            </div>
            {activeMosaic ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{activeMosaic.attribution}</Badge>
                <span>
                  {activeMosaic.requestedDate}
                  {activeMosaic.resolutionM ? ` · ~${activeMosaic.resolutionM} m` : ""}
                </span>
                {activeMosaic.stacCollection ? (
                  <span className="text-xs">({activeMosaic.stacCollection})</span>
                ) : null}
              </div>
            ) : assembling ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                A preparar a sua imagem…
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Clique num dia verde ou amarelo para ver a propriedade nessa data.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
