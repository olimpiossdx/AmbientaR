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
import type { Inventario, InventarioParcela, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2, ListTree } from 'lucide-react';

const INVENTARIO_STATUS_LABEL: Record<NonNullable<Inventario['status']>, string> = {
  rascunho: 'Rascunho',
  em_campo: 'Em campo',
  sincronizado: 'Sincronizado',
};

function formatDate(value: string | any): string {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleDateString('pt-BR');
}

export default function InventarioDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [newParcelaOpen, setNewParcelaOpen] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inventarioRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'inventarios', id) : null),
    [firestore, id]
  );
  const { data: inventario, isLoading } = useDoc<Inventario>(inventarioRef);

  const parcelasQuery = useMemoFirebase(
    () => (firestore && id ? query(collection(firestore, 'inventario_parcelas'), where('inventarioId', '==', id)) : null),
    [firestore, id]
  );
  const { data: parcelas } = useCollection<InventarioParcela>(parcelasQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore]
  );
  const { data: projects } = useCollection<Project>(projectsQuery);
  const empreendimentoNome = useMemo(
    () => projects?.find((p) => p.id === inventario?.empreendimentoId)?.propertyName ?? inventario?.empreendimentoId ?? '—',
    [projects, inventario]
  );

  const addParcela = useCallback(async () => {
    if (!firestore || !inventario) return;
    setSubmitting(true);
    try {
      await addDoc(collection(firestore, 'inventario_parcelas'), {
        inventarioId: inventario.id,
        codigo: codigo.trim() || undefined,
        latitude: latitude.trim() ? Number(latitude.replace(',', '.')) : undefined,
        longitude: longitude.trim() ? Number(longitude.replace(',', '.')) : undefined,
        observacoes: observacoes.trim() || undefined,
        sincronizado: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Parcela adicionada' });
      setCodigo('');
      setLatitude('');
      setLongitude('');
      setObservacoes('');
      setNewParcelaOpen(false);
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [firestore, inventario, codigo, latitude, longitude, observacoes, toast]);

  if (isLoading || !inventario) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Inventário" />
        <main className="flex-1 p-4 md:p-6"><Skeleton className="h-64 w-full" /></main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={`Inventário — ${empreendimentoNome}`}>
        <Button variant="outline" size="sm" asChild>
          <Link href="/inventarios">Voltar</Link>
        </Button>
        <Button size="sm" className="gap-1" onClick={() => setNewParcelaOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          Nova parcela
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do inventário</CardTitle>
            <CardDescription>
              Empreendimento: {empreendimentoNome} · Início: {formatDate(inventario.dataInicio)} · Fim: {formatDate(inventario.dataFim)} · {INVENTARIO_STATUS_LABEL[inventario.status ?? 'rascunho']}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTree className="h-5 w-5" />
              Parcelas ({parcelas?.length ?? 0})
            </CardTitle>
            <CardDescription>
              Pontos de amostragem. Clique em &quot;Indivíduos&quot; para registrar árvores na parcela.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!parcelas?.length ? (
              <p className="text-sm text-muted-foreground">Nenhuma parcela. Clique em &quot;Nova parcela&quot;.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Latitude</TableHead>
                    <TableHead>Longitude</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcelas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.codigo ?? '—'}</TableCell>
                      <TableCell>{p.latitude != null ? p.latitude : '—'}</TableCell>
                      <TableCell>{p.longitude != null ? p.longitude : '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{p.observacoes ?? '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/inventarios/${id}/parcelas/${p.id}`}>Indivíduos</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={newParcelaOpen} onOpenChange={setNewParcelaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova parcela</DialogTitle>
            <DialogDescription>Ponto de amostragem (código, coordenadas, observações).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Código</Label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: P01" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Latitude</Label>
                <Input type="text" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-20.123" />
              </div>
              <div className="grid gap-2">
                <Label>Longitude</Label>
                <Input type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-44.456" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewParcelaOpen(false)}>Cancelar</Button>
            <Button onClick={addParcela} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar parcela
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
