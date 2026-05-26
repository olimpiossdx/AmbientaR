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
import {
  prepareIaMenuBrandedPdfSession,
  saveIaMenuBrandedPdf,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from "@/lib/ia-menu-branded-pdf";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebase, useAuth } from "@/firebase";
import { usePackageUsage } from "@/hooks/use-package-usage";
import { PackageUsageBanner } from "@/components/package-usage-banner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { handleAnalyseArea } from "./actions";
import { handleWaveAAnalysis } from "./actions-wave-a";
import type { WaveAAnalysisResult } from "@/lib/types/geo-wave-a";
import { GeoWaveALayerCards } from "@/components/geospatial/geo-wave-a-layer-cards";
import { GeoCavidadesBridge } from "@/components/geospatial/geo-cavidades-bridge";
import { SIG_MG_LAYER_COUNT } from "@/lib/geospatial/wave-a-catalog";
import { appendWaveAFactualPdf } from "@/lib/geospatial/export-wave-a-pdf";
import { buildFactualMinimaps } from "@/lib/geospatial/render-minimap-client";
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
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [isExportingCsv, setIsExportingCsv] = React.useState(false);
  const [isExportingGeojson, setIsExportingGeojson] = React.useState(false);
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
  const [carNumber, setCarNumber] = React.useState("");
  const [coordinateInput, setCoordinateInput] = React.useState("");
  const [polygonInput, setPolygonInput] = React.useState("");
  const [drawnPolygon, setDrawnPolygon] = React.useState<GeoJSONLike | null>(null);
  const [shpZipBase64, setShpZipBase64] = React.useState("");
  const [shpFileName, setShpFileName] = React.useState("");
  const [kmlText, setKmlText] = React.useState("");
  const [kmlFileName, setKmlFileName] = React.useState("");
  const [empreendimentoId, setEmpreendimentoId] = React.useState("");
  const [lastPayload, setLastPayload] = React.useState("");
  const { toast } = useToast();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const id =
      new URLSearchParams(window.location.search).get("empreendimentoId")?.trim() ??
      "";
    setEmpreendimentoId(id);
  }, []);

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
          factualSummary: result.factualSummary,
          fontesConsultadas: result.fontesConsultadas,
          generatedAtUtc: result.generatedAtUtc,
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
    [empreendimentoId, firestore, toast, user?.uid],
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
    setSavedGeoAnalysisId(null);
    setLastPayload(input.data);

    try {
      const perimeterInput: PerimeterParseInput = {
        dataType: input.dataType,
        data: input.data,
      };
      const actionResult = await handleWaveAAnalysis(perimeterInput);
      if (!actionResult.success) {
        throw new Error(actionResult.error);
      }
      setWaveAResult(actionResult.result);
      const docId = await saveWaveASnapshot(perimeterInput, actionResult.result);
      setSavedGeoAnalysisId(docId ?? SESSION_GEO_ANALYSIS_ID);
      const okCount = actionResult.result.layers.filter((l) => l.status === "ok").length;
      const partialCount = actionResult.result.layers.filter(
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
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível consultar as camadas IDE-Sisema.",
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
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao processar os dados.",
      });
    } finally {
      setIsLoading(false);
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

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    if (!waveAResult && !analysisResult) return;
    setIsGeneratingPdf(true);
    try {
      const session = await prepareIaMenuBrandedPdfSession({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
      });
      if (!session) return;

      if (waveAResult) {
        let minimaps = null;
        try {
          minimaps = await buildFactualMinimaps(waveAResult);
        } catch (e) {
          console.warn("Mini-mapas omitidos no PDF:", e);
        }
        appendWaveAFactualPdf(session, waveAResult, { minimaps });
      } else if (analysisResult) {
        const { doc } = session;
        const pageW = doc.internal.pageSize.getWidth();
        let y = session.startY;
        y = session.ensureSpace(y, 18);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Relatório de Análise Ambiental Geoespacial", pageW / 2, y, {
          align: "center",
        });
        y += 12;

        y = writeBrandedPdfParagraph(session, analysisResult.resumoIA, 11, y);
        y = writeBrandedPdfTitle(session, "Evidências factuais", 12);
        for (let index = 0; index < analysisResult.factualData.length; index++) {
          const item = analysisResult.factualData[index]!;
          y = writeBrandedPdfParagraph(
            session,
            `${index + 1}. ${item.camada} | ${item.fonte} | ${item.resultado}`,
            10,
            y,
          );
        }

        for (const item of analysisResult.analises) {
          y = writeBrandedPdfTitle(session, item.titulo, 12);
          y = writeBrandedPdfParagraph(session, item.relatorio, 10, y);
        }
      }

      saveIaMenuBrandedPdf(
        session,
        `relatorio-analise-geoespacial-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      toast({ title: "PDF gerado", description: "O arquivo foi baixado." });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o relatório. Tente novamente.",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!analysisResult || isExportingCsv) return;
    setIsExportingCsv(true);
    try {
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
      toast({ title: "CSV exportado", description: "Tabela factual baixada com sucesso." });
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleDownloadGeoJson = () => {
    if (!analysisResult || isExportingGeojson) return;
    setIsExportingGeojson(true);
    try {
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

  return (
    <StudyGeospatialStackedShell
      title="Análise Geoespacial (IA)"
      description={`Desenhe o perímetro, execute as ${SIG_MG_LAYER_COUNT} camadas SIG (MG, incl. potencialidade CECAV) e exporte o PDF factual; depois complemente com IA em Relatórios de IA.`}
      topExtras={
        <>
          <PackageUsageBanner usage={packageUsage} showAmbbot />
          {empreendimentoId ? (
            <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
              Empreendimento vinculado:{" "}
              <span className="font-mono text-xs">{empreendimentoId}</span>. A análise
              gravada ficará disponível no PEA deste projeto.
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
              carregue SHP no painel abaixo.               O mesmo limite alimenta as {SIG_MG_LAYER_COUNT} camadas
              IDE-Sisema MG (incl. cavidades / CECAV).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            <div className="relative min-h-[360px] w-full md:min-h-[420px] lg:min-h-[480px]">
              <div className="absolute inset-0 overflow-hidden rounded-md border">
                <LeafletMap polygon={drawnPolygon} onPolygonCreated={setDrawnPolygon} />
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
                Desenhe no mapa ou envie SHP/CAR; gere o relatório factual (8
                camadas) e confira os cartões abaixo. Depois use a Etapa 2 para
                complemento com IA.
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
                IDE-Sisema MG: hidrografia, bioma, solos, geologia, geomorfologia,
                pedologia, vegetação, fauna e potencialidade de cavidades (CECAV).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="flex flex-col gap-2 sm:flex-row">
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
                    Gerar relatório factual ({SIG_MG_LAYER_COUNT} camadas MG)
                  </>
                )}
              </Button>
              <Button
                onClick={handleStartAnalysis}
                disabled={isLoading || isWaveALoading || !hasValidInput}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    IA analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Relatório completo (DeepSeek)
                  </>
                )}
              </Button>
              </div>
            </CardContent>
          </Card>
        </>
      }
      resultsPane={
        <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultados da análise</CardTitle>
              <CardDescription>
                Resumo por camada IDE-Sisema MG. Exporte o PDF factual ou avance para a
                Etapa 2 (complemento IA).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isWaveALoading || isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="mb-3 h-10 w-10 animate-spin" />
                  <p className="text-sm">
                    {isWaveALoading
                      ? `Consultando ${SIG_MG_LAYER_COUNT} camadas no IDE-Sisema MG...`
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
                          {SIG_MG_LAYER_COUNT} camadas)
                          {waveAResult.perimeter.source === "shp"
                            ? " · perímetro SHP"
                            : ""}
                        </p>
                      </div>
                      <GeoCavidadesBridge wave={waveAResult} />
                      <GeoWaveALayerCards layers={waveAResult.layers} />
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
                  <div className="flex flex-wrap gap-2 border-t pt-4">
                    <Button
                      onClick={handleDownloadPdf}
                      disabled={isGeneratingPdf}
                      className="min-w-[200px] flex-1"
                    >
                      {isGeneratingPdf ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando PDF...
                        </>
                      ) : (
                        <>
                          <FileDown className="mr-2 h-4 w-4" />
                          Baixar PDF
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadCsv}
                      disabled={isExportingCsv}
                      className="min-w-[160px] flex-1"
                    >
                      {isExportingCsv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                      Exportar CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadGeoJson}
                      disabled={isExportingGeojson}
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
                    Configure o perímetro e clique em &quot;Gerar relatório factual ({SIG_MG_LAYER_COUNT} camadas MG)&quot;.
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
            />
          </Suspense>
        ) : null
      }
    />
  );
}
