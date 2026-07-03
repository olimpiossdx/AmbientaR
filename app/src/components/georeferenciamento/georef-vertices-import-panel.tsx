"use client";

import * as React from "react";
import dynamic from "next/dynamic";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { importGeorefFile } from "@/lib/georeferenciamento/sigef-import";
import type { GeorefVertice } from "@/lib/georeferenciamento/types";
import type { StudyAreaGeoJSON } from "@/components/maps/study-area-map";

const StudyAreaMap = dynamic(
  () =>
    import("@/components/maps/study-area-map").then((m) => ({
      default: m.StudyAreaMap,
    })),
  { ssr: false },
);

type Props = {
  vertices: GeorefVertice[];
  polygon: StudyAreaGeoJSON | null;
  onImport: (data: {
    vertices: GeorefVertice[];
    polygonGeojson?: object;
    verticesMeta?: {
      sourceFile?: string;
      importedAt?: string;
      format?: string;
      crsHint?: string;
      warnings?: string[];
    };
  }) => void;
  onPolygonChange?: (geo: StudyAreaGeoJSON | null) => void;
  readOnly?: boolean;
};

export function GeorefVerticesImportPanel({
  vertices,
  polygon,
  onImport,
  onPolygonChange,
  readOnly,
}: Props) {
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [warnings, setWarnings] = React.useState<string[]>([]);

  const handleFile = async (file: File) => {
    setBusy(true);
    setWarnings([]);
    try {
      const result = await importGeorefFile(file);
      if (!result.vertices.length) {
        toast({
          title: "Nenhum vértice encontrado",
          description: result.warnings?.join(" ") || "Verifique o formato da planilha.",
          variant: "destructive",
        });
        setWarnings(result.warnings ?? []);
        return;
      }
      setWarnings(result.warnings ?? []);
      onImport({
        vertices: result.vertices,
        polygonGeojson: result.polygonGeojson,
        verticesMeta: {
          sourceFile: result.sourceFile,
          importedAt: result.importedAt,
          format: result.format,
          crsHint: result.crsHint,
          warnings: result.warnings,
        },
      });
      toast({
        title: `${result.vertices.length} vértices importados`,
        description: result.polygonGeojson
          ? "Polígono gerado no mapa."
          : "Coordenadas UTM: desenhe ou exporte lat/long para o mapa.",
      });
    } catch (e) {
      toast({
        title: "Falha na importação",
        description: e instanceof Error ? e.message : "Arquivo inválido",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const preview = vertices.slice(0, 12);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vértices e planilha SIGEF</CardTitle>
        <CardDescription>
          Importe ODS/XLSX (planilha eletrônica SIGEF), CSV, GeoJSON ou KML/XML. O sistema
          detecta colunas de vértice, latitude/longitude ou Este/Norte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readOnly && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid flex-1 gap-2 min-w-[200px]">
              <Label htmlFor="georef-file">Arquivo</Label>
              <Input
                id="georef-file"
                ref={inputRef}
                type="file"
                accept=".ods,.xlsx,.xls,.csv,.txt,.geojson,.json,.kml,.xml"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Selecionar arquivo
            </Button>
          </div>
        )}

        {warnings.length > 0 && (
          <Alert>
            <AlertDescription>
              <ul className="list-disc pl-4 text-sm">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {vertices.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              {vertices.length} vértice(s) — exibindo até 12 na tabela.
            </p>
            <div className="max-h-48 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Lat</TableHead>
                    <TableHead>Lon</TableHead>
                    <TableHead className="hidden sm:table-cell">Este</TableHead>
                    <TableHead className="hidden sm:table-cell">Norte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((v) => (
                    <TableRow key={v.sequencia ?? v.codigo}>
                      <TableCell>{v.sequencia}</TableCell>
                      <TableCell>{v.codigo ?? "—"}</TableCell>
                      <TableCell>{v.lat?.toFixed(6) ?? "—"}</TableCell>
                      <TableCell>{v.lon?.toFixed(6) ?? "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {v.easting?.toFixed(2) ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {v.northing?.toFixed(2) ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {polygon && onPolygonChange && (
          <div className="h-[320px] overflow-hidden rounded-lg border">
            <StudyAreaMap polygon={polygon} onPolygonChange={onPolygonChange} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
