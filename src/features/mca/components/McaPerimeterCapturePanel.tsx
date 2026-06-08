"use client";

import dynamic from "next/dynamic";
import type { StudyAreaGeoJSON } from "@/components/maps/study-area-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { McaPerimeterInputMode } from "../types/mca-workbench.types";

const McaPerimeterDrawMap = dynamic(
  () =>
    import("@/components/maps/mca-perimeter-draw-map").then((m) => ({
      default: m.McaPerimeterDrawMap,
    })),
  { ssr: false },
);

type McaPerimeterCapturePanelProps = {
  perimeterInputMode: McaPerimeterInputMode;
  onPerimeterInputModeChange: (mode: McaPerimeterInputMode) => void;
  carInput: string;
  onCarInputChange: (value: string) => void;
  onAssociateCar: () => void;
  onConsultCar: () => void;
  isConsultingCar: boolean;
  coordinateInput: string;
  onCoordinateInputChange: (value: string) => void;
  onApplyCoordinates: () => void;
  coordinateHint: string;
  polygon: StudyAreaGeoJSON | null;
  onPolygonChange: (polygon: StudyAreaGeoJSON | null) => void;
  polygonAreaHa: number | null;
  isParsingPerimeter: boolean;
  onUseCurrentCoordinates: () => void;
  onConfirmDrawnPolygon: () => void;
  onImportFile: (file: File | null) => void;
  shpZipBase64: string;
  shpFileName: string;
  onShpFileSelected: (file: File) => Promise<void>;
  onApplyShp: () => void;
  polygonPaste: string;
  onPolygonPasteChange: (value: string) => void;
  onApplyPolygonPaste: () => void;
};

export function McaPerimeterCapturePanel({
  perimeterInputMode,
  onPerimeterInputModeChange,
  carInput,
  onCarInputChange,
  onAssociateCar,
  onConsultCar,
  isConsultingCar,
  coordinateInput,
  onCoordinateInputChange,
  onApplyCoordinates,
  coordinateHint,
  polygon,
  onPolygonChange,
  polygonAreaHa,
  isParsingPerimeter,
  onUseCurrentCoordinates,
  onConfirmDrawnPolygon,
  onImportFile,
  shpZipBase64,
  shpFileName,
  onShpFileSelected,
  onApplyShp,
  polygonPaste,
  onPolygonPasteChange,
  onApplyPolygonPaste,
}: McaPerimeterCapturePanelProps) {
  return (
    <Card id="mca-perimeter-capture" className="flex w-full flex-col overflow-hidden">
      <CardHeader className="shrink-0 space-y-1 pb-3">
        <CardTitle>Captura do perímetro</CardTitle>
        <CardDescription>
          Desenhe no mapa, importe SHP/KML/GeoJSON, informe coordenadas ou associe o
          número CAR ao projeto. Fluxo exclusivo do submenu Mapas (MCA).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="mca-perimeter-mode">Origem do perímetro</Label>
            <Select
              value={perimeterInputMode}
              onValueChange={(v) =>
                onPerimeterInputModeChange(v as McaPerimeterInputMode)
              }
            >
              <SelectTrigger id="mca-perimeter-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draw">Desenho no mapa</SelectItem>
                <SelectItem value="car">Número CAR (metadado)</SelectItem>
                <SelectItem value="coordinates">Coordenadas (lat, lng)</SelectItem>
                <SelectItem value="paste">Colar GeoJSON / WKT / KML</SelectItem>
                <SelectItem value="kml_file">Ficheiro KML / GeoJSON</SelectItem>
                <SelectItem value="shp">Shapefile ZIP (.shp)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {perimeterInputMode === "car" ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="mca-car">Recibo CAR</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="mca-car"
                  className="min-w-[200px] flex-1"
                  placeholder="Ex.: MG-3106200-1234.ABCD…"
                  value={carInput}
                  onChange={(e) => onCarInputChange(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={onAssociateCar}>
                  Associar CAR
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isConsultingCar || carInput.trim().length < 8}
                  onClick={onConsultCar}
                >
                  {isConsultingCar ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Consultar SICAR
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A consulta usa o WFS público do SICAR (situação, área, município). Se a
                geometria estiver disponível, ela será aplicada ao mapa. Também pode importar
                SHP/KML do{" "}
                <a
                  href="https://www.car.gov.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  SICAR
                </a>{" "}
                (SHP/KML).
              </p>
            </div>
          ) : null}
          {perimeterInputMode === "coordinates" ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="mca-coords">Coordenadas (lat, lng)</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="mca-coords"
                  className="min-w-[200px] flex-1 font-mono text-sm"
                  placeholder="-19.922731, -43.945095"
                  value={coordinateInput}
                  onChange={(e) => onCoordinateInputChange(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isParsingPerimeter}
                  onClick={onApplyCoordinates}
                >
                  {isParsingPerimeter ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Aplicar coordenadas"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Gera um buffer mínimo (~80 m). Para limite real da propriedade, prefira
                desenho ou SHP.
              </p>
            </div>
          ) : null}
        </div>
        <div className="relative min-h-[680px] w-full md:min-h-[760px] lg:min-h-[820px]">
          <div className="absolute inset-0 overflow-hidden rounded-md border">
            <McaPerimeterDrawMap polygon={polygon} onPolygonChange={onPolygonChange} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onUseCurrentCoordinates}>
            Capturar coordenada atual
          </Button>
          <Button type="button" variant="outline" onClick={onConfirmDrawnPolygon}>
            Confirmar polígono desenhado
          </Button>
        </div>
        {coordinateHint ? (
          <p className="text-xs text-muted-foreground">
            Referência GPS: <span className="font-mono">{coordinateHint}</span> (desenhe o
            limite no mapa)
          </p>
        ) : null}
        {polygonAreaHa != null ? (
          <p className="text-sm font-medium text-primary">
            Área do perímetro: {polygonAreaHa.toFixed(2)} ha
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nenhum perímetro definido — desenhe ou importe para activar Criar / Guardar.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {perimeterInputMode === "kml_file" ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mca-perimeter-file">Importar KML / GeoJSON</Label>
              <Input
                id="mca-perimeter-file"
                type="file"
                accept=".geojson,.json,.kml,.xml,application/geo+json"
                onChange={(e) => onImportFile(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : null}
          {perimeterInputMode === "shp" ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mca-shp-upload">Shapefile ZIP (.shp + .shx + .dbf)</Label>
              <Input
                id="mca-shp-upload"
                type="file"
                accept=".zip,application/zip"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await onShpFileSelected(file);
                }}
              />
              {shpFileName ? (
                <p className="text-xs text-muted-foreground">
                  Carregado: {shpFileName}. Clique em aplicar para ler o polígono.
                </p>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!shpZipBase64 || isParsingPerimeter}
                onClick={onApplyShp}
              >
                {isParsingPerimeter ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Aplicar SHP
              </Button>
            </div>
          ) : null}
          {perimeterInputMode === "paste" ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mca-perimeter-paste">Colar GeoJSON, WKT ou KML</Label>
              <Textarea
                id="mca-perimeter-paste"
                value={polygonPaste}
                onChange={(e) => onPolygonPasteChange(e.target.value)}
                placeholder='{"type":"Polygon","coordinates":[...]} ou POLYGON((...))'
                className="min-h-[72px] font-mono text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!polygonPaste.trim() || isParsingPerimeter}
                onClick={onApplyPolygonPaste}
              >
                {isParsingPerimeter ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Aplicar geometria colada
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
