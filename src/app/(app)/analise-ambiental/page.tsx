"use client";

import * as React from "react";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { StudyGeospatialStackedShell } from "@/components/studies/study-geospatial-stacked-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  Globe,
  FileDown,
  Database,
  Share2,
  ChevronDown,
} from "lucide-react";
import type {
  AnaliseAmbientalOutput,
  AnaliseAmbientalInput,
} from "@/lib/types/analise-ambiental";
import { useToast } from "@/hooks/use-toast";
import { useLocalBranding } from "@/hooks/use-local-branding";
import { ESTUDOS_TECNICOS_MENU_LABEL } from "@/lib/navigation-config";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebase, useAuth } from "@/firebase";
import { usePackageUsage } from "@/hooks/use-package-usage";
import { PackageUsageBanner } from "@/components/package-usage-banner";
import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp } from "firebase/firestore";
import type { Project } from "@/lib/types";
import { sortByPropertyNamePt } from "@/lib/sort-pt-br";
import {
  projectHasPerimetroReferencia,
  resolvePerimetroReferenciaFromProject,
} from "@/lib/project-perimetro-referencia";

function formatAnalysisFetchError(error: unknown, kind: "factual" | "ia"): string {
  const msg = error instanceof Error ? error.message : "";
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    if (kind === "factual") {
      return "Sem resposta do servidor (análise factual demora 1–3 min com 37 camadas). Confirme que npm run dev está activo em http://localhost:9002 e tente de novo.";
    }
    return "Sem resposta do servidor. Confirme que npm run dev está activo em http://localhost:9002 e tente de novo.";
  }
  return msg || (kind === "factual"
    ? "Não foi possível consultar as camadas IDE-Sisema."
    : "Ocorreu um erro ao processar os dados.");
}
import { handleAnalyseArea } from "./actions";
import { handleWaveAAnalysis } from "./actions-wave-a";
import type { WaveAAnalysisResult } from "@/lib/types/geo-wave-a";
import type { GeoInfluenceAreaConfig } from "@/lib/types/geo-wave-a";
import { GeoWaveALayerCards } from "@/components/geospatial/geo-wave-a-layer-cards";
import { GeoCavidadesBridge } from "@/components/geospatial/geo-cavidades-bridge";
import {
  GeoInfluenceAreasPanel,
  DEFAULT_INFLUENCE_CONFIG,
  type InfluenceDrawTarget,
} from "@/components/geospatial/geo-influence-areas-panel";
import { WAVE_ALL_LAYER_COUNT } from "@/lib/geospatial/run-wave-a-analysis";
import { buildGeoAnalysisListSummary } from "@/lib/geospatial/geo-analysis-summary";
import { runWaveAAnalysisStreamClient } from "@/lib/geospatial/run-wave-a-stream-client";
import type { GeoLayerResult } from "@/lib/types/geo-wave-a";
import { GeoAnalysisExportPanel } from "@/components/geospatial/geo-analysis-export-panel";
import type { GeoAnalysisComplementOutput } from "@/lib/types/geo-wave-a";
import { GeoAnalysisComplementPanel } from "@/components/geospatial/geo-analysis-complement-panel";
import { AiProviderBadge } from "@/components/ai/ai-provider-badge";
import type { AiProviderId } from "@/lib/ai-provider-labels";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import {
  SESSION_GEO_ANALYSIS_ID,
  isSessionGeoAnalysisId,
} from "@/lib/geospatial/geo-analysis-session";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false });

type InputMode = "car" | "coordinates" | "polygon" | "shp" | "kml";
type GeoJSONLike = {
  type: string;
  [key: string]: unknown;
};

export default function AnaliseAmbientalPage() {
  const { firestore, user, auth } = useFirebase();
  const { user: appUser } = useAuth();
  const packageUsage = usePackageUsage(appUser ?? null);
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();
  const [inputMode, setInputMode] = React.useState<InputMode>("car");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExportingCsv, setIsExportingCsv] = React.useState(false);
  const [isExportingGeojson, setIsExportingGeojson] = React.useState(false);
  const [geoComplement, setGeoComplement] =
    React.useState<GeoAnalysisComplementOutput | null>(null);
  const [legacyAnalysisOpen, setLegacyAnalysisOpen] = React.useState(false);
  const [influenceConfig, setInfluenceConfig] =
    React.useState<GeoInfluenceAreaConfig>(DEFAULT_INFLUENCE_CONFIG);
  const [influenceDrawTarget, setInfluenceDrawTarget] =
    React.useState<InfluenceDrawTarget>("ada");
  const [includeSatelliteBackground, setIncludeSatelliteBackground] =
    React.useState(false);
  const [includeThematicWfs, setIncludeThematicWfs] = React.useState(true);
  const [analysisResult, setAnalysisResult] =
    React.useState<AnaliseAmbientalOutput | null>(null);
  const [analysisProvider, setAnalysisProvider] =
    React.useState<AiProviderId | null>(null);
  const [waveAResult, setWaveAResult] = React.useState<WaveAAnalysisResult | null>(
    null,
  );
  const [savedGeoAnalysisId, setSavedGeoAnalysisId] = React.useState<string | null>(
    null,
  );
  const [isWaveALoading, setIsWaveALoading] = React.useState(false);
  const [waveALayersDone, setWaveALayersDone] = React.useState(0);
  const [waveALayersTotal, setWaveALayersTotal] = React.useState(WAVE_ALL_LAYER_COUNT);
  const [carNumber, setCarNumber] = React.useState("");
  const [sicarPreview, setSicarPreview] = React.useState<string | null>(null);
  const [isConsultingSicar, setIsConsultingSicar] = React.useState(false);
  const [coordinateInput, setCoordinateInput] = React.useState("");
  const [polygonInput, setPolygonInput] = React.useState("");
  const [drawnPolygon, setDrawnPolygon] = React.useState<GeoJSONLike | null>(null);
  const [shpZipBase64, setShpZipBase64] = React.useState("");
  const [shpFileName, setShpFileName] = React.useState("");
  const [kmlText, setKmlText] = React.useState("");
  const [kmlFileName, setKmlFileName] = React.useState("");
  const [empreendimentoId, setEmpreendimentoId] = React.useState("");
  const [linkedProject, setLinkedProject] = React.useState<
    Pick<Project, "id" | "propertyName" | "perimetroReferencia"> | null
  >(null);
  const [loadingLinkedProject, setLoadingLinkedProject] = React.useState(false);
  const [loadingProjectPerimetro, setLoadingProjectPerimetro] = React.useState(false);
  const [lastPayload, setLastPayload] = React.useState("");
  const { toast } = useToast();

  const [projectsSorted, setProjectsSorted] = React.useState<
    Pick<Project, "id" | "propertyName">[]
  >([]);
  const [loadingProjects, setLoadingProjects] = React.useState(false);
  const projectsLoadedRef = React.useRef(false);

  const ensureProjectsLoaded = React.useCallback(async () => {
    if (!firestore || projectsLoadedRef.current) return;
    setLoadingProjects(true);
    try {
      const snap = await getDocs(query(collection(firestore, "projects"), limit(200)));
      const items = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            propertyName: (d.data() as Project).propertyName,
          }) as Pick<Project, "id" | "propertyName">,
      );
      setProjectsSorted(sortByPropertyNamePt(items));
      projectsLoadedRef.current = true;
    } catch (e) {
      console.error("Falha ao listar empreendimentos:", e);
    } finally {
      setLoadingProjects(false);
    }
  }, [firestore]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const id =
      new URLSearchParams(window.location.search).get("empreendimentoId")?.trim() ??
      "";
    setEmpreendimentoId(id);
  }, []);

  React.useEffect(() => {
    if (!firestore || !empreendimentoId) {
      setLinkedProject(null);
      return;
    }
    let cancelled = false;
    setLoadingLinkedProject(true);
    void getDoc(doc(firestore, "projects", empreendimentoId))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setLinkedProject(null);
          return;
        }
        const data = snap.data() as Project;
        setLinkedProject({
          id: snap.id,
          propertyName: data.propertyName,
          perimetroReferencia: data.perimetroReferencia,
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingLinkedProject(false);
      });
    return () => {
      cancelled = true;
    };
  }, [firestore, empreendimentoId]);

  const hasValidInput = React.useMemo(() => {
    if (inputMode === "car") return carNumber.trim().length > 3;
    if (inputMode === "coordinates") return coordinateInput.trim().length > 3;
    if (inputMode === "shp") return shpZipBase64.length > 20;
    if (inputMode === "kml") return kmlText.trim().length > 20;
    return polygonInput.trim().length > 3 || !!drawnPolygon;
  }, [
    carNumber,
    coordinateInput,
    drawnPolygon,
    inputMode,
    kmlText,
    polygonInput,
    shpZipBase64,
  ]);

  const serializedPolygon = React.useMemo(() => {
    if (drawnPolygon) return JSON.stringify(drawnPolygon);
    return polygonInput.trim();
  }, [drawnPolygon, polygonInput]);

  const buildAnalysisInput = React.useCallback((): AnaliseAmbientalInput | null => {
    if (inputMode === "car" && carNumber.trim()) {
      return { dataType: "car", data: carNumber.trim() };
    }
    if (inputMode === "coordinates" && coordinateInput.trim()) {
      return { dataType: "coordinates", data: coordinateInput.trim() };
    }
    if (inputMode === "polygon" && serializedPolygon.trim()) {
      return { dataType: "polygon", data: serializedPolygon.trim() };
    }
    if (inputMode === "shp" && shpZipBase64) {
      return { dataType: "shp", data: shpZipBase64 };
    }
    if (inputMode === "kml" && kmlText.trim()) {
      return { dataType: "kml", data: kmlText.trim() };
    }
    return null;
  }, [carNumber, coordinateInput, inputMode, kmlText, serializedPolygon, shpZipBase64]);

  const buildPerimeterInput = React.useCallback((): PerimeterParseInput | null => {
    const input = buildAnalysisInput();
    if (!input) return null;
    return { dataType: input.dataType, data: input.data };
  }, [buildAnalysisInput]);

  const perimeterInput = React.useMemo(
    () => buildPerimeterInput(),
    [buildPerimeterInput],
  );

  const handleAidManualChange = React.useCallback(
    (geo: GeoJSONLike | null) => {
      setInfluenceConfig((prev) => ({
        ...prev,
        aidManualGeojson: geo,
      }));
    },
    [],
  );

  const handleAiiManualChange = React.useCallback(
    (geo: GeoJSONLike | null) => {
      setInfluenceConfig((prev) => ({
        ...prev,
        aiiManualGeojson: geo,
      }));
    },
    [],
  );

  const buildFactsPrompt = React.useCallback(() => {
    if (!analysisResult) return "";
    const facts = analysisResult.factualData
      .map(
        (item, idx) =>
          `${idx + 1}. Camada: ${item.camada} | Fonte: ${item.fonte} | Método: ${item.metodo} | Resultado: ${item.resultado}`,
      )
      .join("\n");
    return [
      "Use estes dados geoespaciais factuais para cruzamento e recomendações:",
      facts,
      "",
      "Preciso de parecer técnico com riscos regulatórios, pendências e próximos passos para regularização em MG.",
    ].join("\n");
  }, [analysisResult]);

  const saveWaveASnapshot = React.useCallback(
    async (
      input: PerimeterParseInput,
      result: WaveAAnalysisResult,
    ): Promise<string | null> => {
      if (!firestore || !user?.uid) return null;
      try {
        const ref = await addDoc(collection(firestore, "geo_analyses"), {
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          wave: "ABC",
          inputMode: input.dataType,
          inputData: input.data,
          ...(empreendimentoId ? { empreendimentoId } : {}),
          perimeter: result.perimeter,
          layers: result.layers,
          listSummary: buildGeoAnalysisListSummary({
            layers: result.layers,
            perimeterAreaHa: result.perimeter.areaHa,
            generatedAtUtc: result.generatedAtUtc,
          }),
          factualSummary: result.factualSummary,
          fontesConsultadas: result.fontesConsultadas,
          generatedAtUtc: result.generatedAtUtc,
          influenceConfig,
          ...(result.zeeContext ? { zeeContext: result.zeeContext } : {}),
          ...(result.hidrologiaContext
            ? { hidrologiaContext: result.hidrologiaContext }
            : {}),
          ...(result.influenceAreas ? { influenceAreas: result.influenceAreas } : {}),
        });
        return ref.id;
      } catch (error) {
        console.error("Falha ao persistir geo_analyses:", error);
        toast({
          variant: "destructive",
          title: "Análise não foi salva",
          description:
            "O relatório foi gerado, mas não gravou no Firestore. Verifique regras (deploy:rules) ou permissões.",
        });
        return null;
      }
    },
    [empreendimentoId, firestore, influenceConfig, toast, user?.uid],
  );

  const saveAnalysisSnapshot = React.useCallback(
    async (input: AnaliseAmbientalInput, output: AnaliseAmbientalOutput) => {
      if (!firestore || !user?.uid) return;
      try {
        await addDoc(collection(firestore, "geo_analyses"), {
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          wave: "legacy_ia",
          inputMode: input.dataType,
          inputData: input.data,
          ...(empreendimentoId ? { empreendimentoId } : {}),
          summary: output.resumoIA,
          factualData: output.factualData,
          fontesConsultadas: output.fontesConsultadas,
          generatedAtUtc: output.generatedAtUtc,
        });
      } catch (error) {
        console.error("Falha ao persistir geo_analyses:", error);
      }
    },
    [empreendimentoId, firestore, user?.uid],
  );

  const handleStartWaveA = async () => {
    const input = buildAnalysisInput();
    if (!input) {
      toast({
        variant: "destructive",
        title: "Dados insuficientes",
        description: "Preencha CAR, coordenadas, polígono, KML ou SHP para iniciar a análise.",
      });
      return;
    }
    if (input.dataType === "coordinates") {
      toast({
        title: "Coordenada com buffer mínimo",
        description:
          "Para relatório Onda A com % confiável, prefira desenhar o polígono no mapa.",
      });
    }

    setIsWaveALoading(true);
    setWaveAResult(null);
    setGeoComplement(null);
    setWaveALayersDone(0);
    setWaveALayersTotal(WAVE_ALL_LAYER_COUNT);
    setSavedGeoAnalysisId(null);
    setLastPayload(input.data);

    try {
      const perimeterInput: PerimeterParseInput = {
        dataType: input.dataType,
        data: input.data,
      };
      const idToken = await auth?.currentUser?.getIdToken();
      let result: WaveAAnalysisResult;

      const onLayer = (layer: GeoLayerResult, total: number) => {
        setWaveALayersTotal(total);
        setWaveALayersDone((n) => n + 1);
        setWaveAResult((prev) => {
          const layers = [...(prev?.layers ?? []), layer];
          return {
            wave: "ABC",
            generatedAtUtc: prev?.generatedAtUtc ?? new Date().toISOString(),
            perimeter: prev?.perimeter ?? {
              geojson: { type: "FeatureCollection", features: [] },
              areaHa: 0,
              source: input.dataType,
              bbox: [0, 0, 0, 0],
            },
            layers,
            factualSummary: prev?.factualSummary ?? "A consultar camadas…",
            fontesConsultadas: prev?.fontesConsultadas ?? [],
          };
        });
      };

      if (idToken) {
        result = await runWaveAAnalysisStreamClient(
          idToken,
          perimeterInput,
          influenceConfig,
          (event) => {
            if (event.type === "layer") {
              onLayer(event.layer, event.total);
            }
          },
        );
      } else {
        const actionResult = await handleWaveAAnalysis(perimeterInput, influenceConfig);
        if (!actionResult.success) {
          throw new Error(actionResult.error);
        }
        result = actionResult.result;
      }

      setWaveAResult(result);
      const docId = await saveWaveASnapshot(perimeterInput, result);
      setSavedGeoAnalysisId(docId ?? SESSION_GEO_ANALYSIS_ID);
      const okCount = result.layers.filter((l) => l.status === "ok").length;
      const partialCount = result.layers.filter(
        (l) => l.status === "partial",
      ).length;
      toast({
        title: "Análise factual concluída",
        description: docId
          ? `${okCount} camada(s) OK, ${partialCount} parcial/indisponível. Salva para Etapa 2. Exporte o PDF ou complemente com IA.`
          : `${okCount} camada(s) OK. Etapa 2 disponível nesta sessão (não gravou no Firestore — veja o alerta).`,
      });
    } catch (error) {
      console.error("Wave A failed:", error);
      toast({
        variant: "destructive",
        title: "Erro na análise factual",
        description: formatAnalysisFetchError(error, "factual"),
      });
    } finally {
      setIsWaveALoading(false);
    }
  };

  const handleStartAnalysis = async () => {
    const input = buildAnalysisInput();
    if (!input) {
      toast({
        variant: "destructive",
        title: "Dados insuficientes",
        description: "Preencha CAR, coordenadas, polígono, KML ou SHP para iniciar a análise.",
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setAnalysisProvider(null);
    setLastPayload(input.data);

    try {
      const idToken = await auth?.currentUser?.getIdToken();
      const actionResult = await handleAnalyseArea(input, idToken ?? null);
      if (!actionResult.success) {
        throw new Error(actionResult.error);
      }
      const result = actionResult.result;
      setAnalysisResult(result);
      setAnalysisProvider(actionResult.provider);
      await saveAnalysisSnapshot(input, result);
      packageUsage.refresh();
      toast({
        title: "Análise concluída",
        description: `Relatório gerado com ${actionResult.provider === "deepseek" ? "DeepSeek" : "Gemini"}. Pronto para exportação.`,
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Erro na Análise",
        description: formatAnalysisFetchError(error, "ia"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsultSicar = async () => {
    const input = buildAnalysisInput();
    if (!input) {
      toast({
        variant: "destructive",
        title: "Dados insuficientes",
        description: "Informe CAR, coordenadas ou perímetro para consultar o SICAR.",
      });
      return;
    }

    setIsConsultingSicar(true);
    setSicarPreview(null);
    try {
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const body =
        input.dataType === "car"
          ? { codImovel: input.data }
          : { dataType: input.dataType, data: input.data };

      const res = await fetch("/api/geospatial/car", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        resumo?: string;
        error?: string;
        imoveis?: Array<{ codImovel: string; situacao: string }>;
      };

      if (!res.ok || !json.imoveis?.length) {
        throw new Error(json.error || json.resumo || "Nenhum CAR encontrado.");
      }

      setSicarPreview(json.resumo ?? json.imoveis[0].situacao);
      if (input.dataType === "car" && json.imoveis[0]?.codImovel) {
        setCarNumber(json.imoveis[0].codImovel);
      }
      toast({
        title: "Consulta SICAR",
        description: json.resumo ?? "Imóvel localizado na base pública.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na consulta SICAR",
        description:
          error instanceof Error ? error.message : "Serviço indisponível.",
      });
    } finally {
      setIsConsultingSicar(false);
    }
  };

  const handleUseCurrentCoordinates = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocalização indisponível",
        description: "Este navegador não suporta captura automática de coordenadas.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setInputMode("coordinates");
        setCoordinateInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        toast({
          title: "Coordenadas capturadas",
          description: "As coordenadas atuais foram preenchidas automaticamente.",
        });
      },
      () => {
        toast({
          variant: "destructive",
          title: "Falha na captura",
          description: "Não foi possível capturar coordenadas automaticamente.",
        });
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const downloadTextFile = (fileName: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (isExportingCsv) return;
    setIsExportingCsv(true);
    try {
      if (waveAResult) {
        const header =
          "layerId,titulo,status,classe,areaHa,pctEmpreendimento,lengthKm,count,summary";
        const rows: string[] = [];
        for (const layer of waveAResult.layers) {
          if (layer.stats.length === 0) {
            rows.push(
              [
                layer.layerId,
                layer.title,
                layer.status,
                "",
                "",
                "",
                "",
                "",
                layer.summary,
              ]
                .map((v) => `"${String(v).replaceAll('"', '""')}"`)
                .join(","),
            );
          } else {
            for (const row of layer.stats) {
              rows.push(
                [
                  layer.layerId,
                  layer.title,
                  layer.status,
                  row.label,
                  row.areaHa ?? "",
                  row.pctOfPerimeter ?? "",
                  row.lengthKm ?? "",
                  row.count ?? "",
                  layer.summary,
                ]
                  .map((v) => `"${String(v).replaceAll('"', '""')}"`)
                  .join(","),
              );
            }
          }
        }
        const csv = [header, ...rows].join("\n");
        downloadTextFile(
          `analise-factual-${waveAResult.perimeter.areaHa.toFixed(0)}ha-${new Date().toISOString().slice(0, 10)}.csv`,
          csv,
          "text/csv;charset=utf-8;",
        );
      } else if (analysisResult) {
        const header = "camada,fonte,metodo,resultado,areaHa";
        const rows = analysisResult.factualData.map((item) =>
          [
            item.camada,
            item.fonte,
            item.metodo,
            item.resultado,
            item.areaHa ?? "",
          ]
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(","),
        );
        const csv = [header, ...rows].join("\n");
        downloadTextFile(
          `relatorio-analise-geoespacial-${new Date().toISOString().slice(0, 10)}.csv`,
          csv,
          "text/csv;charset=utf-8;",
        );
      }
      toast({ title: "CSV exportado", description: "Tabela factual baixada com sucesso." });
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleDownloadGeoJson = () => {
    if (isExportingGeojson) return;
    setIsExportingGeojson(true);
    try {
      if (waveAResult) {
        downloadTextFile(
          `analise-geo-${waveAResult.perimeter.areaHa.toFixed(0)}ha-${new Date().toISOString().slice(0, 10)}.geojson`,
          JSON.stringify(
            {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {
                    generatedAtUtc: waveAResult.generatedAtUtc,
                    factualSummary: waveAResult.factualSummary,
                    layers: waveAResult.layers,
                  },
                  geometry: waveAResult.perimeter.geojson,
                },
              ],
            },
            null,
            2,
          ),
          "application/geo+json;charset=utf-8;",
        );
      } else if (analysisResult) {
        const featureCollection = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                generatedAtUtc: analysisResult.generatedAtUtc,
                summary: analysisResult.resumoIA,
                factualData: analysisResult.factualData,
                fontesConsultadas: analysisResult.fontesConsultadas,
                inputData: lastPayload,
              },
              geometry: drawnPolygon && drawnPolygon.type ? drawnPolygon : null,
            },
          ],
        };
        downloadTextFile(
          `relatorio-analise-geoespacial-${new Date().toISOString().slice(0, 10)}.geojson`,
          JSON.stringify(featureCollection, null, 2),
          "application/geo+json;charset=utf-8;",
        );
      }
      toast({ title: "GeoJSON exportado", description: "Pacote geoespacial baixado com sucesso." });
    } finally {
      setIsExportingGeojson(false);
    }
  };

  const analysisPreviewValue = React.useMemo(() => {
    if (inputMode === "shp" && shpFileName) {
      return `[SHP] ${shpFileName} (${Math.round(shpZipBase64.length * 0.75)} bytes no pacote)`;
    }
    const built = buildAnalysisInput();
    if (!built) return "";
    if (built.data.length > 2000) {
      return `${built.data.slice(0, 2000)}… (${built.data.length} caracteres)`;
    }
    return built.data;
  }, [buildAnalysisInput, inputMode, shpFileName, shpZipBase64]);

  const handleUseProjectPerimetro = async () => {
    const perimetro = linkedProject?.perimetroReferencia;
    if (!perimetro) {
      toast({
        variant: "destructive",
        title: "Sem perímetro no cadastro",
        description: "Este empreendimento não tem perímetro de referência salvo.",
      });
      return;
    }
    setLoadingProjectPerimetro(true);
    try {
      const resolved = await resolvePerimetroReferenciaFromProject(perimetro);
      if (!resolved) {
        throw new Error("Não foi possível interpretar o perímetro de referência.");
      }
      setInputMode("polygon");
      setDrawnPolygon(resolved.polygon as unknown as GeoJSONLike);
      setPolygonInput(JSON.stringify(resolved.polygon.geometry));
      setCarNumber("");
      setCoordinateInput("");
      setKmlText("");
      setKmlFileName("");
      setShpZipBase64("");
      setShpFileName("");
      toast({
        title: "Perímetro carregado do cadastro",
        description: `${resolved.areaHa.toFixed(2)} ha — você pode editar no mapa antes de analisar.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha ao carregar perímetro",
        description: error instanceof Error ? error.message : "Tente outro modo de entrada.",
      });
    } finally {
      setLoadingProjectPerimetro(false);
    }
  };

  return (
    <StudyGeospatialStackedShell
      title="Análise Geoespacial (IA)"
      description={`Desenhe o perímetro, execute as ${WAVE_ALL_LAYER_COUNT} camadas SIG (MG, incl. potencialidade CECAV), exporte mapas no layout Pimenta (PDF, PNG, JPEG ou Word) e complemente com IA em Relatórios de IA.`}
      topExtras={
        <>
          <PackageUsageBanner usage={packageUsage} showAmbbot />
          {empreendimentoId ? (
            <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
              Empreendimento vinculado:{" "}
              <span className="font-medium text-foreground">
                {linkedProject?.propertyName ?? empreendimentoId}
              </span>
              {loadingLinkedProject ? " (carregando…)" : null}. A análise gravada ficará
              disponível no PEA deste projeto.
            </p>
          ) : null}
        </>
      }
      mapPane={
        <Card className="flex w-full flex-col overflow-hidden">
          <CardHeader className="shrink-0 space-y-1 pb-3">
            <CardTitle>Captura por coordenada / polígono</CardTitle>
            <CardDescription>
              Mapa em largura total: desenhe o perímetro, capture coordenadas ou
              carregue SHP no painel abaixo.               O mesmo limite alimenta as {WAVE_ALL_LAYER_COUNT} camadas
              IDE-Sisema MG (incl. cavidades / CECAV).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="relative min-h-[680px] w-full md:min-h-[800px] lg:min-h-[920px]">
              <div className="absolute inset-0 overflow-hidden rounded-md border">
                <LeafletMap
                  adaPolygon={drawnPolygon}
                  onAdaChange={setDrawnPolygon}
                  aidPolygon={
                    influenceConfig.aidManualGeojson as GeoJSONLike | null | undefined
                  }
                  onAidChange={handleAidManualChange}
                  aiiPolygon={
                    influenceConfig.aiiManualGeojson as GeoJSONLike | null | undefined
                  }
                  onAiiChange={handleAiiManualChange}
                  drawTarget={influenceDrawTarget}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleUseCurrentCoordinates}>
                Capturar coordenada atual
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!drawnPolygon) return;
                  setInputMode("polygon");
                  setPolygonInput(JSON.stringify(drawnPolygon));
                }}
              >
                Usar polígono desenhado
              </Button>
            </div>
          </CardContent>
        </Card>
      }
      controlsPane={
        <>
          <Collapsible defaultOpen={false} className="group rounded-lg border bg-card shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2">
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 px-2">
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto flex-1 justify-start px-0 py-1 text-left font-normal hover:bg-transparent"
                >
                  <span className="text-sm font-medium leading-tight">
                    Como usar esta página
                  </span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-2 border-t px-3 py-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                Etapa 1: relatório factual SIG ({WAVE_ALL_LAYER_COUNT} camadas, sem custo de IA).
                Etapa 2 (abaixo): parecer opcional com Gemini ou DeepSeek.
              </p>
              <p>
                Para o visualizador oficial de camadas do Sisema-MG, abra{" "}
                <Link
                  href="/studies/ide-sisemanet"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  IDE-SisemaNet
                </Link>{" "}
                em {ESTUDOS_TECNICOS_MENU_LABEL}.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Análise geoespacial factual</CardTitle>
              <CardDescription>
                IDE-Sisema MG + SICAR + IBAMA (embargos, UC, TI) + PRODES INPE.
                ADA/AID/AII configuradas acima.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-md border border-dashed p-3">
                <Label htmlFor="aa-empreendimento">Empreendimento (opcional)</Label>
                <Select
                  value={empreendimentoId || "_none"}
                  onOpenChange={(open) => {
                    if (open) void ensureProjectsLoaded();
                  }}
                  onValueChange={(value) =>
                    setEmpreendimentoId(value === "_none" ? "" : value)
                  }
                >
                  <SelectTrigger id="aa-empreendimento">
                    <SelectValue placeholder="Nenhum — análise avulsa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhum — análise avulsa</SelectItem>
                    {loadingProjects ? (
                      <SelectItem value="_loading" disabled>
                        Carregando empreendimentos…
                      </SelectItem>
                    ) : null}
                    {projectsSorted.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.propertyName || p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {linkedProject && projectHasPerimetroReferencia(linkedProject) ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <p className="text-xs text-muted-foreground">
                      Perímetro de referência:{" "}
                      {linkedProject.perimetroReferencia?.fileName ?? "arquivo"}{" "}
                      {typeof linkedProject.perimetroReferencia?.areaHa === "number"
                        ? `(${linkedProject.perimetroReferencia.areaHa.toFixed(2)} ha)`
                        : ""}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={loadingProjectPerimetro || loadingLinkedProject}
                      onClick={() => void handleUseProjectPerimetro()}
                    >
                      {loadingProjectPerimetro ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Usar perímetro do cadastro
                    </Button>
                  </div>
                ) : empreendimentoId && !loadingLinkedProject ? (
                  <p className="text-xs text-muted-foreground">
                    Este empreendimento não tem perímetro de referência no cadastro.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="input-mode">Modo de entrada</Label>
                <Select
                  value={inputMode}
                  onValueChange={(value) => setInputMode(value as InputMode)}
                >
                  <SelectTrigger id="input-mode">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Número do CAR</SelectItem>
                    <SelectItem value="coordinates">Coordenadas</SelectItem>
                    <SelectItem value="polygon">Polígono (WKT/GeoJSON)</SelectItem>
                    <SelectItem value="kml">Perímetro KML (.kml)</SelectItem>
                    <SelectItem value="shp">Perímetro SHP (.zip)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
              {inputMode === "car" && (
                <div className="space-y-2">
                  <Label htmlFor="car-input">Número do CAR</Label>
                  <Input
                    id="car-input"
                    placeholder="Ex: MG-3106200-1234.ABCD.EF12.3456.7890.ABCD.EF12.3456"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value)}
                  />
                </div>
              )}

              {inputMode === "coordinates" && (
                <div className="space-y-2">
                  <Label htmlFor="coords-input">Coordenadas (lat, lng)</Label>
                  <Input
                    id="coords-input"
                    placeholder="Ex: -19.922731, -43.945095"
                    value={coordinateInput}
                    onChange={(e) => setCoordinateInput(e.target.value)}
                  />
                </div>
              )}

              {inputMode === "polygon" && (
                <div className="space-y-2">
                  <Label htmlFor="polygon-input">Polígono (WKT ou GeoJSON)</Label>
                  <Textarea
                    id="polygon-input"
                    placeholder='Ex: {"type":"Polygon","coordinates":[...]}'
                    value={polygonInput}
                    onChange={(e) => setPolygonInput(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              )}

              {inputMode === "kml" && (
                <div className="space-y-2">
                  <Label htmlFor="kml-upload">Arquivo KML</Label>
                  <Input
                    id="kml-upload"
                    type="file"
                    accept=".kml,.xml,text/xml,application/vnd.google-earth.kml+xml"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 4 * 1024 * 1024) {
                        toast({
                          variant: "destructive",
                          title: "Arquivo grande demais",
                          description: "Use um KML até 4 MB ou extraia o .kml de um KMZ.",
                        });
                        return;
                      }
                      const name = file.name.toLowerCase();
                      if (name.endsWith(".kmz")) {
                        toast({
                          variant: "destructive",
                          title: "KMZ não suportado aqui",
                          description:
                            "Extraia o ficheiro .kml do KMZ (ZIP) e carregue o .kml, ou use Mapas / PEA.",
                        });
                        return;
                      }
                      const text = await file.text();
                      setKmlText(text);
                      setKmlFileName(file.name);
                    }}
                  />
                  {kmlFileName ? (
                    <p className="text-xs text-muted-foreground">
                      Carregado: {kmlFileName}. O perímetro será lido do Placemark/Polygon no KML.
                    </p>
                  ) : null}
                </div>
              )}

              {inputMode === "shp" && (
                <div className="space-y-2">
                  <Label htmlFor="shp-upload">Arquivo ZIP do shapefile</Label>
                  <Input
                    id="shp-upload"
                    type="file"
                    accept=".zip,application/zip"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 8 * 1024 * 1024) {
                        toast({
                          variant: "destructive",
                          title: "Arquivo grande demais",
                          description: "Use um ZIP até 8 MB com .shp, .shx e .dbf.",
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
                      Carregado: {shpFileName}. O ZIP deve conter .shp, .shx e .dbf do
                      perímetro da propriedade.
                    </p>
                  ) : null}
                </div>
              )}
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="analysis-preview">Resumo do perímetro enviado</Label>
                <Textarea
                  id="analysis-preview"
                  value={analysisPreviewValue}
                  readOnly
                  className="min-h-[72px] font-mono text-xs"
                />
              </div>
              </div>
              {sicarPreview ? (
                <p className="text-sm text-muted-foreground">
                  <strong>SICAR:</strong> {sicarPreview}
                </p>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                disabled={isConsultingSicar || !hasValidInput}
                onClick={() => void handleConsultSicar()}
                className="sm:w-auto"
              >
                {isConsultingSicar ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consultando SICAR…
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Consultar CAR (SICAR)
                  </>
                )}
              </Button>
              <Button
                onClick={handleStartWaveA}
                disabled={isWaveALoading || isLoading || !hasValidInput}
                className="flex-1"
              >
                {isWaveALoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consultando camadas SIG...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Gerar relatório factual ({WAVE_ALL_LAYER_COUNT} camadas MG + federal)
                  </>
                )}
              </Button>
              </div>
              <Collapsible open={legacyAnalysisOpen} onOpenChange={setLegacyAnalysisOpen}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="w-full text-xs">
                    <ChevronDown
                      className={`mr-2 h-4 w-4 transition-transform ${legacyAnalysisOpen ? "rotate-180" : ""}`}
                    />
                    Fluxo legado (DeepSeek, formato antigo)
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <Button
                    onClick={handleStartAnalysis}
                    disabled={isLoading || isWaveALoading || !hasValidInput}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        IA analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Relatório legado (DeepSeek)
                      </>
                    )}
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <GeoInfluenceAreasPanel
            perimeterInput={perimeterInput}
            config={influenceConfig}
            onConfigChange={setInfluenceConfig}
            drawTarget={influenceDrawTarget}
            onDrawTargetChange={setInfluenceDrawTarget}
            includeSatelliteBackground={includeSatelliteBackground}
            onIncludeSatelliteChange={setIncludeSatelliteBackground}
          />
        </>
      }
      resultsPane={
        <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultados da análise</CardTitle>
              <CardDescription>
                Dados SIG por camada. Use o painel de exportação para PDF, PNG, JPEG ou Word —
                por camada ou relatório completo (com parecer IA se já gerou a Etapa 2).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isWaveALoading || isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="mb-3 h-10 w-10 animate-spin" />
                  <p className="text-sm">
                    {isWaveALoading
                      ? waveALayersDone > 0
                        ? `Camada ${waveALayersDone} de ${waveALayersTotal} (IDE-Sisema MG + SICAR + IBAMA)…`
                        : `Consultando ${WAVE_ALL_LAYER_COUNT} camadas (IDE-Sisema MG + SICAR + IBAMA)…`
                      : "Processando dados e gerando análise geoespacial..."}
                  </p>
                </div>
              ) : waveAResult || analysisResult ? (
                <div className="space-y-6">
                  {waveAResult ? (
                    <>
                      <div className="rounded-lg border bg-muted/30 px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {waveAResult.factualSummary}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-primary">
                          Área: {waveAResult.perimeter.areaHa.toFixed(2)} ha · Análise SIG MG (
                          {WAVE_ALL_LAYER_COUNT} camadas)
                          {waveAResult.perimeter.source === "shp"
                            ? " · perímetro SHP"
                            : ""}
                        </p>
                      </div>
                      <GeoCavidadesBridge wave={waveAResult} />
                      <GeoWaveALayerCards
                        layers={waveAResult.layers}
                        inProgressCount={
                          isWaveALoading ? waveALayersDone : undefined
                        }
                      />
                    </>
                  ) : analysisResult ? (
                    <>
                      {analysisProvider ? (
                        <AiProviderBadge provider={analysisProvider} showHint />
                      ) : null}
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {analysisResult.resumoIA}
                      </p>
                      <div className="rounded-md border p-3">
                        <p className="mb-2 text-sm font-medium">Evidências factuais</p>
                        <div className="space-y-2">
                          {analysisResult.factualData.map((item, idx) => (
                            <p
                              key={`${item.camada}-${idx}`}
                              className="text-xs text-muted-foreground"
                            >
                              {idx + 1}. {item.camada} ({item.fonte}) - {item.resultado}
                            </p>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                  {waveAResult ? (
                    <GeoAnalysisExportPanel
                      wave={waveAResult}
                      complement={geoComplement}
                      includeSatelliteBackground={includeSatelliteBackground}
                      includeThematicWfs={includeThematicWfs}
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2 border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={handleDownloadCsv}
                      disabled={isExportingCsv || (!waveAResult && !analysisResult)}
                      className="min-w-[160px] flex-1"
                    >
                      {isExportingCsv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                      Exportar CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadGeoJson}
                      disabled={isExportingGeojson || (!waveAResult && !analysisResult)}
                      className="min-w-[160px] flex-1"
                    >
                      {isExportingGeojson ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                      Exportar GeoJSON
                    </Button>
                    {savedGeoAnalysisId &&
                      !isSessionGeoAnalysisId(savedGeoAnalysisId) && (
                      <Button asChild variant="default" className="min-w-[200px] flex-1">
                        <Link
                          href={`/laudos/new?tipoEstudo=RCA&geoAnalysisId=${encodeURIComponent(savedGeoAnalysisId)}`}
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Iniciar laudo RCA (Passo 3)
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" className="min-w-[200px] flex-1">
                      <Link
                        href={`/studies/assistant?tipo=mcp&prompt=${encodeURIComponent(buildFactsPrompt())}`}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Enviar para Cruzamento de dados
                      </Link>
                    </Button>
                    {empreendimentoId ? (
                      <Button asChild variant="outline" className="min-w-[200px] flex-1">
                        <Link
                          href={`/studies/educacao-ambiental/novo?empreendimentoId=${encodeURIComponent(empreendimentoId)}${savedGeoAnalysisId && !isSessionGeoAnalysisId(savedGeoAnalysisId) ? `&geoAnalysisId=${encodeURIComponent(savedGeoAnalysisId)}` : ""}`}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Criar PEA do empreendimento
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <Globe className="mb-3 h-12 w-12 opacity-50" />
                  <p className="text-sm">
                    Configure o perímetro e clique em &quot;Gerar relatório factual ({WAVE_ALL_LAYER_COUNT} camadas MG)&quot;.
                    Depois avance para a Etapa 2 abaixo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
      }
      footerPane={
        user?.uid && (waveAResult || savedGeoAnalysisId) ? (
          <Suspense fallback={null}>
            <GeoAnalysisComplementPanel
              userId={user.uid}
              initialGeoAnalysisId={savedGeoAnalysisId}
              inlineWaveResult={waveAResult}
              onComplementChange={(c) => setGeoComplement(c)}
              includeSatelliteBackground={includeSatelliteBackground}
              includeThematicWfs={includeThematicWfs}
            />
          </Suspense>
        ) : null
      }
    />
  );
}
