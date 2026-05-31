"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileDown, FileImage, FileType, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocalBranding } from "@/hooks/use-local-branding";
import {
  prepareIaMenuBrandedPdfSession,
  saveIaMenuBrandedPdf,
} from "@/lib/ia-menu-branded-pdf";
import { appendWaveAFactualPdf } from "@/lib/geospatial/export-wave-a-pdf";
import { appendGeoAnalysisComplementPdf } from "@/lib/geospatial/export-complement-pdf";
import { buildCartographicPngMap } from "@/lib/geospatial/render-minimap-client";
import {
  exportAllCartographicPngs,
  exportCartographicFromWaveA,
  type CartographicExportFormat,
} from "@/lib/geospatial/export-cartographic-client";
import { buildCartographicDocxBlob } from "@/lib/geospatial/export-cartographic-docx";
import { buildComplementDocxBlob } from "@/lib/geospatial/export-complement-docx";
import {
  brandingUrlsFromLocal,
  guardBrandingExportFromHook,
  reportBrandingPdfIssues,
} from "@/lib/pdf-branding-layout";
import type {
  GeoAnalysisComplementOutput,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";

export type GeoAnalysisExportPanelProps = {
  wave: WaveAAnalysisResult;
  complement?: GeoAnalysisComplementOutput | null;
  includeSatelliteBackground?: boolean;
  includeThematicWfs?: boolean;
};

type ExportScope = "complete" | "layer";
type ExportFormat = CartographicExportFormat | "docx";

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .toLowerCase();
}

export function GeoAnalysisExportPanel({
  wave,
  complement,
  includeSatelliteBackground = false,
  includeThematicWfs = true,
}: GeoAnalysisExportPanelProps) {
  const { toast } = useToast();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const [busy, setBusy] = React.useState(false);
  const [scope, setScope] = React.useState<ExportScope>("complete");
  const [format, setFormat] = React.useState<ExportFormat>("pdf");
  const [layerId, setLayerId] = React.useState<string>(
    wave.layers[0]?.layerId ?? "_localizacao",
  );
  const [propertyName, setPropertyName] = React.useState("");
  const [projectAuthor, setProjectAuthor] = React.useState("");
  const [includeIaInPdf, setIncludeIaInPdf] = React.useState(true);

  const effectiveLayerId = scope === "complete" ? "all" : layerId;

  const cartoOptions = React.useMemo(
    () => ({
      propertyName: propertyName.trim() || undefined,
      projectAuthor: projectAuthor.trim() || undefined,
      layerId: effectiveLayerId,
      includeSatelliteBackground,
      includeThematicWfs,
    }),
    [
      effectiveLayerId,
      includeSatelliteBackground,
      includeThematicWfs,
      projectAuthor,
      propertyName,
    ],
  );

  const runExport = async () => {
    if (scope === "layer" && layerId === "all") {
      toast({
        variant: "destructive",
        title: "Seleccione uma camada",
        description: "No modo individual, escolha a camada no selector.",
      });
      return;
    }

    if (format === "png" || format === "jpeg") {
      if (scope === "complete") {
        setBusy(true);
        try {
          const count = await exportAllCartographicPngs(wave, {
            propertyName: cartoOptions.propertyName,
            projectAuthor: cartoOptions.projectAuthor,
            includeSatelliteBackground,
            includeThematicWfs,
          });
          toast({
            title: "PNG exportados",
            description: `${count} folha(s) cartográfica(s) transferida(s).`,
          });
        } catch (e) {
          toast({
            variant: "destructive",
            title: "Erro na exportação",
            description: e instanceof Error ? e.message : "Falha ao exportar PNG.",
          });
        } finally {
          setBusy(false);
        }
        return;
      }
    }

    if (format === "docx") {
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
      setBusy(true);
      try {
        const images = pdfImages ?? {
          headerBase64: null,
          footerBase64: null,
          watermarkBase64: null,
        };
        reportBrandingPdfIssues(brandingUrlsFromLocal(brandingData), images, toast);

        let blob: Blob;
        if (complement && (scope === "complete" || includeIaInPdf)) {
          let cartographicPngs;
          try {
            cartographicPngs = await buildCartographicPngMap(wave, {
              ...cartoOptions,
              layerId: effectiveLayerId,
            });
          } catch {
            cartographicPngs = undefined;
          }
          blob = await buildComplementDocxBlob(complement, {
            areaHa: wave.perimeter.areaHa,
            generatedAtUtc: complement.generatedAtUtc,
            factualSummary: wave.factualSummary,
            layers: wave.layers,
            wave,
            cartographicPngs,
            propertyName: cartoOptions.propertyName,
            projectAuthor: cartoOptions.projectAuthor,
            layerId: effectiveLayerId,
          });
        } else {
          blob = await buildCartographicDocxBlob(wave, {
            ...cartoOptions,
            layerId: effectiveLayerId,
          });
        }
        const suffix =
          scope === "complete"
            ? "completo"
            : slugify(
                wave.layers.find((l) => l.layerId === layerId)?.title ?? layerId,
              );
        downloadBlob(
          `analise-geo-${suffix}-${new Date().toISOString().slice(0, 10)}.docx`,
          blob,
        );
        toast({ title: "Word exportado", description: "Documento transferido." });
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Erro no Word",
          description: e instanceof Error ? e.message : "Falha ao gerar .docx.",
        });
      } finally {
        setBusy(false);
      }
      return;
    }

    if (format === "pdf") {
      setBusy(true);
      try {
        const session = await prepareIaMenuBrandedPdfSession({
          brandingData,
          pdfImages,
          isPdfImagesLoading,
          hasBrandingUrls,
          toast,
        });
        if (!session) return;

        let cartographicPngs = null;
        try {
          cartographicPngs = await buildCartographicPngMap(wave, {
            ...cartoOptions,
            layerId: effectiveLayerId,
          });
        } catch (e) {
          console.warn("Mapas omitidos:", e);
        }

        if (complement && includeIaInPdf && scope === "complete") {
          appendGeoAnalysisComplementPdf(session, wave, complement, {
            cartographicPngs,
            layerId: "all",
          });
        } else {
          appendWaveAFactualPdf(session, wave, {
            cartographicPngs,
            layerId: effectiveLayerId,
            includeReportTitle: true,
          });
          if (complement && includeIaInPdf && scope === "layer") {
            appendGeoAnalysisComplementPdf(session, wave, complement, {
              layerId: effectiveLayerId,
            });
          }
        }

        const suffix =
          scope === "complete"
            ? "completo"
            : slugify(
                wave.layers.find((l) => l.layerId === layerId)?.title ?? layerId,
              );
        saveIaMenuBrandedPdf(
          session,
          `analise-geo-${suffix}-${wave.perimeter.areaHa.toFixed(0)}ha-${new Date().toISOString().slice(0, 10)}.pdf`,
        );
        toast({
          title: "PDF gerado",
          description:
            scope === "complete"
              ? complement && includeIaInPdf
                ? "Relatório completo: SIG + mapas + parecer IA."
                : "Relatório completo: dados SIG e mapas."
              : "PDF da camada seleccionada.",
        });
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Erro no PDF",
          description: e instanceof Error ? e.message : "Falha ao gerar PDF.",
        });
      } finally {
        setBusy(false);
      }
      return;
    }

    if (format === "png" || format === "jpeg") {
      setBusy(true);
      try {
        const { fileName } = await exportCartographicFromWaveA(
          wave,
          format,
          cartoOptions,
        );
        toast({
          title: format === "jpeg" ? "JPEG exportado" : "PNG exportado",
          description: fileName,
        });
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Erro na imagem",
          description: e instanceof Error ? e.message : "Falha na exportação.",
        });
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium">Exportação do relatório</p>
        <p className="text-xs text-muted-foreground mt-1">
          Por camada (PNG, JPEG, PDF ou Word) ou pacote completo (todas as camadas em PDF/Word;
          PNG em lote). Complemento IA entra no PDF/Word completo quando disponível.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="geo-export-scope">Âmbito</Label>
          <Select
            value={scope}
            onValueChange={(v) => setScope(v as ExportScope)}
          >
            <SelectTrigger id="geo-export-scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complete">Relatório completo</SelectItem>
              <SelectItem value="layer">Uma camada / folha</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="geo-export-format">Formato</Label>
          <Select
            value={format}
            onValueChange={(v) => setFormat(v as ExportFormat)}
          >
            <SelectTrigger id="geo-export-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="docx">Word (.docx)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {scope === "layer" ? (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="geo-export-layer">Camada</Label>
            <Select value={layerId} onValueChange={setLayerId}>
              <SelectTrigger id="geo-export-layer">
                <SelectValue placeholder="Seleccione a camada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_localizacao">Localização</SelectItem>
                {wave.influenceAreas ? (
                  <>
                    <SelectItem value="_ada">ADA</SelectItem>
                    {wave.influenceAreas.aid ? (
                      <SelectItem value="_aid">AID</SelectItem>
                    ) : null}
                    {wave.influenceAreas.aii ? (
                      <SelectItem value="_aii">AII</SelectItem>
                    ) : null}
                  </>
                ) : null}
                {wave.layers.map((layer) => (
                  <SelectItem key={layer.layerId} value={layer.layerId}>
                    {layer.title.slice(0, 56)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="geo-export-property">Empreendimento</Label>
          <Input
            id="geo-export-property"
            placeholder="Nome na folha cartográfica"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="geo-export-author">Responsável</Label>
          <Input
            id="geo-export-author"
            placeholder="CREA / autor do projeto"
            value={projectAuthor}
            onChange={(e) => setProjectAuthor(e.target.value)}
          />
        </div>
      </div>

      {complement ? (
        <div className="flex items-start gap-2 rounded-md border px-3 py-2">
          <Checkbox
            id="geo-export-ia"
            className="mt-0.5"
            checked={includeIaInPdf}
            onCheckedChange={(v) => setIncludeIaInPdf(v === true)}
          />
          <Label htmlFor="geo-export-ia" className="text-xs font-normal cursor-pointer leading-snug">
            Incluir parecer IA (Etapa 2) em PDF e Word
          </Label>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void runExport()} disabled={busy} className="flex-1 min-w-[200px]">
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : format === "docx" ? (
            <FileType className="mr-2 h-4 w-4" />
          ) : format === "png" || format === "jpeg" ? (
            <FileImage className="mr-2 h-4 w-4" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Exportar
        </Button>
      </div>
    </div>
  );
}
