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
import {
  buildAreaAmarracaoFromInputs,
  emptyVerticesForm,
  parseCoordInput,
  type VerticeForm,
} from '@/lib/coleta-campo/coords';
import { Alert, AlertDescription } from '@/components/ui/alert';

function formatDate(value: unknown): string {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  const date = (value as { toDate?: () => Date })?.toDate
    ? (value as { toDate: () => Date }).toDate()
    : new Date(value as string);
  return date.toLocaleDateString('pt-BR');
}

export default function CampanhaDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [newParcelaOpen, setNewParcelaOpen] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [area, setArea] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [vertices, setVertices] = useState<VerticeForm[]>(emptyVerticesForm);
  const [up, setUp] = useState('');
  const [us, setUs] = useState('');
  const [ni, setNi] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      '—';
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
    setLatitude('');
    setLongitude('');
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
      const parcelaId = await addColetaDoc(firestore, 'inventario_parcelas', {
        inventarioId: campanha.id,
        codigo: codigo.trim() || suggestParcelaCodigo(parcelas?.length ?? 0),
        area: area.trim() ? Number(area.replace(',', '.')) : undefined,
        latitude: parseCoordInput(latitude),
        longitude: parseCoordInput(longitude),
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
      toast({ title: 'Parcela criada', description: 'Registre os indivíduos nesta parcela.' });
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
    latitude,
    longitude,
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

  const marcarConcluida = useCallback(async () => {
    if (!firestore || !campanha) return;
    try {
      await updateDoc(doc(firestore, 'inventarios', campanha.id), {
        status: 'concluida',
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Campanha concluída' });
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    }
  }, [firestore, campanha, toast]);

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
        toast({ title: 'Exportação bloqueada', description: errors[0].message, variant: 'destructive' });
        return;
      }
      const warns = issues.filter((i) => i.level === 'warn');
      if (warns.length) {
        toast({ title: 'Excel gerado', description: warns[0].message });
      } else {
        toast({
          title: 'Excel gerado',
          description: 'Importe em Inventário Florestal → Importar planilha.',
        });
      }
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }, [campanha, parcelas, individuos, toast]);

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
              {campanha.modo === 'solta' ? 'Solta' : 'Vinculada'} ·{' '}
              {isMultinivel ? 'Multinível' : 'Simples'} ·{' '}
              {CAMPANHA_STATUS_LABEL[campanha.status ?? 'rascunho']}
              {empreendedorNome ? ` · ${empreendedorNome}` : ''}
              {campanha.localManual ? ` · ${campanha.localManual}` : ''}
              <br />
              Início: {formatDate(campanha.dataInicio)} · Fim: {formatDate(campanha.dataFim)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              variant="secondary"
              className="min-h-11 gap-2"
              onClick={() => void exportarExcel()}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Exportar Excel
            </Button>
            <Button variant="outline" className="min-h-11 gap-2" onClick={() => void marcarConcluida()}>
              <CheckCircle2 className="h-4 w-4" />
              Marcar concluída
            </Button>
          </CardContent>
        </Card>

        <Alert>
          <AlertDescription className="text-sm">
            Termine cada parcela (árvores) e use <strong>Nova parcela</strong> para a seguinte. O Excel
            reúne todas as linhas para importação em <strong>Inventário Florestal</strong>.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTree className="h-5 w-5" />
              Parcelas ({parcelasSorted.length})
            </CardTitle>
            <CardDescription>Toque em uma parcela para lançar árvores.</CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="space-y-4">
                {!parcelasSorted.length ? (
                  <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                    Nenhuma parcela. Use &quot;Nova parcela&quot; para começar pela P01.
                  </div>
                ) : (
                  parcelasSorted.map((p) => {
                    const nInd = individuos?.filter((i) => i.parcelaId === p.id).length ?? 0;
                    const coords =
                      p.latitude != null || p.longitude != null
                        ? `Central: ${p.latitude ?? '—'}, ${p.longitude ?? '—'}`
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
                                {nInd} árvore(s)
                                {p.area != null ? ` · ${p.area} m²` : ''}
                              </p>
                              {coords ? (
                                <p className="text-xs text-muted-foreground sm:text-sm">{coords}</p>
                              ) : null}
                              {p.areaAmarracao?.length ? (
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                  Amarração: {p.areaAmarracao.length} vértice(s)
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
                                  <p>Abrir parcela e lançar árvores</p>
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
              <Label>Código *</Label>
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
              <Label>Área da parcela (m²)</Label>
              <Input className="min-h-11" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">Coordenada central</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Latitude central</Label>
                  <Input
                    className="min-h-11"
                    inputMode="decimal"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Longitude central</Label>
                  <Input
                    className="min-h-11"
                    inputMode="decimal"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Área de amarração</p>
                <p className="text-xs text-muted-foreground">
                  Quatro vértices (polígono fechado). Preencha lat/long de cada canto da parcela.
                </p>
              </div>
              {vertices.map((v, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 text-xs font-medium text-muted-foreground">
                    Vértice {index + 1}
                  </div>
                  <div className="grid gap-2">
                    <Label>Latitude</Label>
                    <Input
                      className="min-h-11"
                      inputMode="decimal"
                      value={v.lat}
                      onChange={(e) => {
                        const next = [...vertices];
                        next[index] = { ...next[index], lat: e.target.value };
                        setVertices(next);
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Longitude</Label>
                    <Input
                      className="min-h-11"
                      inputMode="decimal"
                      value={v.lng}
                      onChange={(e) => {
                        const next = [...vertices];
                        next[index] = { ...next[index], lng: e.target.value };
                        setVertices(next);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setNewParcelaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addParcela} disabled={submitting} className="min-h-11">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar e lançar árvores
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
