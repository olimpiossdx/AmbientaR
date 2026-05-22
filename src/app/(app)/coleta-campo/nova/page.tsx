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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type {
  ColetaCampanhaModo,
  ColetaTipoInventario,
  Empreendedor,
  InventarioStatus,
  Project,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ColetaOfflineBanner } from '@/components/coleta-campo/coleta-offline-banner';
import { COLETA_CAMPO_BASE } from '@/lib/coleta-campo/constants';
import { addColetaDoc } from '@/lib/coleta-campo/offline-write';

export default function NovaCampanhaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const [modo, setModo] = useState<ColetaCampanhaModo>('vinculada');
  const [tipoInventario, setTipoInventario] = useState<ColetaTipoInventario>('simples');
  const [empreendimentoId, setEmpreendimentoId] = useState('');
  const [empreendedorId, setEmpreendedorId] = useState('');
  const [nomeEmpreendimentoManual, setNomeEmpreendimentoManual] = useState('');
  const [nomeEmpreendedorManual, setNomeEmpreendedorManual] = useState('');
  const [localManual, setLocalManual] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore],
  );
  const { data: projects } = useCollection<Project>(projectsQuery);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore],
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firestore) return;

    if (modo === 'vinculada' && !empreendimentoId.trim()) {
      toast({ title: 'Selecione o empreendimento', variant: 'destructive' });
      return;
    }
    if (modo === 'solta' && !nomeEmpreendimentoManual.trim()) {
      toast({ title: 'Informe o nome do empreendimento', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const status: InventarioStatus = 'em_campo';
      const payload: Record<string, unknown> = {
        modo,
        tipoInventario,
        status,
        dataInicio: dataInicio.trim() || undefined,
        dataFim: dataFim.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        sincronizado: false,
      };

      if (modo === 'vinculada') {
        payload.empreendimentoId = empreendimentoId.trim();
        if (empreendedorId.trim()) payload.empreendedorId = empreendedorId.trim();
      } else {
        payload.nomeEmpreendimentoManual = nomeEmpreendimentoManual.trim();
        payload.nomeEmpreendedorManual = nomeEmpreendedorManual.trim() || undefined;
        payload.localManual = localManual.trim() || undefined;
      }

      const id = await addColetaDoc(firestore, 'inventarios', payload);
      toast({ title: 'Campanha criada', description: 'Comece pela primeira parcela.' });
      router.push(`${COLETA_CAMPO_BASE}/${id}`);
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Nova campanha de coleta" />
      <main className="flex-1 overflow-auto p-4 md:p-6 max-w-xl mx-auto w-full">
        <ColetaOfflineBanner />
        <Card>
          <CardHeader>
            <CardTitle>Dados da campanha</CardTitle>
            <CardDescription>
              Vinculada usa empreendimento da base. Solta permite atender cliente externo com preenchimento manual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label>Modo</Label>
                <RadioGroup
                  value={modo}
                  onValueChange={(v) => setModo(v as ColetaCampanhaModo)}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vinculada" id="modo-vinculada" />
                    <Label htmlFor="modo-vinculada" className="font-normal">
                      Vinculada (empreendimento na base)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solta" id="modo-solta" />
                    <Label htmlFor="modo-solta" className="font-normal">
                      Solta (preencher manualmente em campo)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Tipo de inventário</Label>
                <RadioGroup
                  value={tipoInventario}
                  onValueChange={(v) => setTipoInventario(v as ColetaTipoInventario)}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="simples" id="tipo-simples" />
                    <Label htmlFor="tipo-simples" className="font-normal">
                      Simples (planilha padrão)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="multinivel" id="tipo-multinivel" />
                    <Label htmlFor="tipo-multinivel" className="font-normal">
                      Multinível (+ colunas UP, US, NI)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {modo === 'vinculada' ? (
                <>
                  <div className="grid gap-2">
                    <Label>Empreendimento *</Label>
                    <Select value={empreendimentoId} onValueChange={setEmpreendimentoId}>
                      <SelectTrigger className="min-h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.propertyName ?? p.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Empreendedor</Label>
                    <Select value={empreendedorId} onValueChange={setEmpreendedorId}>
                      <SelectTrigger className="min-h-11">
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        {empreendedores?.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label>Nome do empreendimento *</Label>
                    <Input
                      className="min-h-11"
                      value={nomeEmpreendimentoManual}
                      onChange={(e) => setNomeEmpreendimentoManual(e.target.value)}
                      placeholder="Ex.: Fazenda Santa Rita"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Empreendedor / contratante</Label>
                    <Input
                      className="min-h-11"
                      value={nomeEmpreendedorManual}
                      onChange={(e) => setNomeEmpreendedorManual(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Local / município</Label>
                    <Input
                      className="min-h-11"
                      value={localManual}
                      onChange={(e) => setLocalManual(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label>Observações</Label>
                <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button type="submit" disabled={submitting} className="min-h-11 flex-1">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar e ir para parcelas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => router.push(COLETA_CAMPO_BASE)}
                >
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
