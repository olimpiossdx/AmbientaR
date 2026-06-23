"use client";

/**
 * Exportação rápida legada (study-maps) — mantida para não quebrar fluxos existentes.
 */
import * as React from "react";
import dynamic from "next/dynamic";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useFirebase, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { parseUnifiedApiResponse } from "@/lib/api-response";
import type { StudyAreaGeoJSON } from "@/components/maps/study-area-map";
import type { StacPreviewItem } from "@/lib/study-maps/types";
import { Loader2, Satellite, FileArchive, ChevronDown } from "lucide-react";
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

type MapasLegacyExportProps = {
  polygon: StudyAreaGeoJSON | null;
  onPolygonChange: (g: StudyAreaGeoJSON | null) => void;
};

export function MapasLegacyExport({ polygon, onPolygonChange }: MapasLegacyExportProps) {
  const { auth } = useFirebase();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
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
    }
  }, [auth, bearer]);

  React.useEffect(() => {
    if (open) void loadJobs();
  }, [open, loadJobs]);

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
      const parsed = await parseUnifiedApiResponse<{
        jobId?: string;
        artifactUrls?: Record<string, string>;
      }>(res);
      if (!parsed.ok) {
        const jobHint =
          parsed.raw &&
          typeof parsed.raw === "object" &&
          "jobId" in (parsed.raw as object)
            ? ` (job ${String((parsed.raw as { jobId?: string }).jobId)})`
            : "";
        throw new Error(`${parsed.message}${jobHint}`);
      }
      toast({
        title: "Exportação concluída",
        description: `Job ${parsed.data.jobId ?? "—"}`,
      });
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

  const runStacPreview = async () => {
    if (!polygon) return;
    setStacBusy(true);
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

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Exportação rápida (legado)</CardTitle>
              <CardDescription>ZIP / DXF / GPKG — API study-maps original</CardDescription>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-1">
              <Label htmlFor="legacy-title">Título</Label>
              <Input
                id="legacy-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="legacy-osm"
                checked={fetchOsm}
                onCheckedChange={(v) => setFetchOsm(Boolean(v))}
              />
              <Label htmlFor="legacy-osm">Contexto OSM</Label>
            </div>
            <Select value={targetCrs} onValueChange={setTargetCrs}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EPSG:31983">EPSG:31983</SelectItem>
                <SelectItem value="EPSG:4326">EPSG:4326</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={runExport} disabled={busy} size="sm">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileArchive className="mr-2 h-4 w-4" />}
                Exportar
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={runStacPreview} disabled={stacBusy}>
                {stacBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Satellite className="h-4 w-4" />}
              </Button>
            </div>
            {stacItems.length > 0 ? (
              <p className="text-xs text-muted-foreground">{stacItems.length} cena(s) STAC</p>
            ) : null}
            {jobs.length > 0 ? (
              <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
                {jobs.slice(0, 5).map((j) => (
                  <li key={j.jobId}>
                    {j.projectTitle} — {j.status}
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export { StudyAreaMap };
