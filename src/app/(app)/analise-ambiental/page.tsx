"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Globe, FileDown, Database, Share2 } from "lucide-react";
import { analyseArea } from "@/ai/flows/analise-ambiental-flow";
import type {
  AnaliseAmbientalOutput,
  AnaliseAmbientalInput,
} from "@/lib/types/analise-ambiental";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebase } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false });

type InputMode = "car" | "coordinates" | "polygon";
type GeoJSONLike = {
  type: string;
  [key: string]: unknown;
};

/** Adiciona numeração de páginas no rodapé no formato página/total. */
function addPageNumbers(doc: any, bottomMarginMm: number = 10) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${i}/${pageCount}`,
      pageWidth - bottomMarginMm,
      pageHeight - bottomMarginMm,
      { align: "right" },
    );
  }
}

export default function AnaliseAmbientalPage() {
  const { firestore, user } = useFirebase();
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
  const [iframeError, setIframeError] = React.useState(false);
  const [iframeLoading, setIframeLoading] = React.useState(true);
  const [iframeKey, setIframeKey] = React.useState(0);
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
      const result = await analyseArea(input);
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
      const mod = await import("jspdf");
      const jsPDF = mod.default;

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const margin = 15;
      const pageW = doc.internal.pageSize.getWidth();
      let y = margin;

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
        pageW - 2 * margin,
      );
      doc.text(resumoLines, margin, y);
      y += resumoLines.length * 6 + 8;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Evidências factuais", margin, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      analysisResult.factualData.forEach((item, index) => {
        const line = `${index + 1}. ${item.camada} | ${item.fonte} | ${item.resultado}`;
        const lines = doc.splitTextToSize(line, pageW - 2 * margin);
        for (const l of lines) {
          if (y > 270) {
            doc.addPage();
            y = margin;
          }
          doc.text(l, margin, y);
          y += 5;
        }
      });
      y += 6;

      const lineHeight = 5;
      const maxY = 280;
      analysisResult.analises.forEach((item) => {
        if (y > maxY - 20) {
          doc.addPage();
          y = margin;
        }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(item.titulo, margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(item.relatorio, pageW - 2 * margin);
        for (const line of lines) {
          if (y > maxY - 10) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        }
        y += 6;
      });

      // Numeração de páginas alinhada à direita no rodapé.
      addPageNumbers(doc, 10);
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
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <PageHeader title="Análise Ambiental Geoespacial com IA" />
      <main className="mx-auto flex w-full max-w-5xl min-w-0 flex-1 flex-col gap-6 overflow-auto p-4 md:p-6">
        {/* 1. Geovizualizador - card maior */}
        <Card className="flex min-w-0 flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Geovizualizador IDE-SisemaNet</CardTitle>
            <CardDescription>
              Use o mapa para explorar, localizar imóvel pelo CAR ou desenhar
              polígono. Copie os dados (número CAR, coordenadas, etc.) e cole no
              card &quot;Iniciar Análise com IA&quot; abaixo — esses dados serão
              enviados para a análise geoespacial com IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[60dvh] flex-1 p-0">
            {iframeError ? (
              <div className="flex h-[60dvh] min-h-[420px] flex-col items-center justify-center px-6 text-center md:h-[62vh]">
                <p className="text-sm font-medium text-destructive mb-2">
                  Não foi possível carregar o Geovizualizador.
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Se o serviço estiver fora do ar, tente novamente em instantes
                  ou faça a análise pelo texto/manualmente.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIframeError(false);
                    setIframeLoading(true);
                    setIframeKey((k) => k + 1);
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="relative h-[60dvh] min-h-[420px] w-full max-w-full md:h-[62vh]">
                {iframeLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <p className="text-sm">Carregando Geovizualizador...</p>
                    </div>
                  </div>
                )}
                <iframe
                  key={iframeKey}
                  src="https://visualizador.idesisema.meioambiente.mg.gov.br/"
                  className="h-[60dvh] min-h-[420px] w-full max-w-full rounded-b-lg border-0 md:h-[62vh]"
                  title="IDE-SisemaNet Geoviewer"
                  onLoad={() => {
                    setIframeLoading(false);
                    setIframeError(false);
                  }}
                  onError={() => {
                    setIframeLoading(false);
                    setIframeError(true);
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Captura por coordenada/polígono</CardTitle>
            <CardDescription>
              Desenhe um polígono para usar na análise ou capture coordenadas automáticas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[320px] overflow-hidden rounded-md border">
              <LeafletMap polygon={drawnPolygon} onPolygonCreated={setDrawnPolygon} />
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

        <Card>
          <CardHeader>
            <CardTitle>Iniciar Análise com IA</CardTitle>
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

        {/* 3. Relatório - card compacto, download PDF */}
        <Card>
          <CardHeader>
            <CardTitle>Relatório da Análise</CardTitle>
            <CardDescription>
              Quando o relatório for gerado, ele ficará disponível para download
              em PDF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin mb-3" />
                <p className="text-sm">
                  Processando dados e gerando análise geoespacial...
                </p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="w-full sm:w-auto"
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
                    className="w-full sm:w-auto"
                  >
                    {isExportingCsv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                    Exportar CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadGeoJson}
                    disabled={isExportingGeojson}
                    className="w-full sm:w-auto"
                  >
                    {isExportingGeojson ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                    Exportar GeoJSON
                  </Button>
                  <Button asChild variant="secondary" className="w-full sm:w-auto">
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
                <Globe className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">
                  Use o Geovizualizador, cole os dados no card acima e clique em
                  &quot;Gerar relatório de análise geoespacial&quot;. O PDF
                  ficará disponível aqui.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
