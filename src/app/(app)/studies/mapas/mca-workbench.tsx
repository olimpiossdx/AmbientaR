"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { StudyGeospatialSplitShell } from "@/components/studies/study-geospatial-split-shell";
import { MapasLegacyExport } from "./mapas-legacy-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebase, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { StudyAreaGeoJSON } from "@/components/maps/study-area-map";
import type { Feature, FeatureCollection } from "geojson";
import { MCA_ETAPA_COUNT, MCA_ETAPA_LABELS } from "@/lib/mca/etapas";
import type { McaEtapaStatus, McaProjectDoc } from "@/lib/mca/types";
import {
  Loader2,
  Play,
  Bug,
  FileDown,
  Plus,
  CheckCircle2,
  Circle,
  Map,
  Pencil,
  Package,
  ClipboardCheck,
  RefreshCw,
} from "lucide-react";
import { parseStudyAreaFileText } from "@/lib/study-maps/import-area-file";
import { MCA_GOLD_PRESETS, type McaGoldPresetId } from "@/lib/mca/gold-presets";
import { fetchGoldPerimeter } from "@/lib/mca/gold-perimeters";
import area from "@turf/area";

const McaUnifiedMap = dynamic(
  () =>
    import("@/components/maps/mca-unified-map").then((m) => ({
      default: m.McaUnifiedMap,
    })),
  { ssr: false },
);

type ProjectRow = McaProjectDoc & { id: string };

export function McaWorkbench() {
  const { auth } = useFirebase();
  const { user, isInitialized } = useAuth();
  const { toast } = useToast();
  const [polygon, setPolygon] = React.useState<StudyAreaGeoJSON | null>(null);
  const [projects, setProjects] = React.useState<ProjectRow[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [health, setHealth] = React.useState<string>("—");
  const [lastRuns, setLastRuns] = React.useState<
    { agentId: string; status: string; message?: string }[]
  >([]);
  const [projectLayers, setProjectLayers] = React.useState<
    Record<string, FeatureCollection | null>
  >({});
  const [mapMode, setMapMode] = React.useState<"edit" | "preview">("edit");
  const [debugAgentId, setDebugAgentId] = React.useState("MCA_Ingest_Perimeter");
  const [agentOptions, setAgentOptions] = React.useState<string[]>([]);
  const [reviews, setReviews] = React.useState<
    {
      id: string;
      title: string;
      detail?: string;
      status: string;
      kind: string;
      layerKey?: string;
    }[]
  >([]);
  const [exportReady, setExportReady] = React.useState(true);

  const [form, setForm] = React.useState({
    title: "Fazenda — MCA",
    propertyName: "",
    ownerName: "",
    matriculas: "",
    car: "",
    areaTotalHa: "",
    scale: "1:12.000",
  });

  const bearer = React.useCallback(async () => {
    const u = auth?.currentUser;
    if (!u) throw new Error("Sessão inválida.");
    return u.getIdToken();
  }, [auth]);

  const loadProjects = React.useCallback(async () => {
    if (!auth?.currentUser) return;
    try {
      const token = await bearer();
      const res = await fetch("/api/mca/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProjects(data.projects ?? []);
    } catch (e) {
      console.error(e);
    }
  }, [auth, bearer]);

  const loadHealth = React.useCallback(async () => {
    try {
      const res = await fetch("/api/mca/health");
      const data = await res.json();
      const ogr = data.ogr2ogr ? "ogr2ogr ✓" : "ogr2ogr ✗";
      const worker = data.cadWorker ? "worker ✓" : "worker ✗";
      const reg = data.behaviorRegistry ?? 0;
      setHealth(`MCA v${data.version ?? 1} · ${data.agents ?? 0} agentes · registry ${reg} · ${ogr} · ${worker}`);
    } catch {
      setHealth("MCA indisponível");
    }
  }, []);

  const loadAgents = React.useCallback(async () => {
    try {
      const res = await fetch("/api/mca/agents");
      const data = await res.json();
      if (res.ok && Array.isArray(data.agents)) {
        setAgentOptions((data.agents as { id: string }[]).map((a) => a.id));
      }
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (isInitialized && user) {
      void loadProjects();
      void loadHealth();
      void loadAgents();
    }
  }, [isInitialized, user, loadProjects, loadHealth, loadAgents]);

  const activeProject = projects.find((p) => p.id === activeId);

  const loadReviews = React.useCallback(
    async (projectId: string) => {
      if (!auth?.currentUser) return;
      try {
        const token = await bearer();
        const res = await fetch(`/api/mca/projects/${projectId}/reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setReviews(data.reviews ?? []);
        setExportReady(data.exportReady ?? true);
      } catch (e) {
        console.error(e);
        setReviews([]);
        setExportReady(true);
      }
    },
    [auth, bearer],
  );

  const loadProjectDetail = React.useCallback(
    async (projectId: string) => {
      if (!auth?.currentUser) return;
      try {
        const token = await bearer();
        const res = await fetch(`/api/mca/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const layers = (data.layers ?? {}) as Record<string, FeatureCollection | null>;
        setProjectLayers(layers);
        if (data.project?.perimeterGeoJson) {
          setPolygon(data.project.perimeterGeoJson as unknown as StudyAreaGeoJSON);
        }
        if (Object.keys(layers).some((k) => k.startsWith("USO_") || k.startsWith("HYD_"))) {
          setMapMode("preview");
        }
      } catch (e) {
        console.error(e);
      }
    },
    [auth, bearer],
  );

  React.useEffect(() => {
    if (activeId) {
      void loadProjectDetail(activeId);
      void loadReviews(activeId);
    } else {
      setProjectLayers({});
      setReviews([]);
      setExportReady(true);
    }
  }, [activeId, loadProjectDetail, loadReviews]);

  const buildProjectPayload = React.useCallback(() => {
    const matriculas = form.matriculas
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      title: form.title,
      perimeterGeoJson: polygon ?? undefined,
      meta: {
        propertyName: form.propertyName || form.title,
        ownerName: form.ownerName,
        municipality: "Unaí-MG",
        matriculas,
        car: form.car,
        areaTotalHa: form.areaTotalHa ? Number(form.areaTotalHa.replace(",", ".")) : undefined,
        scale: form.scale,
        crs: "EPSG:31983",
        technicalResponsible: "Elaine de Sales Fernandes",
        crea: "CREA-MG 144.093/D",
      },
    };
  }, [form, polygon]);

  const createProject = async (): Promise<string | null> => {
    setBusy(true);
    try {
      const token = await bearer();
      const res = await fetch("/api/mca/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildProjectPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Projeto MCA criado" });
      setActiveId(data.projectId);
      await loadProjects();
      return data.projectId as string;
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: e instanceof Error ? e.message : "Falha",
      });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const fluxoGoldCompleto = async (id: McaGoldPresetId) => {
    const p = MCA_GOLD_PRESETS.find((x) => x.id === id);
    if (!p) return;
    const perim = await fetchGoldPerimeter(id);
    if (!perim.features.length) {
      toast({ title: "Sem perímetro", variant: "destructive" });
      return;
    }
    setForm({
      title: p.title,
      propertyName: p.propertyName,
      ownerName: p.ownerName,
      matriculas: p.matriculas.join(", "),
      car: p.car,
      areaTotalHa: p.areaTotalHa,
      scale: p.scale,
    });
    setPolygon(perim as unknown as StudyAreaGeoJSON);
    setBusy(true);
    try {
      const token = await bearer();
      const matriculas = p.matriculas;
      const preset = p;
      const createRes = await fetch("/api/mca/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: preset.title,
          perimeterGeoJson: perim,
          meta: {
            propertyName: preset.propertyName,
            ownerName: preset.ownerName,
            municipality: preset.municipality,
            matriculas,
            car: preset.car,
            areaTotalHa: Number(preset.areaTotalHa.replace(",", ".")),
            scale: preset.scale,
            crs: "EPSG:31983",
            goldPresetId: id,
          },
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error);
      const projectId = created.projectId as string;
      setActiveId(projectId);
      await importDemoLayers({ projectId, silent: true });
      const runRes = await fetch(`/api/mca/projects/${projectId}/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ maxEtapa: 15 }),
      });
      const runData = await runRes.json();
      if (!runRes.ok) throw new Error(runData.error);
      setLastRuns(runData.runs ?? []);
      setMapMode("preview");
      await loadProjects();
      await loadProjectDetail(projectId);
      toast({
        title: "Fluxo ouro concluído",
        description: `${preset.label} · nota ${runData.scores?.final?.toFixed(1) ?? "—"}`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Fluxo ouro",
        description: e instanceof Error ? e.message : "Falha",
      });
    } finally {
      setBusy(false);
    }
  };

  const savePerimeter = async () => {
    if (!activeId || !polygon) return;
    setBusy(true);
    try {
      const token = await bearer();
      const res = await fetch(`/api/mca/projects/${activeId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ perimeterGeoJson: polygon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Perímetro guardado" });
      await loadProjects();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: e instanceof Error ? e.message : "Falha",
      });
    } finally {
      setBusy(false);
    }
  };

  const runPipeline = async (
    maxEtapa = 15,
    opts?: { minEtapa?: number; label?: string; changedLayerKeys?: string[] },
  ) => {
    if (!activeId) {
      toast({ title: "Seleccione ou crie um projeto.", variant: "destructive" });
      return;
    }
    setBusy(true);
    setLastRuns([]);
    try {
      const token = await bearer();
      const res = await fetch(`/api/mca/projects/${activeId}/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxEtapa,
          minEtapa: opts?.minEtapa,
          changedLayerKeys: opts?.changedLayerKeys,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLastRuns(data.runs ?? []);
      const min = opts?.minEtapa ?? 1;
      const range =
        min > 1
          ? `E${String(min).padStart(2, "0")}–E${String(maxEtapa).padStart(2, "0")}`
          : `E01–E${String(maxEtapa).padStart(2, "0")}`;
      toast({
        title: opts?.label ? `Pipeline ${range}` : "Pipeline MCA concluído",
        description: `Job ${data.jobId} · nota ${data.scores?.final?.toFixed(1) ?? "—"}`,
      });
      await loadProjects();
      if (activeId) {
        await loadProjectDetail(activeId);
        await loadReviews(activeId);
      }
      setMapMode("preview");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Pipeline",
        description: e instanceof Error ? e.message : "Falha",
      });
    } finally {
      setBusy(false);
    }
  };

  const rerunFromInvalidated = async () => {
    const keys = activeProject?.meta?.invalidatedLayerKeys;
    if (!activeId || !keys?.length) {
      toast({ title: "Nada invalidado", description: "Importe layers ou altere upstream primeiro." });
      return;
    }
    await runPipeline(15, { changedLayerKeys: keys, label: "Re-run downstream" });
  };

  const updateReview = async (reviewId: string, status: "approved" | "promoted" | "rejected") => {
    if (!activeId) return;
    setBusy(true);
    try {
      const token = await bearer();
      const res = await fetch(`/api/mca/projects/${activeId}/reviews`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExportReady(data.exportReady ?? false);
      await loadReviews(activeId);
      toast({
        title: "Revisão actualizada",
        description: data.exportReady ? "Export legal liberado." : "Ainda há itens pendentes.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Revisão",
        description: e instanceof Error ? e.message : "Erro",
      });
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async (preview = false) => {
    if (!activeId) return;
    setBusy(true);
    try {
      const token = await bearer();
      let body: { mapImageDataUrl?: string } | undefined;
      try {
        const { mcaLayersToPreviewSvg } = await import("@/lib/mca/map-preview-svg");
        const { svgStringToPngDataUrl } = await import("@/lib/geospatial/render-minimap-client");
        let perimFc: FeatureCollection | null = null;
        if (polygon?.type === "FeatureCollection") {
          perimFc = polygon as unknown as FeatureCollection;
        } else if (polygon?.type === "Feature") {
          perimFc = {
            type: "FeatureCollection",
            features: [polygon as unknown as Feature],
          };
        }
        const layersClean: Record<string, FeatureCollection> = {};
        for (const [k, v] of Object.entries(projectLayers)) {
          if (v?.features?.length) layersClean[k] = v;
        }
        const svg = mcaLayersToPreviewSvg(perimFc, layersClean, 800, 560);
        if (svg) {
          body = { mapImageDataUrl: await svgStringToPngDataUrl(svg, 800, 560) };
        }
      } catch {
        /* servidor desenha vetor a partir do Firestore */
      }

      const res = await fetch(
        `/api/mca/projects/${activeId}/pdf${preview ? "?preview=1" : ""}`,
        {
          method: body ? "POST" : "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          body: body ? JSON.stringify({ ...body, preview }) : undefined,
        },
      );
      if (res.status === 428 && !preview) {
        const err = await res.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Revisão pendente",
          description:
            (err as { error?: string }).error ??
            "Aprove camadas críticas na aba Revisão ou use PDF preview.",
        });
        return;
      }
      if (!res.ok) throw new Error("PDF falhou");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mca-${activeId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "PDF gerado",
        description: body?.mapImageDataUrl
          ? "Com miniatura do mapa (layers visíveis)."
          : "Com mapa vetorial das layers guardadas.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "PDF",
        description: e instanceof Error ? e.message : "Erro",
      });
    } finally {
      setBusy(false);
    }
  };

  const uploadDwg = async (file: File | null) => {
    if (!file || !activeId) return;
    setBusy(true);
    try {
      const token = await bearer();
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/mca/projects/${activeId}/upload-dwg`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "DWG guardado", description: data.fileName });
      await loadProjects();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Upload DWG",
        description: e instanceof Error ? e.message : "Erro",
      });
    } finally {
      setBusy(false);
    }
  };

  const convertDwg = async () => {
    if (!activeId) return;
    setBusy(true);
    try {
      const token = await bearer();
      const res = await fetch(`/api/mca/projects/${activeId}/convert-dwg`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.hint ?? "Conversão falhou");
      toast({
        title: "DWG convertido",
        description: data.message ?? `${data.imported} layer(s)`,
      });
      await loadProjects();
      await loadProjectDetail(activeId);
      setMapMode("preview");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Extrair DWG",
        description: e instanceof Error ? e.message : "Erro",
      });
    } finally {
      setBusy(false);
    }
  };

  const importLayers = async (file: File | null) => {
    if (!file || !activeId) return;
    setBusy(true);
    try {
      const token = await bearer();
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/mca/projects/${activeId}/import-layers`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({
        title: "Layers importadas",
        description: `${data.imported} layer(s): ${(data.layerKeys as string[])?.slice(0, 4).join(", ")}`,
      });
      await loadProjects();
      await loadProjectDetail(activeId);
      setMapMode("preview");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Import layers",
        description: e instanceof Error ? e.message : "Erro",
      });
    } finally {
      setBusy(false);
    }
  };

  const importDemoLayers = async (opts?: { projectId?: string; silent?: boolean }) => {
    const id = opts?.projectId ?? activeId;
    if (!id) {
      toast({ variant: "destructive", title: "E06", description: "Seleccione um projeto." });
      return false;
    }
    if (!opts?.silent) setBusy(true);
    try {
      const token = await bearer();
      const exampleRes = await fetch("/mca/examples/layers-import-exemplo.json", {
        cache: "no-store",
      });
      if (!exampleRes.ok) throw new Error("Exemplo E06 não encontrado.");
      const example = await exampleRes.json();
      const res = await fetch(`/api/mca/projects/${id}/import-layers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(example),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!opts?.silent) {
        toast({
          title: "Layers demo (E06)",
          description: `${data.imported} layer(s): ${(data.layerKeys as string[])?.slice(0, 4).join(", ")}`,
        });
      }
      await loadProjects();
      await loadProjectDetail(id);
      setMapMode("preview");
      return true;
    } catch (e) {
      if (!opts?.silent) {
        toast({
          variant: "destructive",
          title: "Import demo E06",
          description: e instanceof Error ? e.message : "Erro",
        });
      }
      return false;
    } finally {
      if (!opts?.silent) setBusy(false);
    }
  };

  const exportLayers = async () => {
    if (!activeId) return;
    try {
      const token = await bearer();
      const res = await fetch(`/api/mca/projects/${activeId}/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export falhou");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mca-${activeId}-layers.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Layers exportadas (JSON)" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Export",
        description: e instanceof Error ? e.message : "Erro",
      });
    }
  };

  const downloadLayoutJson = async () => {
    if (!activeId) return;
    try {
      const token = await bearer();
      const res = await fetch(`/api/mca/projects/${activeId}/layout-json`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const blob = new Blob([JSON.stringify(data.layoutJson, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mca-${activeId}-layout.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Layout JSON (E12 v2)",
        description: `${data.layoutJson?.layerOrder?.length ?? 0} layers no contrato`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Layout JSON",
        description: e instanceof Error ? e.message : "Erro",
      });
    }
  };

  const debugAgent = async () => {
    if (!activeId || !debugAgentId.trim()) {
      toast({ variant: "destructive", title: "Debugger", description: "Seleccione projeto e agentId." });
      return;
    }
    setBusy(true);
    try {
      const token = await bearer();
      const res = await fetch("/api/mca/debug/agent", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentId: debugAgentId.trim(), projectId: activeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({
        title: `Agente ${debugAgentId}`,
        description: data.result?.message ?? data.result?.status ?? "OK",
        variant: data.result?.status === "error" ? "destructive" : "default",
      });
      await loadProjectDetail(activeId);
      setMapMode("preview");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Agente isolado",
        description: e instanceof Error ? e.message : "Erro",
      });
    } finally {
      setBusy(false);
    }
  };

  const debugEtapa = async (n: number) => {
    try {
      const token = await bearer();
      const q = activeId ? `?projectId=${activeId}` : "";
      const res = await fetch(`/api/mca/debug/etapa/${n}${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      toast({
        title: `Debugger E${String(n).padStart(2, "0")}`,
        description: data.pass
          ? "PASS"
          : (data.checks as { id: string; detail: string }[])
              ?.map((c) => `${c.id}: ${c.detail}`)
              .join(" · ") ?? "FAIL",
        variant: data.pass ? "default" : "destructive",
      });
      if (data.pass && activeId) {
        await loadProjects();
        await loadProjectDetail(activeId);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Debug", description: String(e) });
    }
  };

  const applyGoldPreset = async (id: McaGoldPresetId, withPerimeter = true) => {
    const p = MCA_GOLD_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setForm({
      title: p.title,
      propertyName: p.propertyName,
      ownerName: p.ownerName,
      matriculas: p.matriculas.join(", "),
      car: p.car,
      areaTotalHa: p.areaTotalHa,
      scale: p.scale,
    });
    if (withPerimeter) {
      setBusy(true);
      try {
        const fc = await fetchGoldPerimeter(id);
        setPolygon(fc as unknown as StudyAreaGeoJSON);
        setMapMode("edit");
        const ha = area(fc) / 10_000;
        toast({
          title: "Preset mapa ouro",
          description: `${p.label} · perímetro ~${ha.toFixed(0)} ha`,
        });
      } finally {
        setBusy(false);
      }
    } else {
      toast({ title: "Preset mapa ouro", description: p.label });
    }
  };

  const onImportFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const gj = parseStudyAreaFileText(String(reader.result || ""), f.name);
      if (!gj) {
        toast({ title: "Ficheiro inválido", variant: "destructive" });
        return;
      }
      setPolygon(gj);
      toast({ title: "Perímetro importado", description: f.name });
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
      title="MCA — Motor Cartográfico"
      description={health}
      mapPane={
        <div className="relative h-full w-full">
          <div className="absolute top-2 right-2 z-[1000] flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={mapMode === "edit" ? "default" : "secondary"}
              onClick={() => setMapMode("edit")}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mapMode === "preview" ? "default" : "secondary"}
              disabled={!activeId}
              onClick={() => setMapMode("preview")}
            >
              <Map className="h-3 w-3 mr-1" />
              Layers
            </Button>
          </div>
          <McaUnifiedMap
            mode={mapMode === "preview" && activeId ? "preview" : "edit"}
            perimeter={polygon}
            layers={projectLayers}
            onPolygonChange={setPolygon}
          />
        </div>
      }
      sidebar={
        <Tabs defaultValue="projeto" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projeto">Projeto</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="revisao">Revisão</TabsTrigger>
            <TabsTrigger value="debug">Debugger</TabsTrigger>
          </TabsList>

          <TabsContent value="projeto" className="space-y-4 mt-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Novo projeto</CardTitle>
                <CardDescription>Padrão Pimenta Consultoria · Uso e Ocupação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Mapas ouro (Pimenta)</Label>
                  <div className="flex flex-wrap gap-1">
                    {MCA_GOLD_PRESETS.map((p) => (
                      <Button
                        key={p.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => void applyGoldPreset(p.id)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-8 w-full text-xs"
                    disabled={busy}
                    onClick={() => void fluxoGoldCompleto("gold_catingueiro")}
                  >
                    Fluxo completo Catingueiro (criar + pipeline + mapa)
                  </Button>
                </div>
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  autoComplete="off"
                />
                <Label>Propriedade</Label>
                <Input
                  value={form.propertyName}
                  onChange={(e) => setForm((f) => ({ ...f, propertyName: e.target.value }))}
                  placeholder="Ex.: Faz. Catingueiro, Desbarrancado e Barro Branco"
                  autoComplete="organization"
                  spellCheck
                />
                <Label>Proprietário</Label>
                <Input
                  value={form.ownerName}
                  onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                />
                <Label>Matrículas (vírgula ou linha)</Label>
                <Textarea
                  value={form.matriculas}
                  onChange={(e) => setForm((f) => ({ ...f, matriculas: e.target.value }))}
                  rows={2}
                />
                <Label>CAR</Label>
                <Input
                  value={form.car}
                  onChange={(e) => setForm((f) => ({ ...f, car: e.target.value }))}
                />
                <Label>Área total (ha)</Label>
                <Input
                  value={form.areaTotalHa}
                  onChange={(e) => setForm((f) => ({ ...f, areaTotalHa: e.target.value }))}
                />
                <Label>Importar KML / GeoJSON (perímetro)</Label>
                <Input
                  type="file"
                  accept=".geojson,.json,.kml"
                  onChange={(e) => onImportFile(e.target.files?.[0] ?? null)}
                />
                <Label>DWG / DXF (E06)</Label>
                <Input
                  type="file"
                  accept=".dwg,.dxf,.zip"
                  disabled={!activeId || busy}
                  onChange={(e) => void uploadDwg(e.target.files?.[0] ?? null)}
                />
                <Label>GeoJSON layers CAD (E06)</Label>
                <Input
                  type="file"
                  accept=".json,.geojson"
                  disabled={!activeId || busy}
                  onChange={(e) => void importLayers(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!activeId || busy}
                  onClick={() => void importDemoLayers()}
                >
                  Importar layers demo (E06)
                </Button>
                {activeProject?.dwgGcsPath ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground truncate">
                      DWG: {activeProject.meta.dwgFileName ?? "guardado"}
                      {activeProject.meta.dwgConvertedAt
                        ? ` · convertido ${new Date(activeProject.meta.dwgConvertedAt).toLocaleString("pt-BR")}`
                        : ""}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy || !activeId}
                      onClick={() => void convertDwg()}
                    >
                      Extrair layers DWG (ogr2ogr)
                    </Button>
                  </div>
                ) : null}
                {activeProject?.meta.importedLayerKeys?.length ? (
                  <p className="text-xs text-muted-foreground">
                    Import: {activeProject.meta.importedLayerKeys.join(", ")}
                  </p>
                ) : null}
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" onClick={createProject} disabled={busy}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={savePerimeter}
                    disabled={busy || !activeId}
                  >
                    Guardar perímetro
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Projetos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum projeto.</p>
                ) : (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`w-full text-left rounded border p-2 text-sm ${
                        activeId === p.id ? "border-primary bg-muted" : "border-border"
                      }`}
                      onClick={() => {
                        setActiveId(p.id);
                        setMapMode("edit");
                      }}
                    >
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Etapa {p.currentEtapa ?? 4} · nota {p.scores?.final?.toFixed(1) ?? "—"}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <MapasLegacyExport polygon={polygon} onPolygonChange={setPolygon} />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4 mt-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Executar MCA</CardTitle>
                <CardDescription>
                  {activeProject
                    ? `${activeProject.title} — pipeline MCA`
                    : "Seleccione um projeto"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  type="button"
                  className="w-full"
                  disabled={busy || !activeId}
                  onClick={() => void runPipeline(15)}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Pipeline completo (E01–E15)
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy || !activeId}
                    onClick={() => void runPipeline(10, { minEtapa: 5, label: "Geo" })}
                  >
                    E05–E10
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy || !activeId}
                    onClick={() => void runPipeline(15, { minEtapa: 11, label: "Release" })}
                  >
                    E11–E15
                  </Button>
                </div>
                {activeProject?.meta.invalidatedLayerKeys?.length ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={busy || !activeId}
                    onClick={() => void rerunFromInvalidated()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-run downstream ({activeProject.meta.invalidatedLayerKeys.length} stale)
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!activeId}
                  onClick={() => void downloadPdf(false)}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF técnico (E13)
                  {!exportReady && reviews.length > 0 ? " · bloqueado" : ""}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs"
                  disabled={!activeId}
                  onClick={() => void downloadPdf(true)}
                >
                  PDF preview (sem gate revisão)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!activeId}
                  onClick={() => void downloadLayoutJson()}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Layout JSON (E12 v2)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!activeId}
                  onClick={() => void exportLayers()}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Export JSON layers (E15)
                </Button>
                {Object.keys(projectLayers).length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(projectLayers).length} layers no mapa (modo Layers)
                  </p>
                ) : null}
                {activeProject?.tables?.uso?.length ? (
                  <div className="text-xs border rounded p-2 max-h-32 overflow-y-auto">
                    <p className="font-medium mb-1">Uso e ocupação</p>
                    {activeProject.tables.uso.map((r, i) => (
                      <div key={i}>
                        {r.classe}: {r.areaHa.toFixed(4)} ha
                      </div>
                    ))}
                  </div>
                ) : null}
                {activeProject?.tables?.app?.length ? (
                  <div className="text-xs border rounded p-2">
                    <p className="font-medium mb-1">APP</p>
                    {activeProject.tables.app.map((r, i) => (
                      <div key={i}>
                        {r.classe}: {r.areaHa.toFixed(4)} ha
                      </div>
                    ))}
                  </div>
                ) : null}
                {activeProject?.tables?.rl?.length ? (
                  <div className="text-xs border rounded p-2 max-h-32 overflow-y-auto">
                    <p className="font-medium mb-1">Reserva legal</p>
                    {activeProject.tables.rl.map((r, i) => (
                      <div key={i}>
                        {r.matricula} gleba {r.gleba}: {r.areaHa.toFixed(4)} ha
                        {r.compensada ? " (compensada)" : ""}
                      </div>
                    ))}
                  </div>
                ) : null}
                {activeProject?.scores?.final != null ? (
                  <div className="text-xs border rounded p-2 space-y-0.5">
                    <p className="font-medium">
                      Score MCA: {activeProject.scores.final.toFixed(1)}
                    </p>
                    <p className="text-muted-foreground">
                      geom {activeProject.scores.geometric?.toFixed(0) ?? "—"} · topo{" "}
                      {activeProject.scores.topological?.toFixed(0) ?? "—"} · amb{" "}
                      {activeProject.scores.environmental?.toFixed(0) ?? "—"} · vis{" "}
                      {activeProject.scores.visual?.toFixed(0) ?? "—"} · sem{" "}
                      {activeProject.scores.semantic?.toFixed(0) ?? "—"}
                    </p>
                  </div>
                ) : null}
                {lastRuns.length > 0 ? (
                  <div className="text-xs max-h-40 overflow-y-auto space-y-1">
                    {lastRuns.map((r) => (
                      <div key={r.agentId} className="flex justify-between gap-1">
                        <span className="truncate">{r.agentId}</span>
                        <Badge variant={r.status === "pass" ? "default" : "secondary"}>
                          {r.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revisao" className="space-y-4 mt-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Fila de revisão (v2)
                </CardTitle>
                <CardDescription>
                  Camadas críticas e conflitos — gate antes do PDF legal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span>Export legal</span>
                  <Badge variant={exportReady ? "default" : "secondary"}>
                    {exportReady ? "liberado" : "bloqueado"}
                  </Badge>
                </div>
                {!activeId ? (
                  <p className="text-sm text-muted-foreground">Seleccione um projeto.</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sem itens — corra o pipeline para gerar revisões automáticas.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {reviews.map((r) => (
                      <div key={r.id} className="border rounded p-2 text-xs space-y-1">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">{r.title}</span>
                          <Badge variant={r.status === "pending" ? "secondary" : "default"}>
                            {r.status}
                          </Badge>
                        </div>
                        {r.detail ? (
                          <p className="text-muted-foreground">{r.detail}</p>
                        ) : null}
                        {r.status === "pending" || r.status === "in_review" ? (
                          <div className="flex gap-1 flex-wrap pt-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs"
                              disabled={busy}
                              onClick={() => void updateReview(r.id, "approved")}
                            >
                              Aprovar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={busy}
                              onClick={() => void updateReview(r.id, "promoted")}
                            >
                              Promover
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={busy}
                              onClick={() => void updateReview(r.id, "rejected")}
                            >
                              Rejeitar
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={!activeId || busy}
                  onClick={() => activeId && void loadReviews(activeId)}
                >
                  Actualizar fila
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debug" className="space-y-4 mt-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agente isolado</CardTitle>
                <CardDescription>
                  Executa um agente no projeto activo (útil para E06–E10)
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap items-center">
                <Input
                  className="flex-1 min-w-[200px]"
                  list="mca-agent-ids"
                  value={debugAgentId}
                  onChange={(e) => setDebugAgentId(e.target.value)}
                  placeholder="MCA_Ingest_Perimeter"
                />
                <datalist id="mca-agent-ids">
                  {agentOptions.map((id) => (
                    <option key={id} value={id} />
                  ))}
                </datalist>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy || !activeId}
                  onClick={() => void debugAgent()}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Correr
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">15 etapas</CardTitle>
                <CardDescription>Gate PASS antes de avançar (recomendado)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 max-h-64 overflow-y-auto">
                {Array.from({ length: MCA_ETAPA_COUNT }, (_, i) => i + 1).map((n) => {
                  const key = String(n).padStart(2, "0");
                  const st: McaEtapaStatus =
                    activeProject?.etapaStatus?.[key] ?? (n <= 4 ? "active" : "locked");
                  return (
                    <div
                      key={n}
                      className="flex items-center justify-between text-xs py-1 border-b border-border/50"
                    >
                      <span className="flex items-center gap-1">
                        {st === "pass" ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground" />
                        )}
                        E{key} — {MCA_ETAPA_LABELS[n]}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => void debugEtapa(n)}
                      >
                        <Bug className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      }
    />
  );
}
