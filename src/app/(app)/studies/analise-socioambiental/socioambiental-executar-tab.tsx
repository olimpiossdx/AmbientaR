"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { useLocalBranding } from "@/hooks/use-local-branding";
import { collection, addDoc } from "firebase/firestore";
import {
  Loader2,
  Save,
  Play,
  Globe,
  FileDown,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import { DEFAULT_INFLUENCE_CONFIG } from "@/lib/geospatial/influence-areas";
import { runWaveAAnalysisStreamClient } from "@/lib/geospatial/run-wave-a-stream-client";
import type {
  GeoAnalysisComplementOutput,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";
import { GeoWaveALayerCards } from "@/components/geospatial/geo-wave-a-layer-cards";
import { SocioambientalReportPicker } from "@/components/socioambiental/socioambiental-report-picker";
import {
  getBlocksForBiomaPreset,
  getBiomaPreset,
  resolveLayerIdsFromBlocks,
  SOCIOAMBIENTAL_BIOMA_PRESETS,
  type SocioambientalBiomaPresetId,
  type SocioambientalReportBlockId,
} from "@/lib/socioambiental/report-blocks-catalog";
import { mapLayersToCriterios } from "@/lib/socioambiental/map-layers-to-criterios";
import { downloadSocioambientalExtratoPdf } from "@/lib/socioambiental/export-socioambiental-pdf";
import { SESSION_GEO_ANALYSIS_ID } from "@/lib/geospatial/geo-analysis-session";
import { AI_PROVIDER_META, type AiProviderId } from "@/lib/ai-provider-labels";
import { AiProviderBadge } from "@/components/ai/ai-provider-badge";

const LeafletMap = dynamic(
  () => import("@/app/(app)/analise-ambiental/leaflet-map"),
  { ssr: false },
);

type GeoJSONLike = {
  type: string;
  [key: string]: unknown;
};

type InputMode = "car" | "polygon";

function criterioBadgeVariant(
  resultado: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (resultado === "Apto") return "default";
  if (resultado === "Inapto") return "destructive";
  return "secondary";
}

export function SocioambientalExecutarTab() {
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const brandingCtx = useLocalBranding();

  const [inputMode, setInputMode] = React.useState<InputMode>("car");
  const [carNumber, setCarNumber] = React.useState("");
  const [polygonInput, setPolygonInput] = React.useState("");
  const [drawnPolygon, setDrawnPolygon] = React.useState<GeoJSONLike | null>(
    null,
  );
  const [tituloExtrato, setTituloExtrato] = React.useState("");
  const [biomaPreset, setBiomaPreset] =
    React.useState<SocioambientalBiomaPresetId>("mg_padrao");
  const [selectedBlocks, setSelectedBlocks] = React.useState<
    SocioambientalReportBlockId[]
  >(() => getBlocksForBiomaPreset("mg_padrao"));

  const [includeParecerIa, setIncludeParecerIa] = React.useState(false);
  const [iaProvider, setIaProvider] = React.useState<AiProviderId>("gemini");
  const [complement, setComplement] =
    React.useState<GeoAnalysisComplementOutput | null>(null);
  const [complementProvider, setComplementProvider] =
    React.useState<AiProviderId | null>(null);
  const [isGeneratingIa, setIsGeneratingIa] = React.useState(false);

  const [isRunning, setIsRunning] = React.useState(false);
  const [layersDone, setLayersDone] = React.useState(0);
  const [layersTotal, setLayersTotal] = React.useState(0);
  const [waveResult, setWaveResult] = React.useState<WaveAAnalysisResult | null>(
    null,
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const handleBiomaPresetChange = (presetId: SocioambientalBiomaPresetId) => {
    setBiomaPreset(presetId);
    setSelectedBlocks(getBlocksForBiomaPreset(presetId));
  };

  const serializedPolygon = React.useMemo(() => {
    if (drawnPolygon) return JSON.stringify(drawnPolygon);
    return polygonInput.trim();
  }, [drawnPolygon, polygonInput]);

  const perimeterInput = React.useMemo((): PerimeterParseInput | null => {
    if (inputMode === "car" && carNumber.trim().length > 3) {
      return { dataType: "car", data: carNumber.trim() };
    }
    if (inputMode === "polygon" && serializedPolygon.length > 3) {
      return { dataType: "polygon", data: serializedPolygon };
    }
    return null;
  }, [carNumber, inputMode, serializedPolygon]);

  const layerIds = React.useMemo(
    () => resolveLayerIdsFromBlocks(selectedBlocks),
    [selectedBlocks],
  );

  const criterios = React.useMemo(() => {
    if (!waveResult) return null;
    return mapLayersToCriterios(waveResult.layers, selectedBlocks);
  }, [waveResult, selectedBlocks]);

  const biomaPresetLabel = getBiomaPreset(biomaPreset).label;

  const generateComplement = async (result: WaveAAnalysisResult) => {
    if (!auth?.currentUser) return;
    setIsGeneratingIa(true);
    setComplement(null);
    setComplementProvider(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/geo-analyses/complement", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          geoAnalysisId: SESSION_GEO_ANALYSIS_ID,
          waveResult: result,
          provider: iaProvider,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        result?: GeoAnalysisComplementOutput;
        provider?: AiProviderId;
      };
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setComplement(data.result ?? null);
      setComplementProvider(data.provider ?? iaProvider);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Parecer IA não gerado",
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsGeneratingIa(false);
    }
  };

  const handleRun = async () => {
    if (!perimeterInput) {
      toast({
        variant: "destructive",
        title: "Perímetro obrigatório",
        description: "Informe o CAR ou desenhe/cole um polígono.",
      });
      return;
    }
    if (selectedBlocks.length === 0) {
      toast({
        variant: "destructive",
        title: "Selecione ao menos um bloco",
        description: "Marque os relatórios que deseja consultar.",
      });
      return;
    }
    if (!auth?.currentUser) {
      toast({ variant: "destructive", title: "Faça login para continuar." });
      return;
    }

    setIsRunning(true);
    setWaveResult(null);
    setComplement(null);
    setComplementProvider(null);
    setLayersDone(0);
    setLayersTotal(layerIds.length);

    try {
      const token = await auth.currentUser.getIdToken();
      const result = await runWaveAAnalysisStreamClient(
        token,
        perimeterInput,
        DEFAULT_INFLUENCE_CONFIG,
        (event) => {
          if (event.type === "layer") {
            setLayersDone(event.index + 1);
            setLayersTotal(event.total);
          }
        },
        { layerIds },
      );
      setWaveResult(result);
      toast({
        title: "Pacote concluído",
        description: `${result.layers.length} camada(s) consultada(s).`,
      });

      if (includeParecerIa) {
        await generateComplement(result);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha na consulta",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível executar o pacote socioambiental.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveExtrato = async () => {
    if (!firestore || !auth?.currentUser || !waveResult || !criterios) return;
    setIsSaving(true);
    try {
      const titulo =
        tituloExtrato.trim() ||
        `Extrato socioambiental — ${new Date().toLocaleDateString("pt-BR")}`;
      await addDoc(collection(firestore, "analisesSocioambientais"), {
        titulo,
        dataEmissao: new Date().toISOString().slice(0, 10),
        informacoesPropriedade: {
          areaCalculadaHa: waveResult.perimeter.areaHa,
          cardoc: inputMode === "car" ? carNumber.trim() : undefined,
          bioma: biomaPresetLabel,
        },
        agentes: [],
        criteriosResultados: criterios.criteriosResultados,
        detalhesAnalise: criterios.detalhesAnalise,
        pacoteBlocos: selectedBlocks,
        biomaPreset,
        ...(complement
          ? {
              parecerIaResumo: complement.resumoExecutivo,
              parecerIaProvider: complementProvider,
            }
          : {}),
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Extrato salvo",
        description: "O resultado foi registrado na lista de extratos.",
      });
      setTituloExtrato("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!waveResult || !criterios) return;
    setIsExportingPdf(true);
    try {
      const titulo =
        tituloExtrato.trim() ||
        `Extrato socioambiental — ${new Date().toLocaleDateString("pt-BR")}`;
      const ok = await downloadSocioambientalExtratoPdf(
        {
          titulo,
          dataEmissao: new Date().toISOString().slice(0, 10),
          areaHa: waveResult.perimeter.areaHa,
          car: inputMode === "car" ? carNumber.trim() : undefined,
          biomaLabel: biomaPresetLabel,
          pacoteBlocos: selectedBlocks,
          criteriosResultados: criterios.criteriosResultados,
          detalhesAnalise: criterios.detalhesAnalise,
          layers: waveResult.layers,
          complement,
        },
        {
          brandingData: brandingCtx.data,
          pdfImages: brandingCtx.pdfImages,
          isPdfImagesLoading: brandingCtx.isPdfImagesLoading,
          hasBrandingUrls: brandingCtx.hasBrandingUrls,
          toast,
        },
      );
      if (ok) {
        toast({ title: "PDF exportado", description: "Extrato socioambiental." });
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const busy = isRunning || isGeneratingIa;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Executar pacote socioambiental</CardTitle>
          <CardDescription>
            Escolha o preset de bioma, marque os blocos de relatório e gere o
            extrato com critérios Apto/Inapto. Opcionalmente inclua parecer IA e
            exporte PDF consolidado. Análise completa (todas as camadas):{" "}
            <Link
              href="/analise-ambiental"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Análise Geoespacial (IA)
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Preset de bioma / pacote</Label>
            <Select
              value={biomaPreset}
              onValueChange={(v) =>
                handleBiomaPresetChange(v as SocioambientalBiomaPresetId)
              }
              disabled={busy}
            >
              <SelectTrigger className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOCIOAMBIENTAL_BIOMA_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getBiomaPreset(biomaPreset).description}
            </p>
          </div>

          <SocioambientalReportPicker
            selected={selectedBlocks}
            onChange={setSelectedBlocks}
            disabled={busy}
          />

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="include-parecer-ia"
                checked={includeParecerIa}
                onCheckedChange={(v) => setIncludeParecerIa(v === true)}
                disabled={busy}
              />
              <div className="space-y-1">
                <Label htmlFor="include-parecer-ia" className="cursor-pointer">
                  Incluir parecer técnico (IA) após a consulta
                </Label>
                <p className="text-xs text-muted-foreground">
                  Gera rascunho interpretativo com base nas camadas consultadas
                  (não altera os critérios Apto/Inapto).
                </p>
              </div>
            </div>
            {includeParecerIa && (
              <div className="pl-7 space-y-1">
                <Label className="text-xs">Provedor IA</Label>
                <Select
                  value={iaProvider}
                  onValueChange={(v) => setIaProvider(v as AiProviderId)}
                  disabled={busy}
                >
                  <SelectTrigger className="max-w-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(AI_PROVIDER_META) as AiProviderId[]).map(
                      (id) => (
                        <SelectItem key={id} value={id}>
                          {AI_PROVIDER_META[id].label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Perímetro do imóvel</Label>
            <Select
              value={inputMode}
              onValueChange={(v) => setInputMode(v as InputMode)}
              disabled={busy}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">Número do CAR</SelectItem>
                <SelectItem value="polygon">Polígono (mapa ou GeoJSON)</SelectItem>
              </SelectContent>
            </Select>

            {inputMode === "car" ? (
              <Input
                placeholder="Ex: MG-3100000-XXXX..."
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value)}
                disabled={busy}
              />
            ) : (
              <div className="space-y-3">
                <div className="h-[280px] overflow-hidden rounded-lg border">
                  <LeafletMap
                    adaPolygon={drawnPolygon}
                    onAdaChange={setDrawnPolygon}
                  />
                </div>
                <Textarea
                  placeholder='Ou cole GeoJSON Feature/Polygon ({"type":"Polygon",...})'
                  value={polygonInput}
                  onChange={(e) => setPolygonInput(e.target.value)}
                  rows={3}
                  disabled={busy}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-1">
              <Label htmlFor="titulo-extrato">Título do extrato</Label>
              <Input
                id="titulo-extrato"
                placeholder="Nome da propriedade / tomador"
                value={tituloExtrato}
                onChange={(e) => setTituloExtrato(e.target.value)}
                disabled={busy}
              />
            </div>
            <Button
              onClick={() => void handleRun()}
              disabled={busy || !perimeterInput || selectedBlocks.length === 0}
              className="gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isGeneratingIa ? (
                <Sparkles className="h-4 w-4 animate-pulse" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning
                ? `Consultando (${layersDone}/${layersTotal})…`
                : isGeneratingIa
                  ? "Gerando parecer IA…"
                  : `Executar (${layerIds.length} camadas)`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {criterios && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">Critérios do extrato</CardTitle>
                <CardDescription>
                  Resultado automático por bloco (
                  {waveResult?.perimeter.areaHa.toFixed(2)} ha no recorte).
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isExportingPdf}
                  onClick={() => void handleExportPdf()}
                >
                  {isExportingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  PDF consolidado
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isSaving}
                  onClick={() => void handleSaveExtrato()}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar extrato
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {criterios.criteriosResultados.map((c) => (
              <div
                key={c.criterio}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.criterio}</p>
                  {c.detalhe ? (
                    <p className="text-xs text-muted-foreground">{c.detalhe}</p>
                  ) : null}
                </div>
                <Badge variant={criterioBadgeVariant(c.resultado)}>
                  {c.resultado}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {complement && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">Parecer técnico (IA)</CardTitle>
              {complementProvider ? (
                <AiProviderBadge provider={complementProvider} />
              ) : null}
            </div>
            <CardDescription>{complement.resumoExecutivo}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {complement.sections.map((section) => (
              <Collapsible key={section.key}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-medium hover:bg-muted/50">
                  {section.title}
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                  {section.bodyMarkdown}
                </CollapsibleContent>
              </Collapsible>
            ))}
            <p className="text-[11px] text-muted-foreground pt-2">
              {complement.disclaimer}
            </p>
          </CardContent>
        </Card>
      )}

      {waveResult && !includeParecerIa && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isGeneratingIa}
            onClick={() => void generateComplement(waveResult)}
          >
            {isGeneratingIa ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Gerar parecer IA agora
          </Button>
        </div>
      )}

      {waveResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              Detalhe por camada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GeoWaveALayerCards layers={waveResult.layers} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
