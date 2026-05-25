'use client';



import * as React from 'react';

import Link from 'next/link';

import {

  Card,

  CardContent,

  CardDescription,

  CardHeader,

  CardTitle,

} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';

import { Input } from '@/components/ui/input';

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from '@/components/ui/select';

import { Checkbox } from '@/components/ui/checkbox';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { Loader2, MapPin, ExternalLink, Upload } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';

import { useFirebase } from '@/firebase';

import {

  listGeoAnalysesForUser,

  loadGeoAnalysisBundle,

  type GeoAnalysisBundle,

} from '@/lib/geospatial/load-geo-analysis-bundle';

import {

  buildPeaTextsFromGeoBundle,

  type GeoToPeaImportMode,

} from '@/lib/pea/build-abea-from-geo';

import { buildPeaTextsFromPolygon } from '@/lib/pea/build-abea-from-polygon';

import {

  listProjectGeometryCandidates,

  resolveGeometryFromCandidate,

  parseGeometryUploadFile,

  polygonFromGeoAnalysisBundle,

  type ProjectGeometryCandidate,

} from '@/lib/pea/load-project-geometry';

import type { PeaGeoVinculo } from '@/lib/pea/types';



export type PeaGeoLinkPanelProps = {

  userId: string;

  projectId?: string;

  initialGeoAnalysisId?: string;

  initialVinculo?: PeaGeoVinculo;

  currentAbea?: string;

  currentAda?: string;

  currentAbeaGeo?: string;

  onGeoAnalysisIdChange: (id: string) => void;

  onVinculoChange: (v: PeaGeoVinculo | undefined) => void;

  onApplyTexts: (texts: {

    abeaDescricao: string;

    adaGeometriaNotas: string;

    abeaGeometriaNotas: string;

  }) => void;

};



export function PeaGeoLinkPanel({

  userId,

  projectId,

  initialGeoAnalysisId,

  initialVinculo,

  currentAbea,

  currentAda,

  currentAbeaGeo,

  onGeoAnalysisIdChange,

  onVinculoChange,

  onApplyTexts,

}: PeaGeoLinkPanelProps) {

  const { firestore } = useFirebase();

  const { toast } = useToast();

  const fileRef = React.useRef<HTMLInputElement>(null);

  const [analyses, setAnalyses] = React.useState<

    Awaited<ReturnType<typeof listGeoAnalysesForUser>>

  >([]);

  const [geomCandidates, setGeomCandidates] = React.useState<ProjectGeometryCandidate[]>([]);

  const [loadingList, setLoadingList] = React.useState(true);

  const [loadingGeom, setLoadingGeom] = React.useState(false);

  const [selectedId, setSelectedId] = React.useState(initialGeoAnalysisId ?? '');

  const [selectedGeomId, setSelectedGeomId] = React.useState('');

  const [bundle, setBundle] = React.useState<GeoAnalysisBundle | null>(null);

  const [loadingBundle, setLoadingBundle] = React.useState(false);

  const [importingFile, setImportingFile] = React.useState(false);



  const [modo, setModo] = React.useState<GeoToPeaImportMode>(

    initialVinculo?.modoTexto ?? 'anexar',

  );

  const [incluirSocio, setIncluirSocio] = React.useState(

    initialVinculo?.incluirSocioeconomico ?? true,

  );

  const [incluirTabela, setIncluirTabela] = React.useState(

    initialVinculo?.incluirTabelaCamadas ?? true,

  );

  const [incluirFisico, setIncluirFisico] = React.useState(

    initialVinculo?.incluirMeioFisico ?? true,

  );

  const [autoApply, setAutoApply] = React.useState(initialVinculo?.aplicarAutomatico ?? false);

  const [sugerirAbeaAmpliada, setSugerirAbeaAmpliada] = React.useState(true);
  const lastAutoApplyKeyRef = React.useRef('');

  React.useEffect(() => {

    if (!firestore) return;

    let cancelled = false;

    setLoadingList(true);

    void listGeoAnalysesForUser(firestore, userId, projectId?.trim() || undefined)

      .then((rows) => {

        if (!cancelled) setAnalyses(rows);

      })

      .finally(() => {

        if (!cancelled) setLoadingList(false);

      });

    return () => {

      cancelled = true;

    };

  }, [firestore, userId, projectId]);



  React.useEffect(() => {

    if (!firestore || !projectId?.trim()) {

      setGeomCandidates([]);

      return;

    }

    let cancelled = false;

    setLoadingGeom(true);

    void listProjectGeometryCandidates(firestore, userId, projectId)

      .then((rows) => {

        if (!cancelled) setGeomCandidates(rows);

      })

      .finally(() => {

        if (!cancelled) setLoadingGeom(false);

      });

    return () => {

      cancelled = true;

    };

  }, [firestore, userId, projectId]);



  React.useEffect(() => {

    onGeoAnalysisIdChange(selectedId);

    if (!selectedId) {

      setBundle(null);

      if (!initialVinculo?.geometrySource) {

        onVinculoChange(undefined);

      }

      return;

    }

    if (!firestore) return;

    let cancelled = false;

    setLoadingBundle(true);

    void loadGeoAnalysisBundle(firestore, selectedId, userId)

      .then((b) => {

        if (!cancelled) setBundle(b);

      })

      .finally(() => {

        if (!cancelled) setLoadingBundle(false);

      });

    return () => {

      cancelled = true;

    };

  }, [firestore, selectedId, userId, onGeoAnalysisIdChange, onVinculoChange, initialVinculo?.geometrySource]);



  const patchVinculo = React.useCallback(

    (patch: Partial<PeaGeoVinculo>) => {

      const base: PeaGeoVinculo = {

        analysisId: selectedId || patch.analysisId || initialVinculo?.analysisId || '',

        areaHa: patch.areaHa ?? bundle?.wave.perimeter.areaHa ?? initialVinculo?.areaHa,

        camadasOk:

          patch.camadasOk ??

          (bundle

            ? `${bundle.wave.layers.filter((l) => l.status === 'ok').length}/${bundle.wave.layers.length || 8}`

            : initialVinculo?.camadasOk),

        importedAtUtc: new Date().toISOString(),

        modoTexto: modo,

        incluirSocioeconomico: incluirSocio,

        incluirTabelaCamadas: incluirTabela,

        incluirMeioFisico: incluirFisico,

        aplicarAutomatico: autoApply,

        ...initialVinculo,

        ...patch,

      };

      if (!base.analysisId && !base.geometrySource) {

        onVinculoChange(undefined);

        return;

      }

      onVinculoChange(base);

    },

    [

      selectedId,

      bundle,

      modo,

      incluirSocio,

      incluirTabela,

      incluirFisico,

      autoApply,

      initialVinculo,

      onVinculoChange,

    ],

  );



  React.useEffect(() => {

    if (!bundle || !selectedId) return;

    patchVinculo({

      analysisId: selectedId,

      areaHa: bundle.wave.perimeter.areaHa,

      camadasOk: `${bundle.wave.layers.filter((l) => l.status === 'ok').length}/${bundle.wave.layers.length || 8}`,

    });

  }, [bundle, selectedId, patchVinculo]);



  const applyFromBundle = React.useCallback(

    (b: GeoAnalysisBundle) => {

      const texts = buildPeaTextsFromGeoBundle(

        b,

        {

          abeaDescricao: currentAbea,

          adaGeometriaNotas: currentAda,

          abeaGeometriaNotas: currentAbeaGeo,

        },

        {

          modo,

          incluirSocioeconomico: incluirSocio,

          incluirTabelaCamadas: incluirTabela,

          incluirMeioFisico: incluirFisico,

        },

      );

      onApplyTexts({

        abeaDescricao: texts.abeaDescricao,

        adaGeometriaNotas: texts.adaGeometriaNotas,

        abeaGeometriaNotas: texts.abeaGeometriaNotas,

      });

      patchVinculo({

        analysisId: b.analysisId,

        areaHa: b.wave.perimeter.areaHa,

      });

      toast({

        title: 'Textos ABEA/ADA (análise geoespacial)',

        description: texts.resumoLinha,

      });

    },

    [

      currentAbea,

      currentAda,

      currentAbeaGeo,

      modo,

      incluirSocio,

      incluirTabela,

      incluirFisico,

      onApplyTexts,

      patchVinculo,

      toast,

    ],

  );



  const applyFromPolygon = React.useCallback(

    (

      resolved: NonNullable<Awaited<ReturnType<typeof parseGeometryUploadFile>>>,

      sourceLabel: string,

      source: PeaGeoVinculo['geometrySource'],

    ) => {

      const texts = buildPeaTextsFromPolygon(

        resolved.polygon,

        {

          abeaDescricao: currentAbea,

          adaGeometriaNotas: currentAda,

          abeaGeometriaNotas: currentAbeaGeo,

        },

        {

          modo,

          sourceLabel,

          sugerirAbeaAmpliada,

          abeaBufferKmNota: 2,

        },

      );

      onApplyTexts({

        abeaDescricao: texts.abeaDescricao,

        adaGeometriaNotas: texts.adaGeometriaNotas,

        abeaGeometriaNotas: texts.abeaGeometriaNotas,

      });

      patchVinculo({

        areaHa: texts.areaHa,

        geometrySource: source,

        geometryLabel: sourceLabel,

        vertexCount: texts.vertexCount,

      });

      toast({

        title: 'Geometria aplicada (ABEA/ADA)',

        description: texts.resumoLinha,

      });

    },

    [currentAbea, currentAda, currentAbeaGeo, modo, sugerirAbeaAmpliada, onApplyTexts, patchVinculo, toast],

  );



  React.useEffect(() => {
    if (!autoApply) {
      lastAutoApplyKeyRef.current = '';
      return;
    }
    if (!bundle || !selectedId) return;
    const key = `${selectedId}:${modo}:${incluirSocio}:${incluirTabela}:${incluirFisico}`;
    if (lastAutoApplyKeyRef.current === key) return;
    lastAutoApplyKeyRef.current = key;
    applyFromBundle(bundle);
  }, [
    autoApply,
    bundle,
    selectedId,
    modo,
    incluirSocio,
    incluirTabela,
    incluirFisico,
    applyFromBundle,
  ]);

  const handleApplyProjectGeometry = async () => {

    if (!firestore || !selectedGeomId) return;

    const cand = geomCandidates.find((c) => c.id === selectedGeomId);

    if (!cand) return;

    setImportingFile(true);

    try {

      const resolved = await resolveGeometryFromCandidate(firestore, cand, userId);

      if (!resolved) {

        toast({

          variant: 'destructive',

          title: 'Geometria indisponível',

          description: 'Não foi possível ler o polígono desta fonte.',

        });

        return;

      }

      applyFromPolygon(resolved, resolved.sourceLabel, resolved.source);

    } catch (e) {

      toast({

        variant: 'destructive',

        title: 'Erro ao carregar geometria',

        description: e instanceof Error ? e.message : 'Falha na importação.',

      });

    } finally {

      setImportingFile(false);

    }

  };



  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    e.target.value = '';

    if (!file) return;

    setImportingFile(true);

    try {

      const resolved = await parseGeometryUploadFile(file);

      if (!resolved) {

        toast({

          variant: 'destructive',

          title: 'Arquivo sem polígono',

          description: 'Não foi encontrado um polígono válido no ficheiro.',

        });

        return;

      }

      applyFromPolygon(resolved, resolved.sourceLabel, 'kml_upload');

    } catch (err) {

      toast({

        variant: 'destructive',

        title: 'Importação falhou',

        description: err instanceof Error ? err.message : 'Erro ao ler o arquivo.',

      });

    } finally {

      setImportingFile(false);

    }

  };



  const handleApplyPerimeterFromSelectedAnalysis = () => {

    if (!bundle) return;

    const resolved = polygonFromGeoAnalysisBundle(bundle);

    if (!resolved) {

      toast({

        variant: 'destructive',

        title: 'Perímetro indisponível',

        description: 'A análise selecionada não tem polígono válido.',

      });

      return;

    }

    applyFromPolygon(resolved, resolved.sourceLabel, 'geo_analysis');

  };



  const analiseUrl = projectId

    ? `/analise-ambiental?empreendimentoId=${encodeURIComponent(projectId)}`

    : '/analise-ambiental';



  return (

    <Card className="border-primary/20 bg-primary/5">

      <CardHeader className="pb-2">

        <CardTitle className="flex items-center gap-2 text-base">

          <MapPin className="h-5 w-5" />

          Vincular análise geoespacial e geometria (ABEA / ADA)

        </CardTitle>

        <CardDescription>

          Importe perímetro do empreendimento (KML, CAR, georef) e/ou textos da{' '}

          <Link href={analiseUrl} className="underline font-medium">

            Análise Geoespacial (IA)

          </Link>

          .

        </CardDescription>

      </CardHeader>

      <CardContent className="grid gap-4">

        <div className="grid gap-3 rounded-md border p-3 bg-background">

          <Label className="text-sm font-medium">Geometria do empreendimento (KML / SHP / cadastro)</Label>

          {!projectId?.trim() ? (

            <p className="text-xs text-muted-foreground">

              Selecione o empreendimento na aba Identificação para carregar geometria do CAR ou georef.

            </p>

          ) : loadingGeom ? (

            <p className="text-xs text-muted-foreground flex items-center gap-2">

              <Loader2 className="h-3 w-3 animate-spin" />

              Buscando geometrias do empreendimento…

            </p>

          ) : geomCandidates.length === 0 ? (

            <p className="text-xs text-muted-foreground">

              Nenhuma geometria cadastrada para este empreendimento. Envie um KML abaixo ou cadastre SHP no CAR.

            </p>

          ) : (

            <div className="grid gap-2">

              <Select value={selectedGeomId} onValueChange={setSelectedGeomId}>

                <SelectTrigger>

                  <SelectValue placeholder="Fonte de geometria" />

                </SelectTrigger>

                <SelectContent>

                  {geomCandidates.map((c) => (

                    <SelectItem key={c.id} value={c.id}>

                      {c.label}

                      {c.areaHa != null ? ` · ${c.areaHa.toFixed(2)} ha` : ''}

                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

              <Button

                type="button"

                variant="secondary"

                size="sm"

                disabled={!selectedGeomId || importingFile}

                onClick={handleApplyProjectGeometry}

              >

                {importingFile ? (

                  <Loader2 className="h-4 w-4 animate-spin mr-1" />

                ) : null}

                Aplicar polígono à ABEA/ADA

              </Button>

            </div>

          )}

          <div className="flex flex-wrap items-center gap-2">

            <Input

              ref={fileRef}

              type="file"

              className="hidden"

              accept=".kml,.kmz,.xml,.geojson,.json,.zip,.shp"

              onChange={handleFileChange}

            />

            <Button

              type="button"

              variant="outline"

              size="sm"

              disabled={importingFile}

              onClick={() => fileRef.current?.click()}

            >

              {importingFile ? (

                <Loader2 className="h-4 w-4 animate-spin mr-1" />

              ) : (

                <Upload className="h-4 w-4 mr-1" />

              )}

              Importar KML / GeoJSON / SHP

            </Button>

            <div className="flex items-center space-x-2">

              <Checkbox

                id="pea-abea-amp"

                checked={sugerirAbeaAmpliada}

                onCheckedChange={(c) => setSugerirAbeaAmpliada(!!c)}

              />

              <Label htmlFor="pea-abea-amp" className="font-normal text-xs">

                Incluir nota de ampliação da ABEA em relação à ADA

              </Label>

            </div>

          </div>

        </div>



        {loadingList ? (

          <p className="text-sm text-muted-foreground flex items-center gap-2">

            <Loader2 className="h-4 w-4 animate-spin" />

            Carregando análises…

          </p>

        ) : analyses.length === 0 ? (

          <p className="text-sm text-muted-foreground">

            Nenhuma análise factual encontrada

            {projectId ? ' para este empreendimento' : ''}. Gere o relatório em{' '}

            <Link href={analiseUrl} className="underline">

              Análise Geoespacial

            </Link>

            .

          </p>

        ) : (

          <>

            <div className="grid gap-2">

              <Label>Análise salva (geo_analyses)</Label>

              <Select value={selectedId} onValueChange={setSelectedId}>

                <SelectTrigger>

                  <SelectValue placeholder="Selecione uma análise" />

                </SelectTrigger>

                <SelectContent>

                  {analyses.map((a) => (

                    <SelectItem key={a.id} value={a.id}>

                      {a.areaHa.toFixed(2)} ha · {a.okCount}/{a.total} ·{' '}

                      {a.generatedAtUtc.slice(0, 10)}

                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

            </div>



            <div className="grid gap-3 rounded-md border p-3 bg-background">

              <Label className="text-sm font-medium">Modo de preenchimento dos textos</Label>

              <RadioGroup

                value={modo}

                onValueChange={(v) => setModo(v as GeoToPeaImportMode)}

                className="flex flex-col gap-2"

              >

                <div className="flex items-center space-x-2">

                  <RadioGroupItem value="anexar" id="geo-anexar" />

                  <Label htmlFor="geo-anexar" className="font-normal">

                    Anexar — mantém o texto atual e acrescenta bloco importado

                  </Label>

                </div>

                <div className="flex items-center space-x-2">

                  <RadioGroupItem value="substituir" id="geo-subst" />

                  <Label htmlFor="geo-subst" className="font-normal">

                    Substituir — sobrescreve os campos ABEA/ADA

                  </Label>

                </div>

              </RadioGroup>



              <div className="flex flex-col gap-2 pt-1">

                <div className="flex items-center space-x-2">

                  <Checkbox

                    id="geo-socio"

                    checked={incluirSocio}

                    onCheckedChange={(c) => setIncluirSocio(!!c)}

                  />

                  <Label htmlFor="geo-socio" className="font-normal text-sm">

                    Incluir contexto socioeconômico (complemento IA)

                  </Label>

                </div>

                <div className="flex items-center space-x-2">

                  <Checkbox

                    id="geo-tabela"

                    checked={incluirTabela}

                    onCheckedChange={(c) => setIncluirTabela(!!c)}

                  />

                  <Label htmlFor="geo-tabela" className="font-normal text-sm">

                    Incluir tabela de camadas na nota ADA

                  </Label>

                </div>

                <div className="flex items-center space-x-2">

                  <Checkbox

                    id="geo-fisico"

                    checked={incluirFisico}

                    onCheckedChange={(c) => setIncluirFisico(!!c)}

                  />

                  <Label htmlFor="geo-fisico" className="font-normal text-sm">

                    Incluir resumo do meio físico na ABEA

                  </Label>

                </div>

                <div className="flex items-center space-x-2">

                  <Checkbox

                    id="geo-auto"

                    checked={autoApply}

                    onCheckedChange={(c) => setAutoApply(!!c)}

                  />

                  <Label htmlFor="geo-auto" className="font-normal text-sm">

                    Aplicar textos da análise automaticamente ao selecionar

                  </Label>

                </div>

              </div>

            </div>



            {loadingBundle && (

              <p className="text-xs text-muted-foreground flex items-center gap-2">

                <Loader2 className="h-3 w-3 animate-spin" />

                Carregando pacote factual…

              </p>

            )}



            {bundle && (

              <p className="text-xs text-muted-foreground">

                Perímetro: {bundle.wave.perimeter.areaHa.toFixed(2)} ha · ID:{' '}

                {bundle.analysisId.slice(0, 12)}…

              </p>

            )}



            <div className="flex flex-wrap gap-2">

              <Button

                type="button"

                variant="secondary"

                size="sm"

                disabled={!bundle}

                onClick={() => bundle && applyFromBundle(bundle)}

              >

                Aplicar textos da análise (camadas)

              </Button>

              <Button

                type="button"

                variant="outline"

                size="sm"

                disabled={!bundle}

                onClick={handleApplyPerimeterFromSelectedAnalysis}

              >

                Aplicar só perímetro (polígono)

              </Button>

              <Button type="button" variant="outline" size="sm" asChild>

                <Link href={analiseUrl} target="_blank">

                  <ExternalLink className="h-4 w-4 mr-1" />

                  Nova análise

                </Link>

              </Button>

            </div>

          </>

        )}

      </CardContent>

    </Card>

  );

}

