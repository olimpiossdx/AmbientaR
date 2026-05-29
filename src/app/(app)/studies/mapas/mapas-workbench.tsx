"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { StudyGeospatialSplitShell } from "@/components/studies/study-geospatial-split-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFirebase, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { StudyAreaGeoJSON } from "@/components/maps/study-area-map";
import type { StacPreviewItem } from "@/lib/study-maps/types";
import { Loader2, Satellite, FileArchive } from "lucide-react";
import { parseStudyAreaFileText } from "@/lib/study-maps/import-area-file";

const StudyAreaMap = dynamic(
  () =>
    import("@/components/maps/study-area-map").then((m) => ({
      default: m.StudyAreaMap,
    })),
  { ssr: false },
);

type JobRow = {
  jobId: string;
  projectTitle: string;
  status: string;
  createdAt: string | null;
  artifactUrls?: Record<string, string>;
};

export function MapasWorkbench() {
  const { auth } = useFirebase();
  const { user, isInitialized } = useAuth();
  const { toast } = useToast();
  const [polygon, setPolygon] = React.useState<StudyAreaGeoJSON | null>(null);
  const [title, setTitle] = React.useState("Perímetro");
  const [fetchOsm, setFetchOsm] = React.useState(true);
  const [targetCrs, setTargetCrs] = React.useState("EPSG:31983");
  const [busy, setBusy] = React.useState(false);
  const [stacBusy, setStacBusy] = React.useState(false);
  const [stacItems, setStacItems] = React.useState<StacPreviewItem[]>([]);
  const [jobs, setJobs] = React.useState<JobRow[]>([]);

  const bearer = React.useCallback(async () => {
    const u = auth?.currentUser;
    if (!u) throw new Error("Sessão inválida.");
    return u.getIdToken();
  }, [auth]);

  const loadJobs = React.useCallback(async () => {
    if (!auth?.currentUser) return;
    try {
      const token = await bearer();
      const res = await fetch("/api/study-maps/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao listar jobs.");
      setJobs(data.jobs ?? []);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Não foi possível listar jobs",
        description: e instanceof Error ? e.message : "Erro de rede ou permissão.",
      });
    }
  }, [auth, bearer, toast]);

  React.useEffect(() => {
    if (isInitialized && user) void loadJobs();
  }, [isInitialized, user, loadJobs]);

  const runStacPreview = async () => {
    if (!polygon) {
      toast({ title: "Desenhe ou importe um polígono.", variant: "destructive" });
      return;
    }
    setStacBusy(true);
    setStacItems([]);
    try {
      const token = await bearer();
      const res = await fetch("/api/study-maps/stac-preview", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ geojson: polygon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "STAC falhou.");
      setStacItems(data.items ?? []);
      toast({ title: "Pré-visualização STAC atualizada." });
    } catch (e) {
      toast({
        title: "STAC",
        description: e instanceof Error ? e.message : "Erro",
        variant: "destructive",
      });
    } finally {
      setStacBusy(false);
    }
  };

  const runExport = async () => {
    if (!polygon) {
      toast({ title: "Desenhe um polígono no mapa.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const token = await bearer();
      const res = await fetch("/api/study-maps/export", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          geojson: polygon,
          projectTitle: title,
          fetchOsm,
          targetCrs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Exportação falhou.");
      toast({ title: "Exportação concluída", description: `Job ${data.jobId}` });
      await loadJobs();
    } catch (e) {
      toast({
        title: "Exportação",
        description: e instanceof Error ? e.message : "Erro",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const onImportFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const gj = parseStudyAreaFileText(text, f.name);
      if (!gj) {
        toast({
          title: "Ficheiro inválido",
          description: "Use GeoJSON (.json/.geojson) ou KML com polígono válido.",
          variant: "destructive",
        });
        return;
      }
      setPolygon(gj);
      toast({
        title: "Perímetro carregado",
        description: f.name,
      });
    };
    reader.readAsText(f);
  };

  if (!isInitialized || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        A carregar…
      </div>
    );
  }

  return (
    <StudyGeospatialSplitShell
      title="Mapas"
      mapPane={<StudyAreaMap polygon={polygon} onPolygonChange={setPolygon} />}
      sidebar={
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perímetro</CardTitle>
              <CardDescription>
                Desenhe o polígono da propriedade, importe GeoJSON ou KML e exporte
                mapas técnicos (MCA / uso e ocupação).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="map-title">Título do mapa</Label>
                <Input
                  id="map-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="osm"
                  checked={fetchOsm}
                  onCheckedChange={(v) => setFetchOsm(Boolean(v))}
                />
                <Label htmlFor="osm">Incluir contexto OSM (vias, edifícios)</Label>
              </div>
              <div className="space-y-1">
                <Label>CRS de saída</Label>
                <Select value={targetCrs} onValueChange={setTargetCrs}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EPSG:31983">
                      EPSG:31983 (UTM 23S / SIRGAS 2000)
                    </SelectItem>
                    <SelectItem value="EPSG:4326">EPSG:4326 (WGS84)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="gj">Importar GeoJSON ou KML</Label>
                <Input
                  id="gj"
                  type="file"
                  accept=".geojson,.json,.kml,.xml,application/geo+json"
                  onChange={(e) => onImportFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={runExport} disabled={busy}>
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileArchive className="mr-2 h-4 w-4" />
                  )}
                  Exportar (ZIP, DXF, GPKG)
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={runStacPreview}
                  disabled={stacBusy}
                >
                  {stacBusy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Satellite className="mr-2 h-4 w-4" />
                  )}
                  STAC Sentinel-2
                </Button>
              </div>
            </CardContent>
          </Card>

          {stacItems.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cenas Sentinel-2 (STAC)</CardTitle>
                <CardDescription>
                  Pré-visualização pública Planetary Computer (sem chave).
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-56 space-y-2 overflow-y-auto text-xs">
                {stacItems.map((it) => (
                  <div
                    key={it.id}
                    className="rounded border border-border p-2 space-y-1"
                  >
                    <div className="font-medium">{it.datetime ?? "—"}</div>
                    <div className="text-muted-foreground">
                      Nuvem: {it.cloudCover ?? "—"}%
                    </div>
                    {it.thumbnailHref ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.thumbnailHref}
                        alt=""
                        className="mt-1 max-h-24 w-full rounded object-cover"
                      />
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimos jobs</CardTitle>
              <CardDescription>Links expiram em cerca de 1 hora.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadJobs()}
              >
                Atualizar lista
              </Button>
              <div className="max-h-64 space-y-3 overflow-y-auto text-sm">
              {jobs.length === 0 ? (
                <p className="text-muted-foreground">Nenhum job ainda.</p>
              ) : (
                jobs.map((j) => (
                  <div key={j.jobId} className="rounded border border-border p-2">
                    <div className="font-medium">{j.projectTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      {j.status} · {j.createdAt ?? ""}
                    </div>
                    {j.artifactUrls ? (
                      <ul className="mt-2 list-inside list-disc text-xs">
                        {Object.entries(j.artifactUrls).map(([name, url]) => (
                          <li key={name}>
                            <a
                              className="text-primary underline"
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              )}
              </div>
            </CardContent>
          </Card>
        </>
      }
    />
  );
}
