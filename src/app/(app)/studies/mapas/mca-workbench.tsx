"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { StudyGeospatialStackedShell } from "@/components/studies/study-geospatial-stacked-shell";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFirebase, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { StudyAreaGeoJSON } from "@/components/maps/study-area-map";
import type { Feature, FeatureCollection } from "geojson";
import { MCA_ETAPA_COUNT, MCA_ETAPA_LABELS } from "@/lib/mca/etapas";
import type { McaEtapaStatus, McaProjectDoc } from "@/lib/mca/types";
import type { McaProjectListItem } from "@/lib/mca/project-list-item";
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
  Upload,
  MapPin,
  XCircle,
  AlertCircle,
  Rocket,
  ImageIcon,
} from "lucide-react";
import { parseStudyAreaFileText } from "@/lib/study-maps/import-area-file";
import { MCA_GOLD_PRESETS, type McaGoldPresetId } from "@/lib/mca/gold-presets";
import { fetchGoldPerimeter } from "@/lib/mca/gold-perimeters-fetch";
import { validateMcaPerimeter } from "@/lib/mca/perimeter-validation";

const McaPerimeterDrawMap = dynamic(
  () =>
    import("@/components/maps/mca-perimeter-draw-map").then((m) => ({
      default: m.McaPerimeterDrawMap,
    })),
  { ssr: false },
);

const McaUnifiedMap = dynamic(
  () =>
    import("@/components/maps/mca-unified-map").then((m) => ({
      default: m.McaUnifiedMap,
    })),
  { ssr: false },
);

type McaPerimeterInputMode = "draw" | "car" | "coordinates" | "paste" | "kml_file" | "shp";

type ProjectRow = McaProjectListItem;
type McaLayerManifestRow = { id: string; featureCount: number };

const MCA_PDF_SATELLITE_PREF_KEY = "mca-pdf-include-satellite";

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
  const [layerManifest, setLayerManifest] = React.useState<McaLayerManifestRow[]>([]);
  const [visibleMapLayers, setVisibleMapLayers] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [loadingMapLayerId, setLoadingMapLayerId] = React.useState<string | null>(
    null,
  );
  const [activeProject, setActiveProject] = React.useState<
    (McaProjectDoc & { id: string }) | null
  >(null);
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
  const [polygonPaste, setPolygonPaste] = React.useState("");
  const [coordinateHint, setCoordinateHint] = React.useState("");
  const [perimeterInputMode, setPerimeterInputMode] =
    React.useState<McaPerimeterInputMode>("draw");
  const [coordinateInput, setCoordinateInput] = React.useState("");
  const [shpZipBase64, setShpZipBase64] = React.useState("");
  const [shpFileName, setShpFileName] = React.useState("");
  const [carInput, setCarInput] = React.useState("");
  const [isConsultingCar, setIsConsultingCar] = React.useState(false);
  const [isParsingPerimeter, setIsParsingPerimeter] = React.useState(false);
  const [useDemoLayersForE15, setUseDemoLayersForE15] = React.useState(true);
  const [includeSatelliteInPdf, setIncludeSatelliteInPdf] = React.useState(true);
  const [releaseInfo, setReleaseInfo] = React.useState<{
    qgisWorker: boolean;
    exportReady: boolean;
    releaseEtapa: boolean;
  } | null>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(MCA_PDF_SATELLITE_PREF_KEY);
      if (stored === "0") setIncludeSatelliteInPdf(false);
    } catch {
      /* ignore */
    }
  }, []);

  const setSatellitePdfPreference = React.useCallback((enabled: boolean) => {
    setIncludeSatelliteInPdf(enabled);
    try {
      localStorage.setItem(MCA_PDF_SATELLITE_PREF_KEY, enabled ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const captureMapForPdfExport = React.useCallback(async () => {
    const { buildMcaPdfMapImageFromState } = await import("@/lib/mca/build-pdf-map-image-client");
    if (includeSatelliteInPdf) {
      toast({
        title: "A compor mapa…",
        description: "Satélite Esri + layers (pode levar alguns segundos).",
      });
    }
    return buildMcaPdfMapImageFromState({
      polygon,
      projectLayers,
      preferSatellite: includeSatelliteInPdf,
    });
  }, [polygon, projectLayers, includeSatelliteInPdf, toast]);

  const buildMapImageExportPayload = React.useCallback(async (): Promise<{
    body: { mapImageDataUrl?: string; includeSatellite?: boolean };
    clientMode: string | undefined;
  }> => {
    if (!includeSatelliteInPdf) {
      return { body: {}, clientMode: undefined };
    }
    try {
      const cap = await captureMapForPdfExport();
      if (cap?.mode === "satellite" && cap.dataUrl) {
        return { body: { mapImageDataUrl: cap.dataUrl }, clientMode: cap.mode as string };
      }
    } catch {
      /* servidor Esri */
    }
    return { body: { includeSatellite: true }, clientMode: undefined };
  }, [captureMapForPdfExport, includeSatelliteInPdf]);

  const mapModeDescription = (
    clientMode: string | undefined,
    serverMode: string | null,
  ): string => {
    if (clientMode === "satellite") return "Com basemap satélite Esri + layers (browser).";
    if (serverMode === "satellite-server") return "Com basemap satélite Esri (servidor) + moldura jsPDF.";
    if (clientMode === "vector") return "Com miniatura vetorial das layers.";
    return "Com mapa vetorial das layers guardadas.";
  };

  const renderPdfSatelliteOption = (idSuffix: string) => (
    <div className="flex items-start gap-2 rounded-md border px-3 py-2">
      <Checkbox
        id={`mca-pdf-satellite-${idSuffix}`}
        className="mt-0.5"
        checked={includeSatelliteInPdf}
        onCheckedChange={(v) => setSatellitePdfPreference(v === true)}
      />
      <div className="space-y-0.5">
        <Label
          htmlFor={`mca-pdf-satellite-${idSuffix}`}
          className="text-xs font-normal cursor-pointer leading-snug"
        >
          Incluir basemap satélite Esri no PDF (E13 / E15)
        </Label>
        <p className="text-[11px] text-muted-foreground leading-snug">
          Browser compõe satélite + layers; se falhar, a API busca Esri no servidor (grade UTM no jsPDF).
        </p>
      </div>
    </div>
  );

  const [form, setForm] = React.useState({
    title: "Fazenda — MCA",
    propertyName: "",
    ownerName: "",
    matriculas: "",
    car: "",
    areaTotalHa: "",
    scale: "1:12.000",
  });

  const turfAreaRef = React.useRef<((geo: never) => number) | null>(null);
  const [turfAreaReady, setTurfAreaReady] = React.useState(false);
  React.useEffect(() => {
    void import("@turf/area").then((m) => {
      turfAreaRef.current = m.default;
      setTurfAreaReady(true);
    });
  }, []);
  const computeAreaHa = (geo: unknown): number | null => {
    const fn = turfAreaRef.current;
    if (!fn) return null;
    try {
      return fn(geo as never) / 10_000;
    } catch {
      return null;
    }
  };

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
      const qgis = data.qgisWorkerOk ? "QGIS ✓" : data.qgisWorkerUrl ? "QGIS ✗" : "QGIS —";
      const pg = data.postgis ? "PostGIS ✓" : "PostGIS —";
      setHealth(
        `MCA v${data.version ?? 1} · ${data.agents ?? 0} agentes · ${qgis} · ${pg} · ${ogr}`,
      );
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

  const fillFormFromProject = React.useCallback((project: McaProjectDoc & { title: string }) => {
    const m = project.meta ?? {};
    setForm({
      title: project.title ?? "Fazenda — MCA",
      propertyName: m.propertyName ?? "",
      ownerName: m.ownerName ?? "",
      matriculas: (m.matriculas ?? []).join(", "),
      car: m.car ?? "",
      areaTotalHa: m.areaTotalHa != null ? String(m.areaTotalHa) : "",
      scale: m.scale ?? "1:12.000",
    });
    setCarInput(m.car ?? "");
  }, []);

  const polygonAreaHa = React.useMemo(() => {
    if (!polygon) return null;
    return computeAreaHa(polygon);
  }, [polygon, turfAreaReady]);

  const declaredAreaHa = React.useMemo(() => {
    const raw = form.areaTotalHa.trim().replace(",", ".");
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [form.areaTotalHa]);

  const perimeterValidation = React.useMemo(
    () =>
      validateMcaPerimeter(
        (polygon ?? undefined) as FeatureCollection | Feature | undefined,
        {
          areaTotalHa: declaredAreaHa,
          car: form.car,
          crs: "EPSG:31983",
          projectPerimeterGeoJson: activeProject?.perimeterGeoJson,
          editorGeoJson: polygon,
        },
      ),
    [polygon, declaredAreaHa, form.car, activeProject?.perimeterGeoJson],
  );

  const scrollToPerimeterCapture = () => {
    document.getElementById("mca-perimeter-capture")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const loadReleaseInfo = React.useCallback(
    async (projectId: string) => {
      try {
        const token = await bearer();
        const res = await fetch(`/api/mca/projects/${projectId}/export-final`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setReleaseInfo({
            qgisWorker: Boolean(data.qgisWorker),
            exportReady: Boolean(data.exportReady),
            releaseEtapa: Boolean(data.releaseEtapa),
          });
          setExportReady(data.exportReady ?? true);
        }
      } catch {
        setReleaseInfo(null);
      }
    },
    [bearer],
  );

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

  const loadMcaLayerGeojson = React.useCallback(
    async (projectId: string, layerKey: string) => {
      if (!auth?.currentUser) return;
      try {
        const token = await bearer();
        const res = await fetch(
          `/api/mca/projects/${projectId}/layers/${encodeURIComponent(layerKey)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.geojson) {
          setProjectLayers((prev) => ({
            ...prev,
            [layerKey]: data.geojson as FeatureCollection,
          }));
        }
      } catch (e) {
        console.error(e);
      }
    },
    [auth, bearer],
  );

  const loadProjectDetail = React.useCallback(
    async (projectId: string) => {
      if (!auth?.currentUser) return;
      try {
        const token = await bearer();
        const res = await fetch(
          `/api/mca/projects/${projectId}?layers=manifest`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const manifest = (data.layerManifest ?? []) as McaLayerManifestRow[];
        setLayerManifest(manifest);
        setProjectLayers({});
        if (data.project) {
          const project = data.project as McaProjectDoc & { title: string };
          setActiveProject({ id: projectId, ...project });
          fillFormFromProject(project);
        }
        if (data.project?.perimeterGeoJson) {
          setPolygon(data.project.perimeterGeoJson as unknown as StudyAreaGeoJSON);
        }
        const defaultVisible = manifest
          .filter(
            (m) =>
              m.featureCount > 0 &&
              (m.id.startsWith("USO_") || m.id.startsWith("HYD_")),
          )
          .slice(0, 4)
          .map((m) => m.id);
        setVisibleMapLayers(new Set(defaultVisible));
        await Promise.all(
          defaultVisible.map((layerKey) => loadMcaLayerGeojson(projectId, layerKey)),
        );
        if (defaultVisible.length > 0) {
          setMapMode("preview");
        }
      } catch (e) {
        console.error(e);
      }
    },
    [auth, bearer, fillFormFromProject, loadMcaLayerGeojson],
  );

  const toggleMapLayer = React.useCallback(
    (layerKey: string, enabled: boolean) => {
      setVisibleMapLayers((prev) => {
        const next = new Set(prev);
        if (enabled) next.add(layerKey);
        else next.delete(layerKey);
        return next;
      });
      if (enabled && activeId) {
        setLoadingMapLayerId(layerKey);
        void loadMcaLayerGeojson(activeId, layerKey).finally(() =>
          setLoadingMapLayerId(null),
        );
      }
    },
    [activeId, loadMcaLayerGeojson],
  );

  React.useEffect(() => {
    if (activeId) {
      void loadProjectDetail(activeId);
      void loadReviews(activeId);
      void loadReleaseInfo(activeId);
    } else {
      setActiveProject(null);
      setProjectLayers({});
      setLayerManifest([]);
      setVisibleMapLayers(new Set());
      setReviews([]);
      setReleaseInfo(null);
      setExportReady(true);
    }
  }, [activeId, loadProjectDetail, loadReviews, loadReleaseInfo]);

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
        matriculas: matriculas.length ? matriculas : ["M-única"],
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
    if (!polygon) {
      toast({
        variant: "destructive",
        title: "Perímetro obrigatório",
        description: "Desenhe ou importe o limite da propriedade no mapa de captura acima.",
      });
      scrollToPerimeterCapture();
      return null;
    }
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
    setCarInput(p.car);
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
      await importDemoLayers({ projectId, presetId: id, silent: true });
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
        description: `${preset.label} · ${String(perim.features[0]?.properties?.source ?? "perímetro")} · nota ${runData.scores?.final?.toFixed(1) ?? "—"}`,
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

  const runGoldVisualChecklist = async (presetId: McaGoldPresetId = "gold_catingueiro") => {
    setBusy(true);
    try {
      const token = await bearer();
      const res = await fetch("/api/mca/gold/visual-verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ presetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const checks = (data.checks ?? []) as Array<{
        id: string;
        pass: boolean;
        manual?: boolean;
        detail: string;
      }>;
      const auto = checks.filter((c) => !c.manual);
      const failed = auto.filter((c) => !c.pass);
      toast({
        title: data.autoPass ? "Checklist visual ouro — PASS" : "Checklist visual ouro — FAIL",
        description:
          failed.length > 0
            ? `${failed.length} falha(s): ${failed.map((c) => c.id).join(", ")}`
            : `${auto.length} checks automáticos · PDF ${data.pdfBytes ?? "—"} B · ${checks.filter((c) => c.manual).length} item(ns) manual`,
        variant: data.autoPass ? "default" : "destructive",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Checklist visual ouro",
        description: e instanceof Error ? e.message : "Falha",
      });
    } finally {
      setBusy(false);
    }
  };

  const saveProjectMeta = async () => {
    if (!activeId) {
      toast({ title: "Seleccione ou crie um projeto.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const token = await bearer();
      const matriculas = form.matriculas
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const computedAreaHa = polygon ? computeAreaHa(polygon) ?? undefined : undefined;
      const res = await fetch(`/api/mca/projects/${activeId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          meta: {
            propertyName: form.propertyName || form.title,
            ownerName: form.ownerName,
            matriculas,
            car: form.car,
            areaTotalHa: form.areaTotalHa
              ? Number(form.areaTotalHa.replace(",", "."))
              : computedAreaHa,
            scale: form.scale,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Dados do projeto guardados" });
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
    if (!perimeterValidation.ok) {
      const failed = perimeterValidation.checks.filter(
        (c) => c.severity === "error" && !c.pass,
      );
      toast({
        variant: "destructive",
        title: "Perímetro inválido (E05)",
        description: failed.map((c) => c.label).join(" · ") || "Corrija o limite antes do pipeline",
      });
      document.getElementById("mca-perimeter-validation")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }
    const warnUnsaved = perimeterValidation.checks.find(
      (c) => c.id === "saved_on_project" && !c.pass,
    );
    if (warnUnsaved) {
      toast({
        title: "Perímetro não guardado",
        description: warnUnsaved.detail,
      });
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

  const advanceToEtapa15 = async (importDemoIfNeeded = useDemoLayersForE15) => {
    if (!activeId) {
      toast({ title: "Seleccione ou crie um projeto.", variant: "destructive" });
      return;
    }
    if (!perimeterValidation.ok) {
      toast({
        variant: "destructive",
        title: "E05 incompleto",
        description: "Corrija o perímetro antes de avançar até E15.",
      });
      scrollToPerimeterCapture();
      return;
    }
    const warnUnsaved = perimeterValidation.checks.find(
      (c) => c.id === "saved_on_project" && !c.pass,
    );
    if (warnUnsaved) {
      await savePerimeter();
    }
    setBusy(true);
    try {
      const token = await bearer();
      const res = await fetch(`/api/mca/projects/${activeId}/advance-to-e15`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ importDemoIfNeeded }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLastRuns([]);
      await loadProjects();
      await loadProjectDetail(activeId);
      await loadReviews(activeId);
      await loadReleaseInfo(activeId);
      setMapMode("preview");
      toast({
        title: data.allPass ? "E15 — release concluído" : "Pipeline executado",
        description: data.allPass
          ? `Nota ${data.scores?.final?.toFixed(1) ?? "—"} · job ${String(data.jobId).slice(0, 8)}`
          : `Parou na etapa E${String(data.currentEtapa).padStart(2, "0")} — veja validação`,
        variant: data.allPass ? "default" : "destructive",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Avançar até E15",
        description: e instanceof Error ? e.message : "Falha",
      });
    } finally {
      setBusy(false);
    }
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
      const { body: mapBody, clientMode } = await buildMapImageExportPayload();
      const usePost = Boolean(mapBody.mapImageDataUrl || mapBody.includeSatellite);

      const res = await fetch(
        `/api/mca/projects/${activeId}/pdf${preview ? "?preview=1" : ""}`,
        {
          method: usePost ? "POST" : "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(usePost ? { "Content-Type": "application/json" } : {}),
          },
          body: usePost
            ? JSON.stringify({ ...mapBody, preview })
            : undefined,
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
        description: mapModeDescription(clientMode, res.headers.get("X-MCA-Map-Mode")),
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

  const downloadMapPreviewImage = async () => {
    if (!activeId) return;
    setBusy(true);
    try {
      const cap = await captureMapForPdfExport();
      if (!cap) {
        toast({
          variant: "destructive",
          title: "Preview do mapa",
          description: "Desenhe o perímetro ou execute o pipeline para gerar layers.",
        });
        return;
      }
      const ext = cap.mode === "satellite" ? "jpg" : "png";
      const a = document.createElement("a");
      a.href = cap.dataUrl;
      a.download = `mca-${activeId}-mapa.${ext}`;
      a.click();
      toast({
        title: "Imagem do mapa",
        description:
          cap.mode === "satellite"
            ? "JPEG satélite Esri + layers."
            : "PNG vetorial das layers.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Preview do mapa",
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

  const importGoldLayersForPreset = async (opts: {
    projectId: string;
    presetId: McaGoldPresetId;
    silent?: boolean;
  }) => {
    const goldRes = await fetch(`/mca/gold/${opts.presetId}/layers-import.json`, {
      cache: "no-store",
    });
    if (goldRes.ok) return goldRes.json();
    const exampleRes = await fetch("/mca/examples/layers-import-exemplo.json", {
      cache: "no-store",
    });
    if (!exampleRes.ok) throw new Error("Layers ouro e exemplo E06 indisponíveis.");
    return exampleRes.json();
  };

  const importDemoLayers = async (opts?: {
    projectId?: string;
    silent?: boolean;
    presetId?: McaGoldPresetId;
  }) => {
    const id = opts?.projectId ?? activeId;
    if (!id) {
      toast({ variant: "destructive", title: "E06", description: "Seleccione um projeto." });
      return false;
    }
    if (!opts?.silent) setBusy(true);
    try {
      const token = await bearer();
      let payload: unknown;
      if (opts?.presetId) {
        payload = await importGoldLayersForPreset({
          projectId: id,
          presetId: opts.presetId,
          silent: opts.silent,
        });
      } else {
        const exampleRes = await fetch("/mca/examples/layers-import-exemplo.json", {
          cache: "no-store",
        });
        if (!exampleRes.ok) throw new Error("Exemplo E06 não encontrado.");
        payload = await exampleRes.json();
      }
      const res = await fetch(`/api/mca/projects/${id}/import-layers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!opts?.silent) {
        toast({
          title: opts?.presetId ? "Layers ouro (E06)" : "Layers demo (E06)",
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

  const downloadExportFinal = async (forceJsPdf = false) => {
    if (!activeId) return;
    setBusy(true);
    try {
      const token = await bearer();
      const q = forceJsPdf ? "?fallback=jspdf" : "";
      const { body: mapBody, clientMode } = await buildMapImageExportPayload();

      const res = await fetch(`/api/mca/projects/${activeId}/export-final${q}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mapBody),
      });
      if (res.status === 428) {
        const err = await res.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Revisão pendente",
          description: (err as { error?: string }).error ?? "Aprove na aba Revisão.",
        });
        return;
      }
      if (!res.ok) throw new Error("Export final falhou");
      const blob = await res.blob();
      const renderer = res.headers.get("X-MCA-Renderer") ?? "unknown";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        renderer === "qgis-worker"
          ? `mca-${activeId}-final.pdf`
          : `mca-${activeId}-release.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: renderer === "qgis-worker" ? "PDF final (v3 QGIS)" : "PDF release (E13 jsPDF)",
        description:
          renderer === "qgis-worker"
            ? "Render via worker Layout JSON."
            : mapModeDescription(clientMode, res.headers.get("X-MCA-Map-Mode")),
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "PDF final",
        description: e instanceof Error ? e.message : "Erro",
      });
    } finally {
      setBusy(false);
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

  const releaseEtapaReached = (activeProject?.currentEtapa ?? 0) >= 15;

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
    setCarInput(p.car);
    if (withPerimeter) {
      setBusy(true);
      try {
        const fc = await fetchGoldPerimeter(id);
        setPolygon(fc as unknown as StudyAreaGeoJSON);
        setMapMode("edit");
        const ha = computeAreaHa(fc);
        toast({
          title: "Preset mapa ouro",
          description: ha != null ? `${p.label} · perímetro ~${ha.toFixed(0)} ha` : p.label,
        });
      } finally {
        setBusy(false);
      }
    } else {
      toast({ title: "Preset mapa ouro", description: p.label });
    }
  };

  const applyParsedPerimeter = (
    geojson: StudyAreaGeoJSON,
    meta?: { areaHa?: number; source?: string; label?: string },
  ) => {
    setPolygon(geojson);
    setMapMode("edit");
    const ha = meta?.areaHa ?? computeAreaHa(geojson);
    toast({
      title: meta?.label ?? "Perímetro aplicado",
      description: ha != null ? `${ha.toFixed(2)} ha${meta?.source ? ` · ${meta.source}` : ""}` : undefined,
    });
  };

  const parsePerimeterFromApi = React.useCallback(
    async (
      dataType: "coordinates" | "polygon" | "kml" | "shp" | "car",
      data: string,
      label: string,
    ) => {
      setIsParsingPerimeter(true);
      try {
        const token = await bearer();
        const res = await fetch("/api/study-maps/parse-perimeter", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dataType, data }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          error?: string;
          geojson?: StudyAreaGeoJSON;
          areaHa?: number;
          source?: string;
        };
        if (!res.ok || !json.geojson) {
          throw new Error(json.error || "Falha ao processar perímetro.");
        }
        applyParsedPerimeter(json.geojson, {
          areaHa: json.areaHa,
          source: json.source,
          label,
        });
      } finally {
        setIsParsingPerimeter(false);
      }
    },
    [bearer, toast],
  );

  const handleUseCurrentCoordinates = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocalização indisponível",
        description: "Use o desenho no mapa ou importe KML/GeoJSON.",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinateHint(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setCoordinateInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setPerimeterInputMode("coordinates");
        toast({
          title: "Coordenadas capturadas",
          description:
            "Referência guardada. Desenhe o perímetro no mapa em torno deste ponto.",
        });
      },
      () => {
        toast({
          variant: "destructive",
          title: "Falha na captura",
          description: "Não foi possível obter a posição atual.",
        });
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const handleConfirmDrawnPolygon = () => {
    if (!polygon) {
      toast({
        variant: "destructive",
        title: "Sem polígono",
        description: "Use a ferramenta de polígono no canto superior esquerdo do mapa.",
      });
      return;
    }
    setMapMode("edit");
    const ha = polygonAreaHa;
    toast({
      title: "Perímetro confirmado",
      description: ha != null ? `${ha.toFixed(2)} ha — pronto para criar ou guardar projeto.` : undefined,
    });
  };

  const handleApplyPolygonPaste = async () => {
    const text = polygonPaste.trim();
    if (!text) return;
    const dataType = text.trim().startsWith("<") ? "kml" : "polygon";
    try {
      await parsePerimeterFromApi(dataType, text, "Geometria colada aplicada");
      setPolygonPaste("");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Geometria inválida",
        description: e instanceof Error ? e.message : "Cole GeoJSON (Polygon) ou KML válido.",
      });
    }
  };

  const handleApplyCoordinates = async () => {
    const text = coordinateInput.trim();
    if (!text) {
      toast({
        variant: "destructive",
        title: "Coordenadas em falta",
        description: "Informe lat, lng (ex.: -19.922731, -43.945095).",
      });
      return;
    }
    try {
      await parsePerimeterFromApi(
        "coordinates",
        text,
        "Perímetro gerado (buffer mínimo)",
      );
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Coordenadas inválidas",
        description: e instanceof Error ? e.message : "Verifique o par lat/lng.",
      });
    }
  };

  const handleApplyShp = async () => {
    if (!shpZipBase64) {
      toast({
        variant: "destructive",
        title: "SHP em falta",
        description: "Carregue um ZIP com .shp, .shx e .dbf.",
      });
      return;
    }
    try {
      await parsePerimeterFromApi("shp", shpZipBase64, "Perímetro SHP importado");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro no SHP",
        description: e instanceof Error ? e.message : "ZIP inválido ou incompleto.",
      });
    }
  };

  const handleAssociateCar = () => {
    const car = carInput.trim();
    if (car.length < 4) {
      toast({
        variant: "destructive",
        title: "CAR inválido",
        description: "Informe o recibo CAR completo (MG-…).",
      });
      return;
    }
    setForm((f) => ({ ...f, car }));
    toast({
      title: "CAR associado ao projeto",
      description:
        "Use «Consultar SICAR» para obter situação cadastral ou importe SHP/KML para a geometria.",
    });
  };

  const applyCarGeometryToMap = (geojson: StudyAreaGeoJSON) => {
    setPolygon(geojson);
    setMapMode("edit");
    toast({
      title: "Perímetro CAR aplicado ao mapa",
      description: "Geometria obtida do WFS público do SICAR.",
    });
  };

  const handleConsultCar = async (mode: "codImovel" | "geometry") => {
    setIsConsultingCar(true);
    try {
      if (mode === "codImovel") {
        const cod = carInput.trim();
        if (cod.length < 8) {
          toast({
            variant: "destructive",
            title: "CAR inválido",
            description: "Informe o recibo CAR completo (MG-…).",
          });
          return;
        }
        await parsePerimeterFromApi("car", cod, "Perímetro CAR (SICAR WFS)");
        setForm((f) => ({ ...f, car: cod }));
        toast({
          title: "Consulta SICAR",
          description: "Geometria obtida via WFS público (módulo Mapas / study-maps).",
        });
        return;
      }

      const token = await bearer();
      const body = polygon
        ? {
            dataType: "polygon" as const,
            data: JSON.stringify(polygon),
          }
        : null;

      if (!body) {
        toast({
          variant: "destructive",
          title: "Sem geometria",
          description: "Desenhe ou importe um perímetro antes de consultar por área.",
        });
        return;
      }

      const res = await fetch("/api/geospatial/car", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        success?: boolean;
        resumo?: string;
        error?: string;
        imoveis?: Array<{
          codImovel: string;
          situacao: string;
          areaHa: number;
          municipio: string;
          uf: string;
          geometry?: Feature;
        }>;
      };

      if (!res.ok || !json.imoveis?.length) {
        throw new Error(json.error || json.resumo || "CAR não encontrado no SICAR.");
      }

      const first = json.imoveis[0];
      if (mode === "geometry") {
        setForm((f) => ({ ...f, car: first.codImovel }));
        setCarInput(first.codImovel);
      }

      toast({
        title: "Consulta SICAR",
        description: json.resumo ?? `${first.codImovel} · ${first.situacao}`,
      });

      if (
        json.imoveis.length === 1 &&
        json.imoveis[0].geometry?.geometry &&
        (json.imoveis[0].geometry.geometry.type === "Polygon" ||
          json.imoveis[0].geometry.geometry.type === "MultiPolygon")
      ) {
        applyCarGeometryToMap(json.imoveis[0].geometry as unknown as StudyAreaGeoJSON);
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro na consulta SICAR",
        description: e instanceof Error ? e.message : "Serviço indisponível.",
      });
    } finally {
      setIsConsultingCar(false);
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
      setMapMode("edit");
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
    <StudyGeospatialStackedShell
      title="MCA — Motor Cartográfico"
      description={`${health} · Desenhe o perímetro no mapa abaixo antes de criar o projeto.`}
      mapPane={
        <Card id="mca-perimeter-capture" className="flex w-full flex-col overflow-hidden">
          <CardHeader className="shrink-0 space-y-1 pb-3">
            <CardTitle>Captura do perímetro</CardTitle>
            <CardDescription>
              Desenhe no mapa, importe SHP/KML/GeoJSON, informe coordenadas ou associe o
              número CAR ao projeto. Fluxo exclusivo do submenu Mapas (MCA).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="mca-perimeter-mode">Origem do perímetro</Label>
                <Select
                  value={perimeterInputMode}
                  onValueChange={(v) => setPerimeterInputMode(v as McaPerimeterInputMode)}
                >
                  <SelectTrigger id="mca-perimeter-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draw">Desenho no mapa</SelectItem>
                    <SelectItem value="car">Número CAR (metadado)</SelectItem>
                    <SelectItem value="coordinates">Coordenadas (lat, lng)</SelectItem>
                    <SelectItem value="paste">Colar GeoJSON / WKT / KML</SelectItem>
                    <SelectItem value="kml_file">Ficheiro KML / GeoJSON</SelectItem>
                    <SelectItem value="shp">Shapefile ZIP (.shp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {perimeterInputMode === "car" ? (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="mca-car">Recibo CAR</Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id="mca-car"
                      className="min-w-[200px] flex-1"
                      placeholder="Ex.: MG-3106200-1234.ABCD…"
                      value={carInput}
                      onChange={(e) => setCarInput(e.target.value)}
                    />
                    <Button type="button" variant="secondary" onClick={handleAssociateCar}>
                      Associar CAR
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isConsultingCar || carInput.trim().length < 8}
                      onClick={() => void handleConsultCar("codImovel")}
                    >
                      {isConsultingCar ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Consultar SICAR
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A consulta usa o WFS público do SICAR (situação, área, município). Se a
                    geometria estiver disponível, ela será aplicada ao mapa. Também pode importar
                    SHP/KML do{" "}
                    <a
                      href="https://www.car.gov.br/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      SICAR
                    </a>{" "}
                    (SHP/KML).
                  </p>
                </div>
              ) : null}
              {perimeterInputMode === "coordinates" ? (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="mca-coords">Coordenadas (lat, lng)</Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id="mca-coords"
                      className="min-w-[200px] flex-1 font-mono text-sm"
                      placeholder="-19.922731, -43.945095"
                      value={coordinateInput}
                      onChange={(e) => setCoordinateInput(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isParsingPerimeter}
                      onClick={() => void handleApplyCoordinates()}
                    >
                      {isParsingPerimeter ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Aplicar coordenadas"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gera um buffer mínimo (~80 m). Para limite real da propriedade, prefira
                    desenho ou SHP.
                  </p>
                </div>
              ) : null}
            </div>
            <div className="relative min-h-[680px] w-full md:min-h-[760px] lg:min-h-[820px]">
              <div className="absolute inset-0 overflow-hidden rounded-md border">
                <McaPerimeterDrawMap polygon={polygon} onPolygonChange={setPolygon} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleUseCurrentCoordinates}>
                Capturar coordenada atual
              </Button>
              <Button type="button" variant="outline" onClick={handleConfirmDrawnPolygon}>
                Confirmar polígono desenhado
              </Button>
            </div>
            {coordinateHint ? (
              <p className="text-xs text-muted-foreground">
                Referência GPS:{" "}
                <span className="font-mono">{coordinateHint}</span> (desenhe o limite no mapa)
              </p>
            ) : null}
            {polygonAreaHa != null ? (
              <p className="text-sm font-medium text-primary">
                Área do perímetro: {polygonAreaHa.toFixed(2)} ha
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhum perímetro definido — desenhe ou importe para activar Criar / Guardar.
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {perimeterInputMode === "kml_file" ? (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mca-perimeter-file">Importar KML / GeoJSON</Label>
                  <Input
                    id="mca-perimeter-file"
                    type="file"
                    accept=".geojson,.json,.kml,.xml,application/geo+json"
                    onChange={(e) => onImportFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              ) : null}
              {perimeterInputMode === "shp" ? (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mca-shp-upload">Shapefile ZIP (.shp + .shx + .dbf)</Label>
                  <Input
                    id="mca-shp-upload"
                    type="file"
                    accept=".zip,application/zip"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 8 * 1024 * 1024) {
                        toast({
                          variant: "destructive",
                          title: "Arquivo grande demais",
                          description: "Use um ZIP até 8 MB.",
                        });
                        return;
                      }
                      const buf = await file.arrayBuffer();
                      const bytes = new Uint8Array(buf);
                      let binary = "";
                      for (let i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]!);
                      }
                      setShpZipBase64(btoa(binary));
                      setShpFileName(file.name);
                    }}
                  />
                  {shpFileName ? (
                    <p className="text-xs text-muted-foreground">
                      Carregado: {shpFileName}. Clique em aplicar para ler o polígono.
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!shpZipBase64 || isParsingPerimeter}
                    onClick={() => void handleApplyShp()}
                  >
                    {isParsingPerimeter ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Aplicar SHP
                  </Button>
                </div>
              ) : null}
              {perimeterInputMode === "paste" ? (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="mca-perimeter-paste">Colar GeoJSON, WKT ou KML</Label>
                  <Textarea
                    id="mca-perimeter-paste"
                    value={polygonPaste}
                    onChange={(e) => setPolygonPaste(e.target.value)}
                    placeholder='{"type":"Polygon","coordinates":[...]} ou POLYGON((...))'
                    className="min-h-[72px] font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!polygonPaste.trim() || isParsingPerimeter}
                    onClick={() => void handleApplyPolygonPaste()}
                  >
                    {isParsingPerimeter ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Aplicar geometria colada
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      }
      controlsPane={
        <Tabs defaultValue="projeto" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projeto">Projeto</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="revisao">Revisão</TabsTrigger>
            <TabsTrigger value="debug">Debugger</TabsTrigger>
          </TabsList>

          <TabsContent value="projeto" className="space-y-4 mt-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Perímetro e importação rápida</CardTitle>
                <CardDescription>
                  Estado actual do limite da propriedade. Pode importar aqui sem mudar o modo no
                  mapa acima.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {polygonAreaHa != null ? (
                  <p className="text-sm font-medium text-primary">
                    Área calculada: {polygonAreaHa.toFixed(2)} ha
                    {activeId ? " · projecto activo" : " · ainda não guardado"}
                  </p>
                ) : (
                  <p className="text-sm text-destructive">
                    Nenhum perímetro — desenhe no mapa ou importe abaixo.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={scrollToPerimeterCapture}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Ir ao mapa de captura
                  </Button>
                  {polygon ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isConsultingCar}
                      onClick={() => void handleConsultCar("geometry")}
                    >
                      {isConsultingCar ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      CARs no perímetro
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4 inline" />
                      KML / GeoJSON
                      <input
                        type="file"
                        className="sr-only"
                        accept=".geojson,.json,.kml,.xml,application/geo+json"
                        onChange={(e) => {
                          onImportFile(e.target.files?.[0] ?? null);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4 inline" />
                      SHP (.zip)
                      <input
                        type="file"
                        className="sr-only"
                        accept=".zip,application/zip"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          if (file.size > 8 * 1024 * 1024) {
                            toast({
                              variant: "destructive",
                              title: "Arquivo grande demais",
                              description: "Use um ZIP até 8 MB.",
                            });
                            return;
                          }
                          const buf = await file.arrayBuffer();
                          const bytes = new Uint8Array(buf);
                          let binary = "";
                          for (let i = 0; i < bytes.length; i++) {
                            binary += String.fromCharCode(bytes[i]!);
                          }
                          setShpZipBase64(btoa(binary));
                          setShpFileName(file.name);
                          try {
                            await parsePerimeterFromApi(
                              "shp",
                              btoa(binary),
                              "Perímetro SHP importado",
                            );
                          } catch (err) {
                            toast({
                              variant: "destructive",
                              title: "Erro no SHP",
                              description:
                                err instanceof Error ? err.message : "ZIP inválido.",
                            });
                          }
                        }}
                      />
                    </label>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy || !activeId || !polygon}
                    onClick={() => void savePerimeter()}
                  >
                    Guardar perímetro no projecto
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-full text-xs"
                    disabled={busy}
                    onClick={() => void runGoldVisualChecklist("gold_catingueiro")}
                  >
                    Checklist visual ouro (v4 offline)
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, car: v }));
                    setCarInput(v);
                  }}
                />
                <Label>Área total (ha)</Label>
                <Input
                  value={form.areaTotalHa}
                  onChange={(e) => setForm((f) => ({ ...f, areaTotalHa: e.target.value }))}
                  placeholder={polygonAreaHa != null ? polygonAreaHa.toFixed(2) : ""}
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
                  <Button type="button" onClick={() => void createProject()} disabled={busy || !polygon}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void saveProjectMeta()}
                    disabled={busy || !activeId}
                  >
                    Guardar dados
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void savePerimeter()}
                    disabled={busy || !activeId || !polygon}
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
                        Etapa {p.currentEtapa ?? 4}
                        {p.meta.propertyName ? ` · ${p.meta.propertyName}` : ""}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <MapasLegacyExport polygon={polygon} onPolygonChange={setPolygon} />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4 mt-3">
            <Card id="mca-perimeter-validation">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Validação E05 — perímetro</CardTitle>
                  <Badge variant={perimeterValidation.ok ? "default" : "destructive"}>
                    {perimeterValidation.ok ? "Pronto" : "Bloqueado"}
                  </Badge>
                </div>
                <CardDescription>
                  {perimeterValidation.areaHa > 0
                    ? `${perimeterValidation.areaHa.toFixed(2)} ha · EPSG:31983`
                    : "Desenhe ou importe o limite no mapa"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-1.5 text-sm">
                  {perimeterValidation.checks.map((c) => (
                    <li key={c.id} className="flex items-start gap-2">
                      {c.pass ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      ) : c.severity === "error" ? (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      )}
                      <span>
                        <span className="font-medium">{c.label}</span>
                        <span className="text-muted-foreground"> — {c.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {!perimeterValidation.ok ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={scrollToPerimeterCapture}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Ir ao mapa / importar perímetro
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            {releaseEtapaReached ? (
              <Card className="border-green-600/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">E15 — Release</CardTitle>
                    <Badge variant="default">Concluído</Badge>
                  </div>
                  <CardDescription>
                    Nota {activeProject?.scores?.final?.toFixed(1) ?? "—"} ·{" "}
                    {releaseInfo?.qgisWorker ? "QGIS worker disponível" : "PDF via jsPDF (fallback)"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant={exportReady ? "default" : "secondary"}>
                      Export {exportReady ? "liberado" : "aguarda revisão"}
                    </Badge>
                    {activeProject?.lastJobId ? (
                      <span>Job {activeProject.lastJobId.slice(0, 8)}…</span>
                    ) : null}
                  </div>
                  {!releaseInfo?.qgisWorker ? (
                    <p className="text-[11px] text-muted-foreground rounded-md border px-2 py-1.5 leading-snug">
                      Worker QGIS offline — PDF release usa jsPDF. Local:{" "}
                      <code className="text-[10px]">infra/mca-qgis-worker</code> →{" "}
                      <code className="text-[10px]">docker compose up</code> +{" "}
                      <code className="text-[10px]">MCA_QGIS_WORKER_URL=http://localhost:8091</code>
                    </p>
                  ) : null}
                  {renderPdfSatelliteOption("e15")}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!activeId || busy}
                    onClick={() => void downloadMapPreviewImage()}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Descarregar preview do mapa (PNG/JPEG)
                  </Button>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={!activeId || busy || (!exportReady && reviews.length > 0)}
                    onClick={() => void downloadExportFinal()}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    PDF release (QGIS ou jsPDF)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!activeId || busy}
                    onClick={() => void downloadExportFinal(true)}
                  >
                    PDF técnico jsPDF (E13)
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-xs"
                    disabled={!activeId}
                    onClick={() => void exportLayers()}
                  >
                    Export JSON layers (CAD)
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Executar MCA</CardTitle>
                <CardDescription>
                  {activeProject
                    ? `${activeProject.title} · E${String(activeProject.currentEtapa ?? 4).padStart(2, "0")}`
                    : "Seleccione um projeto"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <Checkbox
                    id="mca-use-demo-layers"
                    checked={useDemoLayersForE15}
                    onCheckedChange={(v) => setUseDemoLayersForE15(v === true)}
                  />
                  <Label htmlFor="mca-use-demo-layers" className="text-xs font-normal cursor-pointer">
                    Importar layers demo (E06) se o projecto não tiver CAD/import
                  </Label>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={busy || !activeId || !perimeterValidation.ok}
                  onClick={() => void advanceToEtapa15(useDemoLayersForE15)}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="mr-2 h-4 w-4" />
                  )}
                  Concluir até E15 (CAD + release)
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={busy || !activeId || !perimeterValidation.ok}
                  onClick={() => void advanceToEtapa15(false)}
                >
                  E15 só geometria sintética (sem demo)
                </Button>
                <p className="text-xs text-muted-foreground px-1">
                  Executa pipeline E05–E15 e actualiza os gates. Com demo: layers de exemplo
                  Pimenta; sem demo: só síntese Turf (uso/hidro/APP/RL/infra).
                </p>
                <Button
                  type="button"
                  className="w-full"
                  disabled={busy || !activeId || !perimeterValidation.ok}
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
                    disabled={busy || !activeId || !perimeterValidation.ok}
                    onClick={() => void runPipeline(10, { minEtapa: 5, label: "Geo" })}
                  >
                    E05–E10
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy || !activeId || !perimeterValidation.ok}
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
                    disabled={busy || !activeId || !perimeterValidation.ok}
                    onClick={() => void rerunFromInvalidated()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-run downstream ({activeProject.meta.invalidatedLayerKeys.length} stale)
                  </Button>
                ) : null}
                {renderPdfSatelliteOption("exec")}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!activeId || busy}
                  onClick={() => void downloadMapPreviewImage()}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Descarregar preview do mapa (PNG/JPEG)
                </Button>
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
                  variant="default"
                  className="w-full"
                  disabled={!activeId || busy}
                  onClick={() => void downloadExportFinal()}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF final QGIS (v3)
                  {!exportReady && reviews.length > 0 ? " · bloqueado" : ""}
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
                    activeProject?.etapaStatus?.[key] ??
                    (n <= 4 ? "pass" : n === 5 ? "active" : "locked");
                  const isCurrent = activeProject?.currentEtapa === n;
                  return (
                    <div
                      key={n}
                      className={`flex items-center justify-between text-xs py-1 border-b border-border/50 ${isCurrent ? "bg-muted/40 rounded px-1" : ""}`}
                    >
                      <span className="flex items-center gap-1">
                        {st === "pass" ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : st === "fail" ? (
                          <XCircle className="h-3 w-3 text-destructive" />
                        ) : st === "active" ? (
                          <Circle className="h-3 w-3 text-primary fill-primary/20" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground" />
                        )}
                        E{key} — {MCA_ETAPA_LABELS[n]}
                        {isCurrent ? (
                          <Badge variant="outline" className="h-4 px-1 text-[10px] ml-1">
                            actual
                          </Badge>
                        ) : null}
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
      footerPane={
        activeId ? (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Visualização MCA (layers)</CardTitle>
                <CardDescription>
                  Camadas geradas pelo pipeline do projeto activo. O desenho do perímetro
                  permanece no mapa acima.
                </CardDescription>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant={mapMode === "edit" ? "default" : "secondary"}
                  onClick={() => setMapMode("edit")}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Perímetro
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mapMode === "preview" ? "default" : "secondary"}
                  onClick={() => setMapMode("preview")}
                >
                  <Map className="h-3 w-3 mr-1" />
                  Layers
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mapMode === "preview" ? (
                <div className="space-y-2">
                  {layerManifest.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto text-xs">
                      {layerManifest.map((row) => {
                        const on = visibleMapLayers.has(row.id);
                        return (
                          <label
                            key={row.id}
                            className="inline-flex items-center gap-1 rounded border px-2 py-1 cursor-pointer"
                          >
                            <Checkbox
                              checked={on}
                              onCheckedChange={(v) =>
                                toggleMapLayer(row.id, v === true)
                              }
                            />
                            <span>
                              {row.id}
                              {row.featureCount > 0
                                ? ` (${row.featureCount})`
                                : ""}
                              {loadingMapLayerId === row.id ? " …" : ""}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : null}
                  <div className="relative min-h-[420px] w-full overflow-hidden rounded-md border">
                    <McaUnifiedMap
                      mode="preview"
                      perimeter={polygon}
                      layers={projectLayers}
                      visibleLayerKeys={visibleMapLayers}
                      onPolygonChange={setPolygon}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Modo perímetro: edite no mapa de captura acima. Clique em{" "}
                  <strong>Layers</strong> para ver as camadas do pipeline MCA.
                </p>
              )}
            </CardContent>
          </Card>
        ) : null
      }
    />
  );
}
