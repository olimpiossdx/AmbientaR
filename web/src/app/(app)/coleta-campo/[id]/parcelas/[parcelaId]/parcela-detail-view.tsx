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
import { collection, doc, query, where } from 'firebase/firestore';
import type { Inventario, InventarioIndividuo, InventarioParcela } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ColetaOfflineBanner } from '@/components/coleta-campo/coleta-offline-banner';
import { COLETA_CAMPO_BASE } from '@/lib/coleta-campo/constants';
import { addColetaDoc } from '@/lib/coleta-campo/offline-write';

export function ParcelaDetailView() {
  const params = useParams();
  const campanhaId = params?.id as string;
  const parcelaId = params?.parcelaId as string;
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [numero, setNumero] = useState('');
  const [nomeCientifico, setNomeCientifico] = useState('');
  const [nomeComum, setNomeComum] = useState('');
  const [familia, setFamilia] = useState('');
  const [cap, setCap] = useState('');
  const [dap, setDap] = useState('');
  const [altura, setAltura] = useState('');
  const [altComercial, setAltComercial] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const campanhaRef = useMemoFirebase(
    () => (firestore && campanhaId ? doc(firestore, 'inventarios', campanhaId) : null),
    [firestore, campanhaId],
  );
  const { data: campanha } = useDoc<Inventario>(campanhaRef);

  const parcelaRef = useMemoFirebase(
    () => (firestore && parcelaId ? doc(firestore, 'inventario_parcelas', parcelaId) : null),
    [firestore, parcelaId],
  );
  const { data: parcela, isLoading } = useDoc<InventarioParcela>(parcelaRef);

  const individuosQuery = useMemoFirebase(
    () =>
      firestore && parcelaId
        ? query(collection(firestore, 'inventario_individuos'), where('parcelaId', '==', parcelaId))
        : null,
    [firestore, parcelaId],
  );
  const { data: individuos } = useCollection<InventarioIndividuo>(individuosQuery);

  const sortedInd = useMemo(
    () =>
      [...(individuos ?? [])].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0)),
    [individuos],
  );

  const nextNumero = useMemo(() => {
    if (!sortedInd.length) return 1;
    return Math.max(...sortedInd.map((i) => i.numero ?? 0)) + 1;
  }, [sortedInd]);

  const openDialog = useCallback(() => {
    setNumero(String(nextNumero));
    setNomeCientifico('');
    setNomeComum('');
    setFamilia('');
    setCap('');
    setDap('');
    setAltura('');
    setAltComercial('');
    setDialogOpen(true);
  }, [nextNumero]);

  const addIndividuo = useCallback(async () => {
    if (!firestore || !parcela || !campanha) return;
    setSubmitting(true);
    try {
      await addColetaDoc(firestore, 'inventario_individuos', {
        inventarioId: campanha.id,
        parcelaId: parcela.id,
        numero: numero.trim() ? Number(numero.replace(',', '.')) : nextNumero,
        nomeCientifico: nomeCientifico.trim() || undefined,
        nomeComum: nomeComum.trim() || undefined,
        especie: nomeCientifico.trim() || nomeComum.trim() || undefined,
        familia: familia.trim() || undefined,
        cap: cap.trim() ? Number(cap.replace(',', '.')) : undefined,
        dap: dap.trim() ? Number(dap.replace(',', '.')) : undefined,
        altura: altura.trim() ? Number(altura.replace(',', '.')) : undefined,
        altComercial: altComercial.trim() ? Number(altComercial.replace(',', '.')) : undefined,
      });
      toast({ title: '├ürvore registrada' });
      const savedNum = numero.trim() ? Number(numero.replace(',', '.')) : nextNumero;
      setNumero(String(savedNum + 1));
      setNomeCientifico('');
      setNomeComum('');
      setFamilia('');
      setCap('');
      setDap('');
      setAltura('');
      setAltComercial('');
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [
    firestore,
    parcela,
    campanha,
    numero,
    nomeCientifico,
    nomeComum,
    familia,
    cap,
    dap,
    altura,
    altComercial,
    nextNumero,
    toast,
  ]);

  if (isLoading || !parcela) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Parcela" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={`Parcela ${parcela.codigo ?? ''}`}>
        <Button variant="outline" size="sm" className="min-h-9" asChild>
          <Link href={`${COLETA_CAMPO_BASE}/${campanhaId}`}>Campanha</Link>
        </Button>
        <Button size="sm" className="gap-1 min-h-10" onClick={openDialog}>
          <PlusCircle className="h-4 w-4" />
          Nova ├írvore
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        <ColetaOfflineBanner />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Parcela {parcela.codigo}</CardTitle>
            <CardDescription className="space-y-1">
              {parcela.area != null ? <span>├ürea: {parcela.area} m┬▓</span> : null}
              {(parcela.latitude != null || parcela.longitude != null) && (
                <span>
                  Central: {parcela.latitude ?? 'ÔÇö'}, {parcela.longitude ?? 'ÔÇö'}
                </span>
              )}
              {parcela.areaAmarracao?.length ? (
                <span>
                  Amarra├º├úo:{' '}
                  {parcela.areaAmarracao
                    .map((v, i) => `V${i + 1} (${v.latitude}, ${v.longitude})`)
                    .join(' ┬À ')}
                </span>
              ) : null}
              {campanha?.tipoInventario === 'multinivel' &&
                (parcela.up || parcela.us || parcela.ni) && (
                  <span>
                    UP {parcela.up ?? 'ÔÇö'} ┬À US {parcela.us ?? 'ÔÇö'} ┬À NI {parcela.ni ?? 'ÔÇö'}
                  </span>
                )}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>├ürvores ({sortedInd.length})</CardTitle>
            <CardDescription>CAP em cent├¡metros. Sem limite de registros por parcela.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!sortedInd.length ? (
                <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                  Nenhuma ├írvore. Toque em Nova ├írvore.
                </div>
              ) : (
                sortedInd.map((ind) => (
                  <Card
                    key={ind.id}
                    className="overflow-hidden border-border/80 shadow-sm"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="min-w-0 space-y-1.5">
                        <h3 className="text-base font-semibold leading-snug text-foreground">
                          n┬║ {ind.numero ?? 'ÔÇö'} ┬À{' '}
                          {ind.nomeComum || ind.nomeCientifico || ind.especie || 'ÔÇö'}
                        </h3>
                        {ind.nomeCientifico && ind.nomeComum ? (
                          <p className="text-sm text-muted-foreground italic">
                            {ind.nomeCientifico}
                          </p>
                        ) : null}
                        <Separator className="bg-border/60 my-2" />
                        <p className="text-sm text-muted-foreground">
                          CAP {ind.cap ?? 'ÔÇö'} cm ┬À Alt. {ind.altura ?? 'ÔÇö'} m
                          {ind.altComercial != null ? ` ┬À Alt. com. ${ind.altComercial} m` : ''}
                          {ind.familia ? ` ┬À ${ind.familia}` : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 pb-6">
          <Button className="min-h-12" onClick={openDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova ├írvore nesta parcela
          </Button>
          <Button
            variant="secondary"
            className="min-h-12"
            onClick={() => router.push(`${COLETA_CAMPO_BASE}/${campanhaId}`)}
          >
            Terminar parcela ÔåÆ Nova parcela na campanha
          </Button>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova ├írvore</DialogTitle>
            <DialogDescription>Parcela {parcela.codigo}. Campos alinhados ao Excel de importa├º├úo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>N├║m. ├írvore</Label>
              <Input className="min-h-11" value={numero} onChange={(e) => setNumero(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Nome cient├¡fico</Label>
              <Input className="min-h-11" value={nomeCientifico} onChange={(e) => setNomeCientifico(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Nome comum</Label>
              <Input className="min-h-11" value={nomeComum} onChange={(e) => setNomeComum(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Fam├¡lia</Label>
              <Input value={familia} onChange={(e) => setFamilia(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>CAP (cm)</Label>
                <Input className="min-h-11" value={cap} onChange={(e) => setCap(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>DAP (cm)</Label>
                <Input value={dap} onChange={(e) => setDap(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>Alt. total (m)</Label>
                <Input value={altura} onChange={(e) => setAltura(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Alt. comercial (m)</Label>
                <Input value={altComercial} onChange={(e) => setAltComercial(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={addIndividuo} disabled={submitting} className="min-h-11 w-full">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar e lan├ºar outra
            </Button>
            <Button variant="outline" className="min-h-11 w-full" onClick={() => setDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
