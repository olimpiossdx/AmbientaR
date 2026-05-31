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
import { Loader2, ChevronDown, Sparkles } from "lucide-react";
import type { AiProviderId } from "@/lib/ai-provider-labels";
import { AI_PROVIDER_META } from "@/lib/ai-provider-labels";
import { GeoAnalysisExportPanel } from "@/components/geospatial/geo-analysis-export-panel";
import {
  buildGeoAnalysisListSummary,
} from "@/lib/geospatial/geo-analysis-summary";
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
import { fetchGeoAnalysisListClient } from "@/lib/geospatial/fetch-geo-analysis-list-client";
import {
  formatGeoAnalysisListLabel,
  type GeoAnalysisListSummary,
} from "@/lib/geospatial/geo-analysis-summary";
import type {
  GeoAnalysisComplementOutput,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";
import { AiProviderBadge } from "@/components/ai/ai-provider-badge";
import { GeoWaveALayerCards } from "@/components/geospatial/geo-wave-a-layer-cards";
import {
  SESSION_GEO_ANALYSIS_ID,
  isSessionGeoAnalysisId,
} from "@/lib/geospatial/geo-analysis-session";
import { WAVE_ALL_LAYER_COUNT } from "@/lib/geospatial/run-wave-a-analysis";

type GeoAnalysisListEntry = {
  id: string;
  listSummary: GeoAnalysisListSummary;
};

function createdAtMs(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "object" && v !== null && "toMillis" in v) {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (typeof v === "string") return Date.parse(v) || 0;
  return 0;
}

function formatAnalysisLabel(a: GeoAnalysisListEntry, isSession?: boolean): string {
  return formatGeoAnalysisListLabel(a.listSummary, {
    prefix: isSession ? "Sessão actual · " : undefined,
    date: a.listSummary.generatedAtUtc.slice(0, 10),
  });
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
  onComplementChange,
  includeSatelliteBackground = false,
  includeThematicWfs = true,
}: {
  userId: string;
  initialGeoAnalysisId?: string | null;
  inlineWaveResult?: WaveAAnalysisResult | null;
  onComplementChange?: (
    complement: GeoAnalysisComplementOutput | null,
    provider: AiProviderId | null,
  ) => void;
  includeSatelliteBackground?: boolean;
  includeThematicWfs?: boolean;
}) {
  const { firestore, auth } = useFirebase();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [analyses, setAnalyses] = React.useState<GeoAnalysisListEntry[]>([]);
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
  const [iaProvider, setIaProvider] = React.useState<AiProviderId>("gemini");
  const [geminiUnlimited, setGeminiUnlimited] = React.useState(true);
  const [factualOpen, setFactualOpen] = React.useState(true);

  React.useEffect(() => {
    onComplementChange?.(complement, complementProvider);
  }, [complement, complementProvider, onComplementChange]);

  React.useEffect(() => {
    const loadQuota = async () => {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) return;
      try {
        const res = await fetch("/api/geo-analyses/gemini-quota", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.usage) {
          setGeminiUnlimited(Boolean(data.usage.unlimited));
        }
      } catch {
        setGeminiUnlimited(true);
      }
    };
    void loadQuota();
  }, [auth]);

  const sessionOnly =
    !!inlineWaveResult &&
    isSessionGeoAnalysisId(selectedId || initialGeoAnalysisId) &&
    !analyses.some((a) => a.id === selectedId);

  React.useEffect(() => {
    const load = async () => {
      if (!userId) {
        setLoadingList(false);
        return;
      }
      try {
        const token = await auth?.currentUser?.getIdToken();
        let items: GeoAnalysisListEntry[] = [];
        if (token) {
          const rows = await fetchGeoAnalysisListClient(token, { limit: 20 });
          items = rows.map((r) => ({
            id: r.id,
            listSummary: r.listSummary,
          }));
        } else if (firestore) {
          const snap = await getDocs(
            query(
              collection(firestore, "geo_analyses"),
              where("createdBy", "==", userId),
              limit(20),
            ),
          );
          items = snap.docs
            .map((d) => {
              const data = d.data();
              if (data.wave !== "A" && data.wave !== "ABC") return null;
              const layers = (data.layers as WaveAAnalysisResult["layers"]) ?? [];
              const perimeter = data.perimeter as { areaHa?: number } | undefined;
              return {
                id: d.id,
                listSummary: {
                  areaHa: perimeter?.areaHa ?? 0,
                  okCount: layers.filter((l) => l.status === "ok").length,
                  totalLayers: layers.length || WAVE_ALL_LAYER_COUNT,
                  generatedAtUtc: (data.generatedAtUtc as string) ?? "",
                },
              };
            })
            .filter((a): a is GeoAnalysisListEntry => a != null && a.listSummary.areaHa > 0);
        }
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
  }, [auth, firestore, userId, searchParams, toast, initialGeoAnalysisId, inlineWaveResult]);

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
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão inválida.");

      const res = await fetch("/api/geo-analyses/complement", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          geoAnalysisId: selectedId,
          waveResult: loadedWave,
          provider: iaProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const result = data.result as GeoAnalysisComplementOutput;
      const provider = (data.provider as AiProviderId) ?? iaProvider;
      setComplement(result);
      setComplementProvider(provider);

      if (firestore && userId && !isSessionGeoAnalysisId(selectedId)) {
        const { geoAnalysisId: _gid, ...complementFields } = result;
        await addDoc(collection(firestore, "geo_analysis_complements"), {
          createdAt: serverTimestamp(),
          createdBy: userId,
          geoAnalysisId: selectedId,
          iaProvider: provider,
          ...complementFields,
        });
      }

      toast({
        title: "Complemento gerado",
        description: `Rascunho com ${AI_PROVIDER_META[provider].label}. Revise antes de usar em estudos.`,
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

  const canShow = analyses.length > 0 || !!inlineWaveResult;

  const selectOptions: { id: string; label: string }[] = analyses.map((a) => ({
    id: a.id,
    label: formatAnalysisLabel(a),
  }));
  if (sessionOnly && inlineWaveResult) {
    selectOptions.unshift({
      id: selectedId || SESSION_GEO_ANALYSIS_ID,
      label: formatAnalysisLabel(
        {
          id: selectedId || SESSION_GEO_ANALYSIS_ID,
          listSummary: buildGeoAnalysisListSummary({
            layers: inlineWaveResult.layers,
            perimeterAreaHa: inlineWaveResult.perimeter.areaHa,
            generatedAtUtc: inlineWaveResult.generatedAtUtc,
          }),
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
          Etapa opcional com tokens de IA. Gemini é gratuito (sem limite na app). DeepSeek usa o
          saldo pago da consultoria. Exportação (PDF, PNG, JPEG, Word) nos resultados acima.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingList ? (
          <p className="text-sm text-muted-foreground">Carregando análises...</p>
        ) : !canShow ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma análise factual salva. Gere primeiro o relatório factual ({WAVE_ALL_LAYER_COUNT} camadas) acima.
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="geo-ia-provider">Provedor IA (Etapa 2)</Label>
            <Select
              value={iaProvider}
              onValueChange={(v) => setIaProvider(v as AiProviderId)}
            >
              <SelectTrigger id="geo-ia-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">
                  Gemini — gratuito{geminiUnlimited ? "" : " (com teto administrativo)"}
                </SelectItem>
                <SelectItem value="deepseek">DeepSeek — saldo pago da consultoria</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {geminiUnlimited
                ? "Gemini: uso gratuito na Etapa 2 (custo Google conforme a sua conta API, sem bloqueio AmbientaR)."
                : "Gemini: existe teto mensal configurado no servidor (GEO_IA_GEMINI_MONTHLY_LIMIT)."}
            </p>
          </div>
        </div>

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
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar parecer IA (Etapa 2)
            </>
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
