"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bookmark, Loader2, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FAD_ROUTE_BASE } from "@/lib/fiscal-ambiental/constants";
import {
  createCompareSession,
  fetchTimelapse,
  listFadWorkspaces,
  listMosaics,
  saveEvidence,
  type FadCompareSessionDto,
  type FadMosaicDto,
  type FadTimelapseFrameDto,
} from "@/lib/fiscal-ambiental/fad-api-client";
import type { FadWorkspace } from "@/lib/fiscal-ambiental/types";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { useToast } from "@/hooks/use-toast";
import { FadImageCompareSlider } from "./fad-image-compare-slider";

const FadSatelliteMap = dynamic(
  () => import("./fad-satellite-map").then((m) => m.FadSatelliteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
        A carregar mapa…
      </div>
    ),
  },
);

type FadComparadorClientProps = {
  initialWorkspaceId?: string | null;
  initialMosaicId?: string | null;
};

export function FadComparadorClient({
  initialWorkspaceId,
  initialMosaicId,
}: FadComparadorClientProps) {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = React.useState<FadWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState(initialWorkspaceId ?? "");
  const [mosaics, setMosaics] = React.useState<FadMosaicDto[]>([]);
  const [beforeId, setBeforeId] = React.useState("");
  const [afterId, setAfterId] = React.useState("");
  const [session, setSession] = React.useState<FadCompareSessionDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [comparing, setComparing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [frames, setFrames] = React.useState<FadTimelapseFrameDto[]>([]);
  const [frameIndex, setFrameIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const token = await getFadAuthToken();
        const res = await listFadWorkspaces(token);
        if (res.ok && res.data.length) {
          setWorkspaces(res.data);
          if (!workspaceId) setWorkspaceId(res.data[0]!.id);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      const token = await getFadAuthToken();
      const res = await listMosaics(token, workspaceId);
      if (res.ok) {
        const ready = res.data.filter((m) => m.status === "ready");
        setMosaics(ready);
        if (ready.length >= 2) {
          const sorted = [...ready].sort((a, b) =>
            a.requestedDate.localeCompare(b.requestedDate),
          );
          const hint = initialMosaicId
            ? sorted.findIndex((m) => m.id === initialMosaicId)
            : sorted.length - 1;
          const afterIdx = hint >= 0 ? hint : sorted.length - 1;
          const beforeIdx = Math.max(0, afterIdx - 1);
          setBeforeId(sorted[beforeIdx]!.id);
          setAfterId(sorted[afterIdx]!.id);
        }
      }
    })();
  }, [workspaceId, initialMosaicId]);

  const runCompare = async () => {
    if (!workspaceId || !beforeId || !afterId) return;
    setComparing(true);
    try {
      const token = await getFadAuthToken();
      const res = await createCompareSession(token, workspaceId, beforeId, afterId);
      if (!res.ok) {
        toast({ variant: "destructive", title: "Erro", description: res.error });
        return;
      }
      setSession(res.data);
    } finally {
      setComparing(false);
    }
  };

  React.useEffect(() => {
    if (beforeId && afterId && beforeId !== afterId) {
      runCompare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beforeId, afterId, workspaceId]);

  const loadTimelapse = async () => {
    if (!workspaceId) return;
    const token = await getFadAuthToken();
    const res = await fetchTimelapse(token, workspaceId);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erro", description: res.error });
      return;
    }
    setFrames(res.data.frames);
    setFrameIndex(0);
  };

  React.useEffect(() => {
    if (workspaceId) loadTimelapse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  React.useEffect(() => {
    if (!playing || frames.length < 2) return;
    const id = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames.length);
    }, 1200);
    return () => window.clearInterval(id);
  }, [playing, frames.length]);

  const handleSaveEvidence = async () => {
    if (!session || !workspaceId) return;
    setSaving(true);
    try {
      const token = await getFadAuthToken();
      const title = `Comparação ${session.before.requestedDate} → ${session.after.requestedDate}`;
      const res = await saveEvidence(token, workspaceId, {
        kind: "comparison",
        title,
        beforeMosaicId: session.before.id,
        afterMosaicId: session.after.id,
      });
      if (!res.ok) {
        toast({ variant: "destructive", title: "Erro", description: res.error });
        return;
      }
      toast({
        title: "Comparação guardada",
        description: "Disponível em Evidências.",
      });
    } finally {
      setSaving(false);
    }
  };

  const workspace = workspaces.find((w) => w.id === workspaceId);
  const currentFrame = frames[frameIndex];

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
          <h1 className="text-xl font-semibold">Comparador temporal</h1>
          <p className="text-sm text-muted-foreground">
            Antes/depois com slider — sem novo processamento pesado.
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

      {mosaics.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          São necessárias pelo menos duas imagens no acervo.{" "}
          <Link href={`${FAD_ROUTE_BASE}/montar-acervo`} className="text-primary underline">
            Montar acervo
          </Link>
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <Label>Antes</Label>
              <Select value={beforeId} onValueChange={setBeforeId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mosaics.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.requestedDate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Depois</Label>
              <Select value={afterId} onValueChange={setAfterId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mosaics.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.requestedDate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={runCompare} disabled={comparing}>
                {comparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Atualizar
              </Button>
              <Button onClick={handleSaveEvidence} disabled={!session || saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bookmark className="mr-2 h-4 w-4" />
                )}
                Guardar evidência
              </Button>
            </div>
          </div>

          <Tabs defaultValue="slider">
            <TabsList>
              <TabsTrigger value="slider">Slider</TabsTrigger>
              <TabsTrigger value="mapa">Mapa</TabsTrigger>
              <TabsTrigger value="timelapse">Timelapse</TabsTrigger>
            </TabsList>

            <TabsContent value="slider" className="mt-4">
              {session?.before.previewUrl && session.after.previewUrl ? (
                <FadImageCompareSlider
                  beforeUrl={session.before.previewUrl}
                  afterUrl={session.after.previewUrl}
                  beforeLabel={session.before.requestedDate}
                  afterLabel={session.after.requestedDate}
                />
              ) : (
                <p className="text-sm text-muted-foreground">A carregar comparação…</p>
              )}
            </TabsContent>

            <TabsContent value="mapa" className="mt-4">
              <div className="h-[min(420px,55vh)] overflow-hidden rounded-md border">
                {session && workspace?.aoi ? (
                  <FadSatelliteMap
                    aoi={session.aoi}
                    previewUrl={session.after.previewUrl}
                    bounds={workspace.bbox}
                  />
                ) : null}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Mapa com AOI e imagem «depois». Use o slider para comparar visualmente as previews.
              </p>
            </TabsContent>

            <TabsContent value="timelapse" className="mt-4 space-y-4">
              {currentFrame?.previewUrl ? (
                <div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentFrame.previewUrl}
                    alt={currentFrame.date}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                    {currentFrame.date} ({frameIndex + 1}/{frames.length})
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem frames para timelapse.</p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlaying((p) => !p)}
                  disabled={frames.length < 2}
                >
                  {playing ? (
                    <Square className="mr-2 h-4 w-4" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {playing ? "Parar" : "Reproduzir"}
                </Button>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, frames.length - 1)}
                  value={frameIndex}
                  onChange={(e) => {
                    setPlaying(false);
                    setFrameIndex(Number(e.target.value));
                  }}
                  className="flex-1"
                  disabled={frames.length < 2}
                />
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

export function FadComparadorPageClient() {
  const searchParams = useSearchParams();
  const workspace = searchParams?.get("workspace");
  const mosaic = searchParams?.get("mosaic");
  return (
    <FadComparadorClient initialWorkspaceId={workspace} initialMosaicId={mosaic} />
  );
}
