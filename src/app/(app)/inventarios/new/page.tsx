'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrDateInput } from '@/components/form/br-date-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { InventarioStatus, Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const STATUS_OPTIONS: { value: InventarioStatus; label: string }[] = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'em_campo', label: 'Em campo' },
  { value: 'sincronizado', label: 'Sincronizado' },
];

export default function NewInventarioPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [empreendimentoId, setEmpreendimentoId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [status, setStatus] = useState<InventarioStatus>('rascunho');
  const [submitting, setSubmitting] = useState(false);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore]
  );
  const { data: projects } = useCollection<Project>(projectsQuery);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firestore || !empreendimentoId.trim()) {
      toast({ title: 'Selecione o empreendimento', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(firestore, 'inventarios'), {
        empreendimentoId: empreendimentoId.trim(),
        dataInicio: dataInicio.trim() || undefined,
        dataFim: dataFim.trim() || undefined,
        status,
        sincronizado: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Inventário criado' });
      router.push(`/inventarios/${ref.id}`);
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Novo inventário" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Dados do inventário</CardTitle>
            <CardDescription>
              Campanha de inventário florestal para um empreendimento. Depois você adiciona parcelas e indivíduos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label>Empreendimento *</Label>
                <Select value={empreendimentoId} onValueChange={setEmpreendimentoId} required>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.propertyName ?? p.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data início</Label>
                  <BrDateInput value={dataInicio} onChange={setDataInicio} />
                </div>
                <div className="grid gap-2">
                  <Label>Data fim</Label>
                  <BrDateInput value={dataFim} onChange={setDataFim} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as InventarioStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar inventário
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/inventarios')}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
