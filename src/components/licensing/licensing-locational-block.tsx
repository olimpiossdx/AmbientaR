"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  inferCriterioLocacionalFromOverlay,
  type GeospatialOverlayForLocational,
} from "@/lib/licensing-locational";
import { useFirebase } from "@/firebase";
import { fetchApiWithAuth } from "@/lib/api-client-auth";

const LeafletMap = dynamic(() => import("@/app/(app)/analise-ambiental/leaflet-map"), {
  ssr: false,
});

type GeoJSONLike = { type: string; [key: string]: unknown };

export type LocationalInputMode = "car" | "polygon" | "coordinates" | "draw";

export type LocationalAnalysisPayload = {
  inputMode: LocationalInputMode;
  inputPreview: string;
  suggestedCriterio: "0" | "1" | "2";
  reasons: string[];
  analyzedAt: string;
};

type ApiAnalyzeResponse = {
  success?: boolean;
  overlay?: GeospatialOverlayForLocational;
  error?: string;
};

type LicensingLocationalBlockProps = {
  manualLock: boolean;
  onManualLockChange: (locked: boolean) => void;
  onSuggestedCriterio: (payload: LocationalAnalysisPayload) => void;
  /** Snapshot salvo no processo (edição ou após salvar). */
  savedAnalysis?: LocationalAnalysisPayload | null;
};

export function LicensingLocationalBlock({
  manualLock,
  onManualLockChange,
  onSuggestedCriterio,
  savedAnalysis,
}: LicensingLocationalBlockProps) {
  const { auth } = useFirebase();
  const { toast } = useToast();
  const [mode, setMode] = React.useState<LocationalInputMode>(
    savedAnalysis?.inputMode ?? "car",
  );
  const [textPayload, setTextPayload] = React.useState("");
  const [drawn, setDrawn] = React.useState<GeoJSONLike | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [lastPreview, setLastPreview] = React.useState<string | null>(
    savedAnalysis?.inputPreview ?? null,
  );

  React.useEffect(() => {
    if (savedAnalysis?.inputPreview) {
      setLastPreview(savedAnalysis.inputPreview);
    }
    if (savedAnalysis?.inputMode) {
      setMode(savedAnalysis.inputMode);
    }
  }, [savedAnalysis?.inputPreview, savedAnalysis?.inputMode]);

  const serializedDraw = React.useMemo(
    () => (drawn ? JSON.stringify(drawn) : ""),
    [drawn],
  );

  const buildDataForApi = (): { dataType: "car" | "polygon" | "coordinates"; data: string } | null => {
    if (mode === "car") {
      const t = textPayload.trim();
      if (t.length < 4) return null;
      return { dataType: "car", data: t };
    }
    if (mode === "coordinates") {
      const t = textPayload.trim();
      if (t.length < 3) return null;
      return { dataType: "coordinates", data: t };
    }
    if (mode === "polygon") {
      const t = textPayload.trim();
      if (t.length < 10) return null;
      return { dataType: "polygon", data: t };
    }
    if (mode === "draw") {
      if (!serializedDraw.trim()) return null;
      return { dataType: "polygon", data: serializedDraw };
    }
    return null;
  };

  const handleAnalyze = async () => {
    const built = buildDataForApi();
    if (!built) {
      toast({
        variant: "destructive",
        title: "Dados insuficientes",
        description:
          mode === "draw"
            ? "Desenhe um polígono no mapa antes de analisar."
            : "Preencha CAR, coordenadas ou GeoJSON.",
      });
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast({
        variant: "destructive",
        title: "Sem ligação",
        description:
          "A análise geoespacial precisa de internet. Ligue a rede e tente novamente.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApiWithAuth(
        auth,
        "/api/geospatial/analyze",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(built),
        },
      );
      const json = (await res.json()) as ApiAnalyzeResponse;
      if (!res.ok || !json.success || !json.overlay) {
        throw new Error(json.error || "Falha na análise geoespacial.");
      }

      const { criterio, reasons } = inferCriterioLocacionalFromOverlay(json.overlay);
      const preview =
        built.data.length > 240 ? `${built.data.slice(0, 240)}…` : built.data;
      setLastPreview(preview);

      onSuggestedCriterio({
        inputMode: mode,
        inputPreview: preview,
        suggestedCriterio: criterio,
        reasons,
        analyzedAt: new Date().toISOString(),
      });

      toast({
        title: "Critério locacional sugerido",
        description: `Sugestão: nível ${criterio} (${criterio === "0" ? "sem / baixo" : criterio === "1" ? "médio" : "alto"}).`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Análise não concluída",
        description: e instanceof Error ? e.message : "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeoJsonFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setMode("polygon");
      setTextPayload(text.trim());
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3 rounded-md border p-3 bg-muted/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Critério locacional (análise geoespacial)
        </Label>
        <div className="flex items-center gap-2">
          <Checkbox
            id="lic-loc-manual"
            checked={manualLock}
            onCheckedChange={(c) => onManualLockChange(!!c)}
          />
          <Label htmlFor="lic-loc-manual" className="text-xs font-normal cursor-pointer">
            Travar manual (não aplicar sugestão automática)
          </Label>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Use o mesmo fluxo da Análise Ambiental: CAR, coordenadas, GeoJSON ou desenho no mapa. O sistema
        sugere o peso locacional (0/1/2) com base na sobreposição e textos factuais retornados pelo serviço.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Select value={mode} onValueChange={(v) => setMode(v as LocationalInputMode)}>
          <SelectTrigger>
            <SelectValue placeholder="Fonte da área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="car">Número do CAR</SelectItem>
            <SelectItem value="coordinates">Coordenadas (lat, lng)</SelectItem>
            <SelectItem value="polygon">GeoJSON / polígono (texto)</SelectItem>
            <SelectItem value="draw">Desenhar no mapa</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".json,.geojson,application/geo+json"
            className="text-xs"
            aria-label="Carregar arquivo GeoJSON"
            onChange={handleGeoJsonFile}
          />
        </div>
      </div>

      {mode === "draw" ? (
        <div className="h-[280px] w-full rounded-md border overflow-hidden">
          <LeafletMap adaPolygon={drawn} onAdaChange={setDrawn} />
        </div>
      ) : (
        <Textarea
          value={textPayload}
          onChange={(e) => setTextPayload(e.target.value)}
          placeholder={
            mode === "car"
              ? "Ex.: MG-1234567-ABCDEF1234567890ABCD"
              : mode === "coordinates"
                ? "Ex.: -18.5122, -44.5550"
                : "Cole aqui um GeoJSON (Feature ou Geometry)..."
          }
          rows={mode === "polygon" ? 5 : 2}
          className="font-mono text-xs"
        />
      )}

      <Button type="button" size="sm" onClick={handleAnalyze} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Analisar e sugerir critério locacional
      </Button>

      {lastPreview && (
        <p className="text-xs text-muted-foreground break-all">
          Última entrada: {lastPreview}
        </p>
      )}

      {savedAnalysis?.reasons && savedAnalysis.reasons.length > 0 && (
        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
          {savedAnalysis.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
