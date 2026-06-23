"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DEFAULT_INFLUENCE_CONFIG } from "@/lib/geospatial/influence-areas-config";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import type { GeoInfluenceAreaConfig, GeoInfluenceAreas } from "@/lib/types/geo-wave-a";

export type InfluenceDrawTarget = "ada" | "aid" | "aii";

type GeoInfluenceAreasPanelProps = {
  perimeterInput: PerimeterParseInput | null;
  config: GeoInfluenceAreaConfig;
  onConfigChange: (config: GeoInfluenceAreaConfig) => void;
  drawTarget: InfluenceDrawTarget;
  onDrawTargetChange: (target: InfluenceDrawTarget) => void;
  includeSatelliteBackground: boolean;
  onIncludeSatelliteChange: (value: boolean) => void;
};

export function GeoInfluenceAreasPanel({
  perimeterInput,
  config,
  onConfigChange,
  drawTarget,
  onDrawTargetChange,
  includeSatelliteBackground,
  onIncludeSatelliteChange,
}: GeoInfluenceAreasPanelProps) {
  const [preview, setPreview] = React.useState<GeoInfluenceAreas | null>(null);
  const [previewError, setPreviewError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!perimeterInput) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { resolveInfluenceAreas } = await import("@/lib/geospatial/influence-areas");
        const areas = await resolveInfluenceAreas(perimeterInput, config);
        if (!cancelled) {
          setPreview(areas);
          setPreviewError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(
            error instanceof Error ? error.message : "Não foi possível calcular as áreas.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config, perimeterInput]);

  const patch = (partial: Partial<GeoInfluenceAreaConfig>) => {
    onConfigChange({ ...config, ...partial });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Áreas de influência (ADA / AID / AII)</CardTitle>
        <CardDescription>
          A ADA é sempre o perímetro inserido para análise. A AID e a AII podem ser geradas por
          buffer ou desenho manual no mapa — independente do submenu Mapas / MCA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">ADA</span> — amarelo · perímetro do
            empreendimento.
          </p>
          <p>
            <span className="font-medium text-foreground">AID</span> — ciano · influência direta
            (buffer ou polígono manual).
          </p>
          <p>
            <span className="font-medium text-foreground">AII</span> — contorno escuro · influência
            indireta (buffer ou polígono manual).
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="aid-mode">AID — modo</Label>
            <Select
              value={config.aidMode}
              onValueChange={(value) =>
                patch({ aidMode: value as GeoInfluenceAreaConfig["aidMode"] })
              }
            >
              <SelectTrigger id="aid-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buffer">Buffer a partir da ADA</SelectItem>
                <SelectItem value="manual">Desenhar no mapa</SelectItem>
                <SelectItem value="none">Não incluir</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aii-mode">AII — modo</Label>
            <Select
              value={config.aiiMode}
              onValueChange={(value) =>
                patch({ aiiMode: value as GeoInfluenceAreaConfig["aiiMode"] })
              }
            >
              <SelectTrigger id="aii-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buffer">Buffer (a partir da AID ou ADA)</SelectItem>
                <SelectItem value="manual">Desenhar no mapa</SelectItem>
                <SelectItem value="none">Não incluir</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.aidMode === "buffer" ? (
            <div className="space-y-2">
              <Label htmlFor="aid-buffer">Buffer AID (km)</Label>
              <Input
                id="aid-buffer"
                type="number"
                min={0.1}
                step={0.1}
                value={config.aidBufferKm}
                onChange={(e) => patch({ aidBufferKm: Number(e.target.value) || 0 })}
              />
            </div>
          ) : null}
          {config.aiiMode === "buffer" ? (
            <div className="space-y-2">
              <Label htmlFor="aii-buffer">Buffer AII (km)</Label>
              <Input
                id="aii-buffer"
                type="number"
                min={0.1}
                step={0.1}
                value={config.aiiBufferKm}
                onChange={(e) => patch({ aiiBufferKm: Number(e.target.value) || 0 })}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={drawTarget === "ada" ? "default" : "outline"}
            onClick={() => onDrawTargetChange("ada")}
          >
            Desenhar ADA
          </Button>
          {config.aidMode === "manual" ? (
            <Button
              type="button"
              size="sm"
              variant={drawTarget === "aid" ? "default" : "outline"}
              onClick={() => onDrawTargetChange("aid")}
            >
              Desenhar AID
            </Button>
          ) : null}
          {config.aiiMode === "manual" ? (
            <Button
              type="button"
              size="sm"
              variant={drawTarget === "aii" ? "default" : "outline"}
              onClick={() => onDrawTargetChange("aii")}
            >
              Desenhar AII
            </Button>
          ) : null}
        </div>

        <div className="flex items-start gap-2 rounded-md border p-3">
          <Checkbox
            id="geo-satellite-bg"
            checked={includeSatelliteBackground}
            onCheckedChange={(checked) => onIncludeSatelliteChange(checked === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="geo-satellite-bg" className="cursor-pointer font-normal">
              Incluir imagem de satélite de fundo na exportação cartográfica
            </Label>
            <p className="text-xs text-muted-foreground">
              Opcional — útil em alguns mapas; omitido por omissão para relatórios técnicos limpos.
            </p>
          </div>
        </div>

        {previewError ? (
          <p className="text-xs text-destructive">{previewError}</p>
        ) : preview ? (
          <div className="grid gap-2 text-xs sm:grid-cols-3">
            <div className="rounded border p-2">
              <p className="font-medium">ADA</p>
              <p>{preview.ada.areaHa.toFixed(2)} ha</p>
            </div>
            <div className="rounded border p-2">
              <p className="font-medium">AID</p>
              <p>{preview.aid ? `${preview.aid.areaHa.toFixed(2)} ha` : "—"}</p>
            </div>
            <div className="rounded border p-2">
              <p className="font-medium">AII</p>
              <p>{preview.aii ? `${preview.aii.areaHa.toFixed(2)} ha` : "—"}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Informe o perímetro (mapa, CAR, KML ou SHP) para pré-visualizar as áreas.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { DEFAULT_INFLUENCE_CONFIG } from "@/lib/geospatial/influence-areas-config";
