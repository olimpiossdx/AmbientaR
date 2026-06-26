"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { GeoJSON } from "geojson";
import { Loader2, Upload } from "lucide-react";
import { getFadAuthToken } from "@/lib/fiscal-ambiental/use-fad-auth-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FadAoiSource } from "@/lib/fiscal-ambiental/types";
import type { StudyAreaGeoJSON } from "@/components/maps/study-area-map";

const McaPerimeterDrawMap = dynamic(
  () =>
    import("@/components/maps/mca-perimeter-draw-map").then((m) => m.McaPerimeterDrawMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
        A carregar mapa…
      </div>
    ),
  },
);

type FadAoiEditorProps = {
  polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  onPolygonChange: (geo: GeoJSON.Polygon | GeoJSON.MultiPolygon | null, source: FadAoiSource) => void;
  carCode?: string;
  onCarCodeChange?: (code: string) => void;
};

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export function FadAoiEditor({
  polygon,
  onPolygonChange,
  carCode = "",
  onCarCodeChange,
}: FadAoiEditorProps) {
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleDrawChange = (geo: StudyAreaGeoJSON | null) => {
    if (!geo) {
      onPolygonChange(null, "drawn");
      return;
    }
    const g = geo as unknown as GeoJSON.Feature | GeoJSON.Polygon | GeoJSON.MultiPolygon;
    if (g.type === "Feature" && g.geometry) {
      if (g.geometry.type === "Polygon" || g.geometry.type === "MultiPolygon") {
        onPolygonChange(g.geometry, "drawn");
      }
      return;
    }
    if (g.type === "Polygon" || g.type === "MultiPolygon") {
      onPolygonChange(g, "drawn");
    }
  };

  const parsePerimeter = async (dataType: "kml" | "shp", file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const token = await getFadAuthToken();
      const data =
        dataType === "shp"
          ? await fileToBase64(file)
          : await file.text();

      const res = await fetch("/api/study-maps/parse-perimeter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dataType, data }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        geojson?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
        error?: string;
      };
      if (!res.ok || !json.success || !json.geojson) {
        throw new Error(json.error ?? "Não foi possível ler o perímetro.");
      }
      onPolygonChange(json.geojson, dataType === "shp" ? "shp" : "kml");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Erro ao carregar ficheiro.");
    } finally {
      setUploading(false);
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".kml") || lower.endsWith(".kmz")) {
      void parsePerimeter("kml", file);
      return;
    }
    if (lower.endsWith(".zip")) {
      void parsePerimeter("shp", file);
      return;
    }
    setUploadError("Use ficheiro .kml, .kmz ou .zip (Shapefile).");
  };

  return (
    <div className="space-y-4">
      {onCarCodeChange ? (
        <div className="space-y-2">
          <Label htmlFor="fad-car">Código CAR (opcional — Fase 1)</Label>
          <Input
            id="fad-car"
            value={carCode}
            onChange={(e) => onCarCodeChange(e.target.value)}
            placeholder="MG-0000000-…"
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Importação automática por CAR será activada na Fase 1.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Label
          htmlFor="fad-perimeter-file"
          className="inline-flex cursor-pointer items-center gap-2"
        >
          <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
            <span>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Carregar KML / SHP
            </span>
          </Button>
        </Label>
        <input
          id="fad-perimeter-file"
          type="file"
          accept=".kml,.kmz,.zip"
          className="sr-only"
          onChange={onFileInput}
          disabled={uploading}
        />
        <span className="text-xs text-muted-foreground">ou desenhe o polígono no mapa</span>
      </div>

      {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}

      <div className="h-[min(420px,55vh)] min-h-[280px] overflow-hidden rounded-md border">
        <McaPerimeterDrawMap
          polygon={polygon as StudyAreaGeoJSON | null}
          onPolygonChange={handleDrawChange}
        />
      </div>
    </div>
  );
}
