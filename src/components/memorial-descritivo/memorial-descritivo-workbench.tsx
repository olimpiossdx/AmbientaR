'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { FileDown, FileText, Loader2, Upload } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StudyAreaGeoJSON } from '@/components/maps/study-area-map';
import { useToast } from '@/hooks/use-toast';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { guardBrandingExportFromHook } from '@/lib/pdf-branding-layout';
import { parseGeometryUploadFile } from '@/lib/pea/load-project-geometry';
import {
  buildMemorialFullText,
  computeMemorialFromPolygon,
  DEFAULT_MEMORIAL_METADATA,
  generateMemorialExportDocxBlob,
  generateMemorialExportPdfBlob,
  loadMemorialDraft,
  normalizePolygonFeature,
  saveMemorialDraft,
  type MemorialContext,
  type MemorialComputation,
  type MemorialMetadata,
} from '@/lib/memorial-descritivo';
import { decimalBr } from '@/lib/memorial-descritivo/format-br';
import type { Fuso } from '@/lib/types';
import { useMcaTurfArea } from '@/features/mca/hooks/useMcaTurfArea';

const StudyAreaMap = dynamic(
  () =>
    import('@/components/maps/study-area-map').then((m) => ({
      default: m.StudyAreaMap,
    })),
  { ssr: false },
);

const PAGE_COPY: Record<
  MemorialContext,
  { title: string; description: string }
> = {
  georef: {
    title: 'Memorial descritivo',
    description:
      'Gere memorial georreferenciado a partir de KML/SHP: coordenadas UTM SIRGAS 2000, azimutes, distâncias, área e perímetro.',
  },
  studies: {
    title: 'Memorial descritivo',
    description:
      'Elabore memorial de perímetro com upload KML/SHP, cálculos UTM e exportação em Word ou PDF.',
  },
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

type MemorialDescritivoWorkbenchProps = {
  context: MemorialContext;
};

export function MemorialDescritivoWorkbench({
  context,
}: MemorialDescritivoWorkbenchProps) {
  const { toast } = useToast();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const fileRef = React.useRef<HTMLInputElement>(null);
  const [metadata, setMetadata] = React.useState<MemorialMetadata>(
    DEFAULT_MEMORIAL_METADATA,
  );
  const [polygon, setPolygon] = React.useState<Feature<Polygon | MultiPolygon> | null>(
    null,
  );
  const [sourceLabel, setSourceLabel] = React.useState<string | undefined>();
  const [confrontantes, setConfrontantes] = React.useState<string[]>([]);
  const [memorialText, setMemorialText] = React.useState('');
  const [computation, setComputation] = React.useState<MemorialComputation | null>(
    null,
  );
  const [importing, setImporting] = React.useState(false);
  const [busy, setBusy] = React.useState<'docx' | 'pdf' | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  const { turfAreaReady, computeAreaHa } = useMcaTurfArea();

  const copy = PAGE_COPY[context];

  React.useEffect(() => {
    const draft = loadMemorialDraft(context);
    if (draft) {
      setMetadata(draft.metadata);
      setPolygon(draft.polygon);
      setConfrontantes(draft.confrontantes);
      setMemorialText(draft.memorialText);
      setSourceLabel(draft.sourceLabel);
      if (draft.polygon) {
        const comp = computeMemorialFromPolygon(
          draft.polygon,
          draft.metadata.fuso,
          draft.confrontantes,
        );
        setComputation(comp);
      }
    }
    setHydrated(true);
  }, [context]);

  React.useEffect(() => {
    if (!hydrated) return;
    saveMemorialDraft(context, {
      metadata,
      polygon,
      confrontantes,
      memorialText,
      sourceLabel,
    });
  }, [hydrated, context, metadata, polygon, confrontantes, memorialText, sourceLabel]);

  const geodesicAreaHa = React.useMemo(() => {
    if (!polygon || !turfAreaReady) return null;
    return computeAreaHa(polygon);
  }, [polygon, turfAreaReady, computeAreaHa]);

  const updateMetadata = (patch: Partial<MemorialMetadata>) => {
    setMetadata((prev) => ({ ...prev, ...patch }));
  };

  const recompute = React.useCallback(
    (
      poly: Feature<Polygon | MultiPolygon> | null,
      meta: MemorialMetadata,
      confronts: string[],
    ) => {
      if (!poly) {
        setComputation(null);
        return null;
      }
      const comp = computeMemorialFromPolygon(poly, meta.fuso, confronts);
      setComputation(comp);
      return comp;
    },
    [],
  );

  const handleFile = async (file: File) => {
    setImporting(true);
    try {
      const resolved = await parseGeometryUploadFile(file);
      if (!resolved) {
        toast({
          title: 'Polígono não encontrado',
          description: 'Verifique se o arquivo contém um perímetro válido.',
          variant: 'destructive',
        });
        return;
      }
      const feature = normalizePolygonFeature(resolved.polygon);
      if (!feature) {
        toast({
          title: 'Geometria inválida',
          description: 'É necessário um polígono ou multipolígono.',
          variant: 'destructive',
        });
        return;
      }
      setPolygon(feature);
      setSourceLabel(resolved.sourceLabel);
      const comp = recompute(feature, metadata, confrontantes);
      if (comp) {
        const emptyConfronts = comp.segments.map(() => '');
        setConfrontantes(emptyConfronts);
        const text = buildMemorialFullText({
          metadata,
          segments: comp.segments.map((s, i) => ({
            ...s,
            confrontante: '',
          })),
          metrics: comp.metrics,
        });
        setMemorialText(text);
      }
      toast({
        title: 'Perímetro importado',
        description: resolved.sourceLabel,
      });
    } catch (e) {
      toast({
        title: 'Falha na importação',
        description: e instanceof Error ? e.message : 'Arquivo inválido',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleFusoChange = (fuso: Fuso) => {
    const nextMeta = { ...metadata, fuso };
    setMetadata(nextMeta);
    recompute(polygon, nextMeta, confrontantes);
  };

  const handleConfrontanteChange = (index: number, value: string) => {
    setConfrontantes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleGenerateText = () => {
    if (!polygon || !computation) {
      toast({
        title: 'Importe um perímetro',
        description: 'É necessário KML, GeoJSON ou SHP/ZIP com polígono.',
        variant: 'destructive',
      });
      return;
    }
    const comp = recompute(polygon, metadata, confrontantes);
    if (!comp) return;
    const text = buildMemorialFullText({
      metadata,
      segments: comp.segments,
      metrics: comp.metrics,
    });
    setMemorialText(text);
    toast({ title: 'Memorial gerado', description: 'Revise o texto antes de exportar.' });
  };

  const handleExportDocx = async () => {
    if (!memorialText.trim()) {
      toast({
        title: 'Texto vazio',
        description: 'Gere ou edite o memorial antes de exportar.',
        variant: 'destructive',
      });
      return;
    }
    setBusy('docx');
    try {
      const result = await generateMemorialExportDocxBlob({
        memorialText,
        metadata,
      });
      downloadBlob(result.blob, result.fileName);
      toast({ title: 'DOCX exportado' });
    } catch (e) {
      toast({
        title: 'Falha na exportação',
        description: e instanceof Error ? e.message : 'Erro ao gerar Word',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const handleExportPdf = async () => {
    if (!memorialText.trim()) {
      toast({
        title: 'Texto vazio',
        description: 'Gere ou edite o memorial antes de exportar.',
        variant: 'destructive',
      });
      return;
    }
    if (
      !guardBrandingExportFromHook({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
        formatLabel: 'PDF',
      })
    ) {
      return;
    }
    setBusy('pdf');
    try {
      const result = await generateMemorialExportPdfBlob(
        memorialText,
        metadata,
        brandingData,
        pdfImages,
      );
      downloadBlob(result.blob, result.fileName);
      toast({ title: 'PDF exportado' });
    } catch (e) {
      toast({
        title: 'Falha na exportação',
        description: e instanceof Error ? e.message : 'Erro ao gerar PDF',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const handlePolygonMapChange = (geo: StudyAreaGeoJSON | null) => {
    if (!geo) {
      setPolygon(null);
      setComputation(null);
      return;
    }
    const feature = normalizePolygonFeature(geo as unknown as Feature<Polygon | MultiPolygon>);
    if (!feature) return;
    setPolygon(feature);
    const comp = recompute(feature, metadata, confrontantes);
    if (comp && confrontantes.length !== comp.segments.length) {
      setConfrontantes(comp.segments.map((_, i) => confrontantes[i] ?? ''));
    }
  };

  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Perímetro (KML / SHP)</CardTitle>
                <CardDescription>
                  Formatos: KML, KMZ, GeoJSON, ZIP com SHP. Coordenadas geográficas
                  serão projetadas para UTM SIRGAS 2000.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".kml,.kmz,.xml,.geojson,.json,.zip,.shp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={importing}
                  onClick={() => fileRef.current?.click()}
                >
                  {importing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Importar arquivo
                </Button>
                {sourceLabel && (
                  <p className="text-sm text-muted-foreground">{sourceLabel}</p>
                )}
                {computation && (
                  <Alert>
                    <AlertDescription className="text-sm space-y-1">
                      <p>
                        Área UTM: <strong>{decimalBr(computation.metrics.areaHa, 4)} ha</strong>
                        {geodesicAreaHa != null && (
                          <span className="text-muted-foreground">
                            {' '}
                            (geodésica: {decimalBr(geodesicAreaHa, 4)} ha)
                          </span>
                        )}
                      </p>
                      <p>
                        Perímetro:{' '}
                        <strong>{decimalBr(computation.metrics.perimetroM, 2)} m</strong>
                      </p>
                      <p>
                        Vértices: <strong>{computation.metrics.vertexCount}</strong> · Fuso{' '}
                        <strong>{computation.metrics.fuso}S</strong>
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="h-[320px] overflow-hidden rounded-md border">
                  <StudyAreaMap
                    polygon={polygon as StudyAreaGeoJSON | null}
                    onPolygonChange={handlePolygonMapChange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Identificação do imóvel</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2 grid gap-2">
                  <Label htmlFor="mem-imovel">Imóvel</Label>
                  <Input
                    id="mem-imovel"
                    value={metadata.imovel}
                    onChange={(e) => updateMetadata({ imovel: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mem-prop">Proprietário</Label>
                  <Input
                    id="mem-prop"
                    value={metadata.proprietario}
                    onChange={(e) => updateMetadata({ proprietario: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mem-doc">CPF/CNPJ</Label>
                  <Input
                    id="mem-doc"
                    value={metadata.cpfCnpj}
                    onChange={(e) => updateMetadata({ cpfCnpj: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mem-mat">Matrícula</Label>
                  <Input
                    id="mem-mat"
                    value={metadata.matricula}
                    onChange={(e) => updateMetadata({ matricula: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mem-mun">Município</Label>
                  <Input
                    id="mem-mun"
                    value={metadata.municipio}
                    onChange={(e) => updateMetadata({ municipio: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mem-uf">UF</Label>
                  <Input
                    id="mem-uf"
                    value={metadata.uf}
                    onChange={(e) => updateMetadata({ uf: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 grid gap-2">
                  <Label htmlFor="mem-titulo">Título da área</Label>
                  <Input
                    id="mem-titulo"
                    value={metadata.tituloArea}
                    onChange={(e) => updateMetadata({ tituloArea: e.target.value })}
                    placeholder="PERÍMETRO DA SEDE"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Fuso UTM</Label>
                  <Select
                    value={metadata.fuso}
                    onValueChange={(v) => handleFusoChange(v as Fuso)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="22">22S</SelectItem>
                      <SelectItem value="23">23S</SelectItem>
                      <SelectItem value="24">24S</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mem-rt">Responsável técnico</Label>
                  <Input
                    id="mem-rt"
                    value={metadata.responsavelTecnico}
                    onChange={(e) =>
                      updateMetadata({ responsavelTecnico: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2 grid gap-2">
                  <Label htmlFor="mem-crea">CREA/CFT</Label>
                  <Input
                    id="mem-crea"
                    value={metadata.creaCft}
                    onChange={(e) => updateMetadata({ creaCft: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {computation && computation.segments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Confrontantes (opcional)</CardTitle>
                  <CardDescription>
                    Um confrontante por segmento entre vértices consecutivos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Segmento</TableHead>
                        <TableHead>Dist. (m)</TableHead>
                        <TableHead>Confrontante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {computation.segments.map((seg, i) => (
                        <TableRow key={seg.fromVertex}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {seg.fromVertex} → {seg.toVertex}
                          </TableCell>
                          <TableCell className="text-xs">
                            {decimalBr(seg.distancia, 2)}
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8 text-xs"
                              value={confrontantes[i] ?? ''}
                              onChange={(e) =>
                                handleConfrontanteChange(i, e.target.value)
                              }
                              placeholder="Ex.: estrada municipal"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Texto do memorial</CardTitle>
                <CardDescription>
                  Gere automaticamente a partir do perímetro ou edite manualmente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  className="min-h-[280px] font-mono text-xs"
                  value={memorialText}
                  onChange={(e) => setMemorialText(e.target.value)}
                  placeholder="Importe um perímetro e clique em Gerar texto…"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={handleGenerateText}>
                    Gerar texto
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy != null}
                    onClick={() => void handleExportDocx()}
                  >
                    {busy === 'docx' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Exportar DOCX
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy != null}
                    onClick={() => void handleExportPdf()}
                  >
                    {busy === 'pdf' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" />
                    )}
                    Exportar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
