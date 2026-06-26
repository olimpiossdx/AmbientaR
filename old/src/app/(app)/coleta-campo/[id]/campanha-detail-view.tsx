'use client';

import * as React from 'react';
import { useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDoc, useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, updateDoc, where, limit, serverTimestamp } from 'firebase/firestore';
import type { Empreendedor, Inventario, InventarioIndividuo, InventarioParcela, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, Loader2, ListTree, PlusCircle, CheckCircle2, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ColetaOfflineBanner } from '@/components/coleta-campo/coleta-offline-banner';
import {
  CAMPANHA_STATUS_LABEL,
  COLETA_CAMPO_BASE,
  suggestParcelaCodigo,
} from '@/lib/coleta-campo/constants';
import { addColetaDoc } from '@/lib/coleta-campo/offline-write';
import { downloadCampanhaExcel } from '@/lib/coleta-campo/export-excel';
import { consolidateCampanhaToStorage } from '@/lib/coleta-campo/consolidate-campanha';
import {
  buildAreaAmarracaoFromInputs,
  emptyVerticesForm,
  parseLatLngFromCoordenadasString,
  type VerticeForm,
} from '@/lib/coleta-campo/coords';
import { CoordinateStringField } from '@/components/coordinates';
import { Alert, AlertDescription } from '@/components/ui/alert';

function formatDate(value: unknown): string {
  if (!value) return 'ÔÇö';
  if (typeof value === 'string') return value;
  const date = (value as { toDate?: () => Date })?.toDate
    ? (value as { toDate: () => Date }).toDate()
    : new Date(value as string);
  return date.toLocaleDateString('pt-BR');
}

export function CampanhaDetailView() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [newParcelaOpen, setNewParcelaOpen] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [area, setArea] = useState('');
  const [centralCoordenadas, setCentralCoordenadas] = useState('');
  const [vertices, setVertices] = useState<VerticeForm[]>(emptyVerticesForm);
  const [up, setUp] = useState('');
  const [us, setUs] = useState('');
  const [ni, setNi] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [consolidating, setConsolidating] = useState(false);

  const campanhaRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'inventarios', id) : null),
    [firestore, id],
  );
  const { data: campanha, isLoading } = useDoc<Inventario>(campanhaRef);

  const parcelasQuery = useMemoFirebase(
    () =>
      firestore && id
        ? query(
            collection(firestore, 'inventario_parcelas'),
            where('inventarioId', '==', id),
            limit(500),
          )
        : null,
    [firestore, id],
  );
  const { data: parcelas } = useCollection<InventarioParcela>(parcelasQuery);

  const individuosQuery = useMemoFirebase(
    () =>
      firestore && id
        ? query(
            collection(firestore, 'inventario_individuos'),
            where('inventarioId', '==', id),
            limit(2000),
          )
        : null,
    [firestore, id],
  );
  const { data: individuos } = useCollection<InventarioIndividuo>(individuosQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'projects'), limit(200)) : null),
    [firestore],
  );
  const { data: projects } = useCollection<Project>(projectsQuery);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'empreendedores'), limit(200)) : null),
    [firestore],
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const titulo = useMemo(() => {
    if (!campanha) return 'Campanha';
    if (campanha.modo === 'solta') {
      return campanha.nomeEmpreendimentoManual ?? 'Campanha solta';
    }
    const emp =
      projects?.find((p) => p.id === campanha.empreendimentoId)?.propertyName ??
      campanha.empreendimentoId ??
      'ÔÇö';
    return emp;
  }, [campanha, projects]);

  const parcelasSorted = useMemo(
    () =>
      [...(parcelas ?? [])].sort((a, b) => {
        const oa = a.ordem ?? 0;
        const ob = b.ordem ?? 0;
        if (oa !== ob) return oa - ob;
        return String(a.codigo ?? '').localeCompare(String(b.codigo ?? ''), 'pt-BR');
      }),
    [parcelas],
  );

  const isMultinivel = campanha?.tipoInventario === 'multinivel';

  const openNovaParcela = useCallback(() => {
    setCodigo(suggestParcelaCodigo(parcelas?.length ?? 0));
    setArea('');
    setCentralCoordenadas('');
    setVertices(emptyVerticesForm());
    setUp('');
    setUs('');
    setNi('');
    setObservacoes('');
    setNewParcelaOpen(true);
  }, [parcelas?.length]);

  const addParcela = useCallback(async () => {
    if (!firestore || !campanha) return;
    setSubmitting(true);
    try {
      const ordem = (parcelas?.length ?? 0) + 1;
      const central = parseLatLngFromCoordenadasString(centralCoordenadas);
      const parcelaId = await addColetaDoc(firestore, 'inventario_parcelas', {
        inventarioId: campanha.id,
        codigo: codigo.trim() || suggestParcelaCodigo(parcelas?.length ?? 0),
        area: area.trim() ? Number(area.replace(',', '.')) : undefined,
        latitude: central.latitude,
        longitude: central.longitude,
        areaAmarracao: buildAreaAmarracaoFromInputs(vertices),
        ...(isMultinivel
          ? {
              up: up.trim() || undefined,
              us: us.trim() || undefined,
              ni: ni.trim() || undefined,
            }
          : {}),
        ordem,
        observacoes: observacoes.trim() || undefined,
      });
      toast({ title: 'Parcela criada', description: 'Registre os indiv├¡duos nesta parcela.' });
      setNewParcelaOpen(false);
      router.push(`${COLETA_CAMPO_BASE}/${id}/parcelas/${parcelaId}`);
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [
    firestore,
    campanha,
    codigo,
    area,
    centralCoordenadas,
    vertices,
    up,
    us,
    ni,
    observacoes,
    parcelas?.length,
    isMultinivel,
    id,
    router,
    toast,
  ]);

  const runConsolidacao = useCallback(
    async (markConcluida: boolean) => {
      if (!firestore || !campanha || !parcelas || !individuos) return null;
      setConsolidating(true);
      try {
        const result = await consolidateCampanhaToStorage(
          firestore,
          { campanha, parcelas, individuos },
          { markConcluida },
        );
        const errors = result.issues.filter((i) => i.level === 'error');
        if (errors.length) {
          toast({
            title: markConcluida ? 'N├úo foi poss├¡vel concluir' : 'Consolida├º├úo bloqueada',
            description: errors[0].message,
            variant: 'destructive',
          });
          return null;
        }
        const warns = result.issues.filter((i) => i.level === 'warn');
        if (warns.length) {
          toast({ title: 'Planilha consolidada', description: warns[0].message });
        }
        return result;
      } catch (err) {
        toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
        return null;
      } finally {
        setConsolidating(false);
      }
    },
    [firestore, campanha, parcelas, individuos, toast],
  );

  const marcarConcluida = useCallback(async () => {
    const result = await runConsolidacao(true);
    if (!result) return;
    toast({
      title: 'Campanha conclu├¡da',
      description:
        'Planilha Excel consolidada e salva. Importe em Invent├írio Florestal (planilha ou Carregar da Coleta).',
    });
  }, [runConsolidacao, toast]);

  const reconsolidarPlanilha = useCallback(async () => {
    const result = await runConsolidacao(false);
    if (!result) return;
    toast({
      title: 'Planilha atualizada',
      description: 'Arquivo consolidado salvo no m├│dulo para importa├º├úo no escrit├│rio.',
    });
  }, [runConsolidacao, toast]);

  const exportarExcel = useCallback(async () => {
    if (!campanha || !parcelas || !individuos) return;
    setExporting(true);
    try {
      const issues = downloadCampanhaExcel({
        campanha,
        parcelas,
        individuos,
      });
      const errors = issues.filter((i) => i.level === 'error');
      if (errors.length) {
        toast({ title: 'Exporta├º├úo bloqueada', description: errors[0].message, variant: 'destructive' });
        return;
      }
      if (campanha.status === 'concluida' && firestore) {
        await consolidateCampanhaToStorage(
          firestore,
          { campanha, parcelas, individuos },
          { markConcluida: false },
        );
      }
      const warns = issues.filter((i) => i.level === 'warn');
      if (warns.length) {
        toast({ title: 'Excel gerado', description: warns[0].message });
      } else {
        toast({
          title: 'Excel gerado',
          description:
            campanha.status === 'concluida'
              ? 'Download local e c├│pia consolidada atualizada no m├│dulo.'
              : 'Importe em Invent├írio Florestal ÔåÆ Importar planilha ou conclua a campanha para salvar no m├│dulo.',
        });
      }
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }, [campanha, parcelas, individuos, firestore, toast]);

  if (isLoading || !campanha) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Campanha" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  const empreendedorNome =
    campanha.modo === 'solta'
      ? campanha.nomeEmpreendedorManual
      : empreendedores?.find((e) => e.id === campanha.empreendedorId)?.name;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={titulo}>
        <Button variant="outline" size="sm" className="min-h-9" asChild>
          <Link href={COLETA_CAMPO_BASE}>Voltar</Link>
        </Button>
        <Button size="sm" className="gap-1 min-h-10" onClick={openNovaParcela}>
          <PlusCircle className="h-4 w-4" />
          Nova parcela
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        <ColetaOfflineBanner />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumo</CardTitle>
            <CardDescription>
              {campanha.modo === 'solta' ? 'Solta' : 'Vinculada'} ┬À{' '}
              {isMultinivel ? 'Multin├¡vel' : 'Simples'} ┬À{' '}
              {CAMPANHA_STATUS_LABEL[campanha.status ?? 'rascunho']}
              {empreendedorNome ? ` ┬À ${empreendedorNome}` : ''}
              {campanha.localManual ? ` ┬À ${campanha.localManual}` : ''}
              <br />
              In├¡cio: {formatDate(campanha.dataInicio)} ┬À Fim: {formatDate(campanha.dataFim)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              variant="secondary"
              className="min-h-11 gap-2"
              onClick={() => void exportarExcel()}
              disabled={exporting || consolidating}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Exportar Excel
            </Button>
            {campanha.status === 'concluida' ? (
              <Button
                variant="outline"
                className="min-h-11 gap-2"
                onClick={() => void reconsolidarPlanilha()}
                disabled={consolidating || exporting}
              >
                {consolidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Atualizar planilha consolidada
              </Button>
            ) : (
              <Button
                variant="outline"
                className="min-h-11 gap-2"
                onClick={() => void marcarConcluida()}
                disabled={consolidating || exporting}
              >
                {consolidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Marcar conclu├¡da e consolidar
              </Button>
            )}
            {campanha.exportConsolidatedAt && campanha.exportSummary ? (
              <p className="w-full text-xs text-muted-foreground pt-1">
                Planilha salva no m├│dulo: {campanha.exportSummary.totalTrees} ├írvores,{' '}
                {campanha.exportSummary.totalParcels} parcelas ÔÇö dispon├¡vel para importa├º├úo no
                Invent├írio Florestal.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Alert>
          <AlertDescription className="text-sm">
            Termine cada parcela (├írvores) e use <strong>Nova parcela</strong> para a seguinte. Ao{' '}
            <strong>Marcar conclu├¡da e consolidar</strong>, a planilha Excel fica salva neste m├│dulo para
            importa├º├úo em <strong>Invent├írio Florestal</strong> (planilha ou carregamento direto).
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTree className="h-5 w-5" />
              Parcelas ({parcelasSorted.length})
            </CardTitle>
            <CardDescription>Toque em uma parcela para lan├ºar ├írvores.</CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="space-y-4">
                {!parcelasSorted.length ? (
                  <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                    Nenhuma parcela. Use &quot;Nova parcela&quot; para come├ºar pela P01.
                  </div>
                ) : (
                  parcelasSorted.map((p) => {
                    const nInd = individuos?.filter((i) => i.parcelaId === p.id).length ?? 0;
                    const coords =
                      p.latitude != null || p.longitude != null
                        ? `Central: ${p.latitude ?? 'ÔÇö'}, ${p.longitude ?? 'ÔÇö'}`
                        : null;
                    return (
                      <Card
                        key={p.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-1.5">
                              <h3 className="text-base font-semibold leading-snug text-foreground sm:text-lg">
                                Parcela {p.codigo ?? p.id}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {nInd} ├írvore(s)
                                {p.area != null ? ` ┬À ${p.area} m┬▓` : ''}
                              </p>
                              {coords ? (
                                <p className="text-xs text-muted-foreground sm:text-sm">{coords}</p>
                              ) : null}
                              {p.areaAmarracao?.length ? (
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                  Amarra├º├úo: {p.areaAmarracao.length} v├®rtice(s)
                                </p>
                              ) : null}
                            </div>
                            <Separator className="bg-border/60" />
                            <div className="flex flex-wrap items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    asChild
                                  >
                                    <Link href={`${COLETA_CAMPO_BASE}/${id}/parcelas/${p.id}`}>
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">Abrir parcela</span>
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Abrir parcela e lan├ºar ├írvores</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </main>

      <Dialog open={newParcelaOpen} onOpenChange={setNewParcelaOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova parcela</DialogTitle>
            <DialogDescription>
              Parcela {(parcelas?.length ?? 0) + 1}. Sem limite de parcelas na campanha.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>C├│digo *</Label>
              <Input className="min-h-11" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </div>
            {isMultinivel && (
              <div className="grid grid-cols-3 gap-2">
                <div className="grid gap-2">
                  <Label>UP</Label>
                  <Input value={up} onChange={(e) => setUp(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>US</Label>
                  <Input value={us} onChange={(e) => setUs(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>NI</Label>
                  <Input value={ni} onChange={(e) => setNi(e.target.value)} />
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label>├ürea da parcela (m┬▓)</Label>
              <Input className="min-h-11" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">Coordenada central</p>
              <CoordinateStringField
                value={centralCoordenadas}
                onChange={setCentralCoordenadas}
              />
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">├ürea de amarra├º├úo</p>
                <p className="text-xs text-muted-foreground">
                  Quatro v├®rtices (pol├¡gono fechado). Informe GMS ou UTM de cada canto (SIRGAS 2000).
                </p>
              </div>
              {vertices.map((v, index) => (
                <div key={index} className="space-y-2 border-t pt-3 first:border-t-0 first:pt-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    V├®rtice {index + 1}
                  </p>
                  <CoordinateStringField
                    value={v.coordenadas}
                    onChange={(coordenadas) => {
                      const next = [...vertices];
                      next[index] = { coordenadas };
                      setVertices(next);
                    }}
                    className="border-0 p-0"
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              <Label>Observa├º├Áes</Label>
              <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setNewParcelaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addParcela} disabled={submitting} className="min-h-11">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar e lan├ºar ├írvores
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
