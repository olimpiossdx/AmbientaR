'use client';

import * as React from 'react';
import { useMemo, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDoc, useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import type { InventarioParcela, InventarioIndividuo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2 } from 'lucide-react';

export default function ParcelaDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const parcelaId = params?.parcelaId as string;
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [newIndividuoOpen, setNewIndividuoOpen] = useState(false);
  const [numero, setNumero] = useState('');
  const [especie, setEspecie] = useState('');
  const [dap, setDap] = useState('');
  const [altura, setAltura] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const parcelaRef = useMemoFirebase(
    () => (firestore && parcelaId ? doc(firestore, 'inventario_parcelas', parcelaId) : null),
    [firestore, parcelaId]
  );
  const { data: parcela, isLoading } = useDoc<InventarioParcela>(parcelaRef);

  const individuosQuery = useMemoFirebase(
    () => (firestore && parcelaId ? query(collection(firestore, 'inventario_individuos'), where('parcelaId', '==', parcelaId)) : null),
    [firestore, parcelaId]
  );
  const { data: individuos } = useCollection<InventarioIndividuo>(individuosQuery);

  const addIndividuo = useCallback(async () => {
    if (!firestore || !parcela) return;
    setSubmitting(true);
    try {
      await addDoc(collection(firestore, 'inventario_individuos'), {
        parcelaId: parcela.id,
        numero: numero.trim() ? Number(numero.replace(',', '.')) : undefined,
        especie: especie.trim() || undefined,
        dap: dap.trim() ? Number(dap.replace(',', '.')) : undefined,
        altura: altura.trim() ? Number(altura.replace(',', '.')) : undefined,
        sincronizado: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Indivíduo adicionado' });
      setNumero('');
      setEspecie('');
      setDap('');
      setAltura('');
      setNewIndividuoOpen(false);
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [firestore, parcela, numero, especie, dap, altura, toast]);

  if (isLoading || !parcela) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Parcela" />
        <main className="flex-1 p-4 md:p-6"><Skeleton className="h-64 w-full" /></main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={`Parcela ${parcela.codigo ?? parcelaId}`}>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/inventarios/${id}`}>Voltar ao inventário</Link>
        </Button>
        <Button size="sm" className="gap-1" onClick={() => setNewIndividuoOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          Novo indivíduo
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados da parcela</CardTitle>
            <CardDescription>
              Código: {parcela.codigo ?? '—'} · Lat: {parcela.latitude ?? '—'} · Long: {parcela.longitude ?? '—'}
              {parcela.observacoes && ` · ${parcela.observacoes}`}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Indivíduos ({individuos?.length ?? 0})</CardTitle>
            <CardDescription>Árvores amostradas nesta parcela (espécie, DAP, altura).</CardDescription>
          </CardHeader>
          <CardContent>
            {!individuos?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum indivíduo. Clique em &quot;Novo indivíduo&quot;.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Espécie</TableHead>
                    <TableHead>DAP (cm)</TableHead>
                    <TableHead>Altura (m)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {individuos.map((ind) => (
                    <TableRow key={ind.id}>
                      <TableCell>{ind.numero ?? '—'}</TableCell>
                      <TableCell>{ind.especie ?? '—'}</TableCell>
                      <TableCell>{ind.dap != null ? ind.dap : '—'}</TableCell>
                      <TableCell>{ind.altura != null ? ind.altura : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={newIndividuoOpen} onOpenChange={setNewIndividuoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo indivíduo</DialogTitle>
            <DialogDescription>Árvore na parcela (número, espécie, DAP, altura).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Número</Label>
                <Input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="1" />
              </div>
              <div className="grid gap-2">
                <Label>Espécie</Label>
                <Input value={especie} onChange={(e) => setEspecie(e.target.value)} placeholder="Nome científico ou comum" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>DAP (cm)</Label>
                <Input type="text" value={dap} onChange={(e) => setDap(e.target.value)} placeholder="Ex.: 25.5" />
              </div>
              <div className="grid gap-2">
                <Label>Altura (m)</Label>
                <Input type="text" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="Ex.: 12" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewIndividuoOpen(false)}>Cancelar</Button>
            <Button onClick={addIndividuo} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar indivíduo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
