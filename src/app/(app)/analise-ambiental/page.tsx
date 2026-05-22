"use client";

import * as React from "react";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { StudyGeospatialSplitShell } from "@/components/studies/study-geospatial-split-shell";
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
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  drawWatermarkOnPage,
} from "@/lib/pdf-branding-layout";
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
import { appendWaveAFactualPdf } from "@/lib/geospatial/export-wave-a-pdf";
import { GeoAnalysisComplementPanel } from "@/components/geospatial/geo-analysis-complement-panel";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false });

type InputMode = "car" | "coordinates" | "polygon" | "shp";
type GeoJSONLike = {
  type: string;
  [key: string]: unknown;
};

export default function AnaliseAmbientalPage() {
  const { firestore, user, auth } = useFirebase();
  const { user: appUser } = useAuth();
  const packageUsage = usePackageUsage(appUser ?? null);
  const { data: brandingData } = useLocalBranding();
  const [inputMode, setInputMode] = React.useState<InputMode>("car");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [isExportingCsv, setIsExportingCsv] = React.useState(false);
  const [isExportingGeojson, setIsExportingGeojson] = React.useState(false);
  const [analysisResult, setAnalysisResult] =
    React.useState<AnaliseAmbientalOutput | null>(null);
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
  const [lastPayload, setLastPayload] = React.useState("");
  const { toast } = useToast();

  const hasValidInput = React.useMemo(() => {
    if (inputMode === "car") return carNumber.trim().length > 3;
    if (inputMode === "coordinates") return coordinateInput.trim().length > 3;
    if (inputMode === "shp") return shpZipBase64.length > 20;
    return polygonInput.trim().length > 3 || !!drawnPolygon;
  }, [
    carNumber,
    coordinateInput,
    drawnPolygon,
    inputMode,
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
    return null;
  }, [carNumber, coordinateInput, inputMode, serializedPolygon, shpZipBase64]);

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
    [firestore, toast, user?.uid],
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
          summary: output.resumoIA,
          factualData: output.factualData,
          fontesConsultadas: output.fontesConsultadas,
          generatedAtUtc: output.generatedAtUtc,
        });
      } catch (error) {
        console.error("Falha ao persistir geo_analyses:", error);
      }
    },
    [firestore, user?.uid],
  );

  const handleStartWaveA = async () => {
    const input = buildAnalysisInput();
    if (!input) {
      toast({
        variant: "destructive",
        title: "Dados insuficientes",
        description: "Preencha CAR, coordenadas ou polígono para iniciar a análise.",
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
      if (docId) setSavedGeoAnalysisId(docId);
      const okCount = actionResult.result.layers.filter((l) => l.status === "ok").length;
      const partialCount = actionResult.result.layers.filter(
        (l) => l.status === "partial",
      ).length;
      toast({
        title: "Análise factual concluída",
        description: docId
          ? `${okCount} camada(s) OK, ${partialCount} parcial/indisponível. Salva para Etapa 2. Exporte o PDF ou complemente com IA.`
          : `${okCount} camada(s) OK. Não foi possível salvar para Etapa 2 — veja o alerta acima.`,
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
        description: "Preencha CAR, coordenadas ou polígono para iniciar a análise.",
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setLastPayload(input.data);

    try {
      const idToken = await auth?.currentUser?.getIdToken();
      const actionResult = await handleAnalyseArea(input, idToken ?? null);
      if (!actionResult.success) {
        throw new Error(actionResult.error);
      }
      const result = actionResult.result;
      setAnalysisResult(result);
      await saveAnalysisSnapshot(input, result);
      packageUsage.refresh();
      toast({
        title: "Análise concluída",
        description: "Relatório pronto para exportação (PDF/CSV/GeoJSON).",
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
      const session = await createMmBrandedPdfSession(
        brandingUrlsFromLocal(brandingData),
      );

      if (waveAResult) {
        appendWaveAFactualPdf(session, waveAResult);
      } else if (analysisResult) {
        const { doc, margins } = session;
        const pageW = doc.internal.pageSize.getWidth();
        let y = session.startY;
        const onPdfPage = () => drawWatermarkOnPage(doc, session.branding);

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Relatório de Análise Ambiental Geoespacial", pageW / 2, y, {
          align: "center",
        });
        y += 10;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const resumoLines = doc.splitTextToSize(
          analysisResult.resumoIA,
          pageW - margins.left - margins.right,
        );
        doc.text(resumoLines, margins.left, y);
        y += resumoLines.length * 6 + 8;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Evidências factuais", margins.left, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        analysisResult.factualData.forEach((item, index) => {
          const line = `${index + 1}. ${item.camada} | ${item.fonte} | ${item.resultado}`;
          const lines = doc.splitTextToSize(line, pageW - margins.left - margins.right);
          for (const l of lines) {
            if (y > 270) {
              doc.addPage();
              onPdfPage();
              y = session.startY;
            }
            doc.text(l, margins.left, y);
            y += 5;
          }
        });
        y += 6;

        const lineHeight = 5;
        const maxY = 280;
        analysisResult.analises.forEach((item) => {
          if (y > maxY - 20) {
            doc.addPage();
            onPdfPage();
            y = session.startY;
          }
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(item.titulo, margins.left, y);
          y += 7;
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(
            item.relatorio,
            pageW - margins.left - margins.right,
          );
          for (const line of lines) {
            if (y > maxY - 10) {
              doc.addPage();
              onPdfPage();
              y = session.startY;
            }
            doc.text(line, margins.left, y);
            y += lineHeight;
          }
          y += 6;
        });
      }

      session.finalize();
      session.doc.save(
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

  return (
    <StudyGeospatialSplitShell
      title="Análise Geoespacial (IA)"
      description="Desenhe o perímetro, execute a Onda A (SIG: hidrografia, bioma, solos) e exporte PDF factual; depois complemente com IA em Relatórios de IA."
      mapPane={
        <Card className="flex h-full min-h-[420px] min-w-0 flex-1 flex-col overflow-hidden md:min-h-0">
          <CardHeader className="shrink-0 space-y-1 pb-3">
            <CardTitle>Captura por coordenada/polígono</CardTitle>
            <CardDescription>
              Desenhe o perímetro no mapa (mesmo basemap que Mapas) ou use as
              ações abaixo; em seguida confira o modo de entrada na coluna à
              direita.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 pt-0 min-h-0">
            <div className="relative min-h-[280px] flex-1 basis-0">
              <div className="absolute inset-0 overflow-hidden rounded-md border">
                <LeafletMap polygon={drawnPolygon} onPolygonCreated={setDrawnPolygon} />
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
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
      sidebar={
        <>
          <PackageUsageBanner usage={packageUsage} showAmbbot />
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
                Use o mapa à esquerda para desenhar ou capturar coordenadas;
                escolha o modo (CAR, coordenadas ou polígono) nos cartões ao lado
                e gere o relatório com IA. Os dados indicados são enviados à
                análise — copie do portal público e cole nos campos, se
                precisar.
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
                IDE-Sisema MG: hidrografia, bioma, solos, geologia, geomorfologia, pedologia, vegetação e fauna.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
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
                    <SelectItem value="shp">Perímetro SHP (.zip)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="analysis-preview">
                  Prévia do payload a analisar
                </Label>
                <Textarea
                  id="analysis-preview"
                  value={buildAnalysisInput()?.data ?? ""}
                  readOnly
                  className="min-h-[80px]"
                />
              </div>
              <Button
                onClick={handleStartWaveA}
                disabled={isWaveALoading || isLoading || !hasValidInput}
                className="w-full"
              >
                {isWaveALoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consultando camadas SIG...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Gerar relatório factual (8 camadas MG)
                  </>
                )}
              </Button>
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
                    Relatório com IA (legado)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relatório da Análise</CardTitle>
              <CardDescription>
                Quando o relatório for gerado, ele ficará disponível para download
                em PDF.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isWaveALoading || isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="mb-3 h-10 w-10 animate-spin" />
                  <p className="text-sm">
                    {isWaveALoading
                      ? "Consultando IDE-Sisema (hidrografia, bioma, solos)..."
                      : "Processando dados e gerando análise geoespacial..."}
                  </p>
                </div>
              ) : waveAResult || analysisResult ? (
                <div className="space-y-4">
                  {waveAResult ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {waveAResult.factualSummary}
                      </p>
                      <p className="text-xs font-medium text-primary">
                        Área: {waveAResult.perimeter.areaHa.toFixed(2)} ha · Ondas A+B+C
                      </p>
                      <GeoWaveALayerCards layers={waveAResult.layers} />
                    </>
                  ) : analysisResult ? (
                    <>
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
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleDownloadPdf}
                      disabled={isGeneratingPdf}
                      className="w-full"
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
                      className="w-full"
                    >
                      {isExportingCsv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                      Exportar CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadGeoJson}
                      disabled={isExportingGeojson}
                      className="w-full"
                    >
                      {isExportingGeojson ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                      Exportar GeoJSON
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link
                        href={`/studies/assistant?tipo=mcp&prompt=${encodeURIComponent(buildFactsPrompt())}`}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Enviar para Cruzamento de dados
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <Globe className="mb-3 h-12 w-12 opacity-50" />
                  <p className="text-sm">
                    Configure o perímetro e clique em &quot;Gerar relatório factual (Onda A)&quot;.
                    Depois use &quot;Complementar com IA&quot; em Relatórios de IA.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {user?.uid && (waveAResult || savedGeoAnalysisId) ? (
            <Suspense fallback={null}>
              <GeoAnalysisComplementPanel
                userId={user.uid}
                initialGeoAnalysisId={savedGeoAnalysisId}
                inlineWaveResult={waveAResult}
              />
            </Suspense>
          ) : null}
        </>
      }
    />
  );
}
