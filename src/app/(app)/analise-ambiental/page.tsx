"use client";

import * as React from "react";
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
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  drawWatermarkOnPage,
} from "@/lib/pdf-branding-layout";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebase } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { handleAnalyseArea } from "./actions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false });

type InputMode = "car" | "coordinates" | "polygon";
type GeoJSONLike = {
  type: string;
  [key: string]: unknown;
};

export default function AnaliseAmbientalPage() {
  const { firestore, user } = useFirebase();
  const { data: brandingData } = useLocalBranding();
  const [inputMode, setInputMode] = React.useState<InputMode>("car");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [isExportingCsv, setIsExportingCsv] = React.useState(false);
  const [isExportingGeojson, setIsExportingGeojson] = React.useState(false);
  const [analysisResult, setAnalysisResult] =
    React.useState<AnaliseAmbientalOutput | null>(null);
  const [carNumber, setCarNumber] = React.useState("");
  const [coordinateInput, setCoordinateInput] = React.useState("");
  const [polygonInput, setPolygonInput] = React.useState("");
  const [drawnPolygon, setDrawnPolygon] = React.useState<GeoJSONLike | null>(null);
  const [lastPayload, setLastPayload] = React.useState("");
  const { toast } = useToast();

  const hasValidInput = React.useMemo(() => {
    if (inputMode === "car") return carNumber.trim().length > 3;
    if (inputMode === "coordinates") return coordinateInput.trim().length > 3;
    return polygonInput.trim().length > 3 || !!drawnPolygon;
  }, [carNumber, coordinateInput, drawnPolygon, inputMode, polygonInput]);

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
    return null;
  }, [carNumber, coordinateInput, inputMode, serializedPolygon]);

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

  const saveAnalysisSnapshot = React.useCallback(
    async (input: AnaliseAmbientalInput, output: AnaliseAmbientalOutput) => {
      if (!firestore || !user?.uid) return;
      try {
        await addDoc(collection(firestore, "geo_analyses"), {
          createdAt: serverTimestamp(),
          createdBy: user.uid,
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
      const actionResult = await handleAnalyseArea(input);
      if (!actionResult.success) {
        throw new Error(actionResult.error);
      }
      const result = actionResult.result;
      setAnalysisResult(result);
      await saveAnalysisSnapshot(input, result);
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
    if (!analysisResult || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const session = await createMmBrandedPdfSession(
        brandingUrlsFromLocal(brandingData),
      );
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
        const lines = doc.splitTextToSize(item.relatorio, pageW - margins.left - margins.right);
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

      session.finalize();
      doc.save(
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
      description="À esquerda, desenhe ou capture no mapa; à direita, escolha CAR, coordenadas ou polígono, execute a análise com IA e exporte PDF, CSV ou GeoJSON."
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
                em Elaboração de estudos.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Iniciar Análise com IA</CardTitle>
              <CardDescription>
                Selecione o tipo de entrada e inicie a análise geoespacial com base em dados públicos.
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
                onClick={handleStartAnalysis}
                disabled={isLoading || !hasValidInput}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar relatório de análise geoespacial
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
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="mb-3 h-10 w-10 animate-spin" />
                  <p className="text-sm">
                    Processando dados e gerando análise geoespacial...
                  </p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-4">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {analysisResult.resumoIA}
                  </p>
                  <div className="rounded-md border p-3">
                    <p className="mb-2 text-sm font-medium">Evidências factuais</p>
                    <div className="space-y-2">
                      {analysisResult.factualData.map((item, idx) => (
                        <p key={`${item.camada}-${idx}`} className="text-xs text-muted-foreground">
                          {idx + 1}. {item.camada} ({item.fonte}) - {item.resultado}
                        </p>
                      ))}
                    </div>
                  </div>
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
                    <Button asChild variant="secondary" className="w-full">
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
                    Configure CAR, coordenadas ou polígono nos cartões ao lado e
                    clique em &quot;Gerar relatório de análise geoespacial&quot;.
                    O PDF ficará disponível aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      }
    />
  );
}
