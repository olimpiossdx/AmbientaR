"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2, FileDown, FileText, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  serverTimestamp,
  where,
  limit,
} from "firebase/firestore";
import type {
  GeoAnalysisComplementOutput,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";
import { handleGeoAnalysisComplement } from "@/app/(app)/analise-ambiental/actions-complement";
import { AiProviderBadge } from "@/components/ai/ai-provider-badge";
import type { AiProviderId } from "@/lib/ai-provider-labels";
import { GeoWaveALayerCards } from "@/components/geospatial/geo-wave-a-layer-cards";
import { useLocalBranding } from "@/hooks/use-local-branding";
import {
  prepareIaMenuBrandedPdfSession,
  saveIaMenuBrandedPdf,
} from "@/lib/ia-menu-branded-pdf";
import { appendGeoAnalysisComplementPdf } from "@/lib/geospatial/export-complement-pdf";
import { buildComplementDocxBlob } from "@/lib/geospatial/export-complement-docx";
import {
  brandingUrlsFromLocal,
  guardBrandingExportFromHook,
  reportBrandingPdfIssues,
} from "@/lib/pdf-branding-layout";
import {
  SESSION_GEO_ANALYSIS_ID,
  isSessionGeoAnalysisId,
} from "@/lib/geospatial/geo-analysis-session";

type GeoAnalysisDoc = {
  id: string;
  wave?: string;
  factualSummary?: string;
  perimeter?: WaveAAnalysisResult["perimeter"];
  layers?: WaveAAnalysisResult["layers"];
  generatedAtUtc?: string;
  createdAt?: unknown;
};

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function createdAtMs(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "object" && v !== null && "toMillis" in v) {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (typeof v === "string") return Date.parse(v) || 0;
  return 0;
}

function formatAnalysisLabel(a: GeoAnalysisDoc, isSession?: boolean): string {
  const ha = a.perimeter?.areaHa;
  const ok = a.layers?.filter((l) => l.status === "ok").length ?? 0;
  const total = a.layers?.length ?? 8;
  const date = a.generatedAtUtc?.slice(0, 10) ?? "";
  const area = ha != null ? `${ha.toFixed(0)} ha` : "— ha";
  const prefix = isSession ? "Sessão actual · " : "";
  return `${prefix}${area} · ${ok}/${total} OK${date ? ` · ${date}` : ""}`;
}

function docToWaveResult(
  data: Record<string, unknown>,
  wave: "A" | "ABC",
): WaveAAnalysisResult {
  return {
    wave,
    generatedAtUtc: (data.generatedAtUtc as string) ?? new Date().toISOString(),
    perimeter: data.perimeter as WaveAAnalysisResult["perimeter"],
    layers: data.layers as WaveAAnalysisResult["layers"],
    factualSummary: (data.factualSummary as string) ?? "",
    fontesConsultadas:
      (data.fontesConsultadas as WaveAAnalysisResult["fontesConsultadas"]) ?? [],
  };
}

export function GeoAnalysisComplementPanel({
  userId,
  initialGeoAnalysisId,
  inlineWaveResult,
}: {
  userId: string;
  initialGeoAnalysisId?: string | null;
  inlineWaveResult?: WaveAAnalysisResult | null;
}) {
  const { firestore } = useFirebase();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();
  const [analyses, setAnalyses] = React.useState<GeoAnalysisDoc[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [loadedWave, setLoadedWave] = React.useState<WaveAAnalysisResult | null>(
    null,
  );
  const [complement, setComplement] =
    React.useState<GeoAnalysisComplementOutput | null>(null);
  const [complementProvider, setComplementProvider] =
    React.useState<AiProviderId | null>(null);
  const [loadingList, setLoadingList] = React.useState(true);
  const [loadingDoc, setLoadingDoc] = React.useState(false);
  const [loadingComplement, setLoadingComplement] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const [exportingDocx, setExportingDocx] = React.useState(false);
  const [factualOpen, setFactualOpen] = React.useState(true);

  const sessionOnly =
    !!inlineWaveResult &&
    isSessionGeoAnalysisId(selectedId || initialGeoAnalysisId) &&
    !analyses.some((a) => a.id === selectedId);

  React.useEffect(() => {
    const load = async () => {
      if (!firestore || !userId) {
        setLoadingList(false);
        return;
      }
      try {
        const snap = await getDocs(
          query(
            collection(firestore, "geo_analyses"),
            where("createdBy", "==", userId),
            limit(40),
          ),
        );
        const items = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<GeoAnalysisDoc, "id">),
          }))
          .filter((a) => a.wave === "A" || a.wave === "ABC")
          .sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt))
          .slice(0, 20);
        setAnalyses(items);
        const fromUrl = searchParams?.get("geoAnalysisId");
        if (fromUrl && (items.some((i) => i.id === fromUrl) || fromUrl === initialGeoAnalysisId)) {
          setSelectedId(fromUrl);
        } else if (initialGeoAnalysisId) {
          setSelectedId(initialGeoAnalysisId);
        } else if (inlineWaveResult) {
          setSelectedId(SESSION_GEO_ANALYSIS_ID);
        } else if (items[0]) {
          setSelectedId(items[0].id);
        }
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Erro ao listar análises",
          description:
            "Verifique permissões Firestore ou tente recarregar a página.",
        });
      } finally {
        setLoadingList(false);
      }
    };
    void load();
  }, [firestore, userId, searchParams, toast, initialGeoAnalysisId, inlineWaveResult]);

  React.useEffect(() => {
    if (inlineWaveResult && initialGeoAnalysisId) {
      setLoadedWave(inlineWaveResult);
      setSelectedId(initialGeoAnalysisId);
    }
  }, [inlineWaveResult, initialGeoAnalysisId]);

  React.useEffect(() => {
    const loadOne = async () => {
      if (
        inlineWaveResult &&
        (selectedId === initialGeoAnalysisId ||
          isSessionGeoAnalysisId(selectedId))
      ) {
        setLoadedWave(inlineWaveResult);
        return;
      }
      if (!firestore || !selectedId) {
        setLoadedWave(null);
        return;
      }
      setLoadingDoc(true);
      try {
        const snap = await getDoc(doc(firestore, "geo_analyses", selectedId));
        if (!snap.exists()) {
          setLoadedWave(null);
          return;
        }
        const data = snap.data();
        if ((data.wave !== "A" && data.wave !== "ABC") || !data.perimeter || !data.layers) {
          setLoadedWave(null);
          return;
        }
        setLoadedWave(
          docToWaveResult(data, data.wave === "ABC" ? "ABC" : "A"),
        );
      } finally {
        setLoadingDoc(false);
      }
    };
    void loadOne();
  }, [firestore, selectedId, inlineWaveResult, initialGeoAnalysisId]);

  React.useEffect(() => {
    const loadSavedComplement = async () => {
      if (
        !firestore ||
        !selectedId ||
        !userId ||
        isSessionGeoAnalysisId(selectedId)
      ) {
        setComplement(null);
        return;
      }
      setLoadingComplement(true);
      try {
        const snap = await getDocs(
          query(
            collection(firestore, "geo_analysis_complements"),
            where("geoAnalysisId", "==", selectedId),
            limit(15),
          ),
        );
        type ComplementRow = Record<string, unknown> & { id: string };
        const row = snap.docs
          .map(
            (d): ComplementRow => ({
              id: d.id,
              ...(d.data() as Record<string, unknown>),
            }),
          )
          .filter((c) => c.createdBy === userId)
          .sort(
            (a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt),
          )[0];
        if (!row?.sections) {
          setComplement(null);
          return;
        }
        setComplement({
          geoAnalysisId: selectedId,
          sections: row.sections as GeoAnalysisComplementOutput["sections"],
          resumoExecutivo: row.resumoExecutivo as string,
          status: (row.status as GeoAnalysisComplementOutput["status"]) ?? "rascunho_ia",
          generatedAtUtc:
            (row.generatedAtUtc as string) ?? new Date().toISOString(),
          disclaimer: row.disclaimer as string,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingComplement(false);
      }
    };
    void loadSavedComplement();
  }, [firestore, selectedId, userId]);

  const handleGenerateComplement = async () => {
    if (!loadedWave || !selectedId) return;
    setGenerating(true);
    try {
      const result = await handleGeoAnalysisComplement({
        geoAnalysisId: selectedId,
        waveResult: loadedWave,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      setComplement(result.result);
      setComplementProvider(result.provider);
      if (firestore && userId && !isSessionGeoAnalysisId(selectedId)) {
        const { geoAnalysisId: _gid, ...complementFields } = result.result;
        await addDoc(collection(firestore, "geo_analysis_complements"), {
          createdAt: serverTimestamp(),
          createdBy: userId,
          geoAnalysisId: selectedId,
          ...complementFields,
        });
      }
      toast({
        title: "Complemento gerado",
        description: `Rascunho com ${result.provider === "deepseek" ? "DeepSeek" : "Gemini"}. Revise antes de usar em estudos.`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro na Etapa 2",
        description: e instanceof Error ? e.message : "Falha ao gerar complemento.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportComplementPdf = async () => {
    if (!complement || !loadedWave) return;
    setExportingPdf(true);
    try {
      const session = await prepareIaMenuBrandedPdfSession({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
      });
      if (!session) return;

      appendGeoAnalysisComplementPdf(session, loadedWave, complement);
      saveIaMenuBrandedPdf(
        session,
        `etapa2-geoespacial-${loadedWave.perimeter.areaHa.toFixed(0)}ha-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    if (!complement || !loadedWave) return;
    if (
      !guardBrandingExportFromHook({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
        formatLabel: "Word",
      })
    ) {
      return;
    }
    const images = pdfImages ?? {
      headerBase64: null,
      footerBase64: null,
      watermarkBase64: null,
    };
    reportBrandingPdfIssues(brandingUrlsFromLocal(brandingData), images, toast);
    setExportingDocx(true);
    try {
      const blob = await buildComplementDocxBlob(
        complement,
        {
          areaHa: loadedWave.perimeter.areaHa,
          generatedAtUtc: complement.generatedAtUtc,
          factualSummary: loadedWave.factualSummary,
          layers: loadedWave.layers,
        },
        images,
      );
      downloadBlob(
        `etapa2-geoespacial-${new Date().toISOString().slice(0, 10)}.docx`,
        blob,
      );
    } finally {
      setExportingDocx(false);
    }
  };

  const canShow = analyses.length > 0 || !!inlineWaveResult;

  const selectOptions: { id: string; label: string }[] = analyses.map((a) => ({
    id: a.id,
    label: formatAnalysisLabel(a),
  }));
  if (sessionOnly) {
    selectOptions.unshift({
      id: selectedId || SESSION_GEO_ANALYSIS_ID,
      label: formatAnalysisLabel(
        {
          id: selectedId || SESSION_GEO_ANALYSIS_ID,
          perimeter: inlineWaveResult!.perimeter,
          layers: inlineWaveResult!.layers,
          generatedAtUtc: inlineWaveResult!.generatedAtUtc,
        },
        true,
      ),
    });
  }

  return (
    <Card id="etapa-2" className="mb-6 border-primary/30">
      <CardHeader>
        <CardTitle>Etapa 2 — Complementação geoespacial (IA)</CardTitle>
        <CardDescription>
          Revise os dados factuais (8 camadas SIG), gere o rascunho interpretativo e exporte PDF
          completo (factual + IA) ou Word.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingList ? (
          <p className="text-sm text-muted-foreground">Carregando análises...</p>
        ) : !canShow ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma análise factual salva. Gere primeiro o relatório factual (8 camadas) acima.
          </p>
        ) : (
          <div className="space-y-2">
            <Label>Análise factual</Label>
            {selectOptions.length > 1 ? (
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {selectOptions[0]?.label ?? "Análise seleccionada"}
              </p>
            )}
          </div>
        )}

        {loadingDoc ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : loadedWave ? (
          <>
            <p className="text-xs text-muted-foreground">
              Área {loadedWave.perimeter.areaHa.toFixed(2)} ha ·{" "}
              {loadedWave.layers.filter((l) => l.status === "ok").length}/
              {loadedWave.layers.length} camadas OK
              {loadedWave.perimeter.source === "shp" ? " · SHP" : ""}
            </p>
            <Collapsible open={factualOpen} onOpenChange={setFactualOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between px-2">
                  Pré-visualização factual (sem IA)
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${factualOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <p className="mb-2 text-xs text-muted-foreground line-clamp-3">
                  {loadedWave.factualSummary}
                </p>
                <GeoWaveALayerCards
                  layers={loadedWave.layers}
                  className="grid max-h-[320px] gap-2 overflow-y-auto sm:grid-cols-2"
                />
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : null}

        <Button
          onClick={handleGenerateComplement}
          disabled={!loadedWave || generating}
          className="w-full sm:w-auto"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando complemento...
            </>
          ) : (
            "Gerar complemento (Gemini)"
          )}
        </Button>

        {loadingComplement ? (
          <p className="text-xs text-muted-foreground">A carregar complemento salvo...</p>
        ) : null}

        {complement ? (
          <div className="space-y-3 rounded-md border p-3">
            {complementProvider ? (
              <AiProviderBadge provider={complementProvider} />
            ) : null}
            <p className="text-sm font-medium">{complement.resumoExecutivo}</p>
            {complement.sections.map((s) => (
              <div key={s.key}>
                <p className="text-xs font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-4">
                  {s.bodyMarkdown}
                </p>
              </div>
            ))}
            <p className="text-[10px] italic text-muted-foreground">
              {complement.disclaimer}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleExportComplementPdf}
                disabled={exportingPdf}
              >
                {exportingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                PDF completo (SIG + IA)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportDocx}
                disabled={exportingDocx}
              >
                {exportingDocx ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Word (.docx)
              </Button>
            </div>
          </div>
        ) : loadedWave ? (
          <p className="text-xs text-muted-foreground">
            Ainda sem complemento para esta análise. Gere com IA ou seleccione outra análise que já
            tenha rascunho salvo.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
