'use client';

import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import type {
  Laudo,
  Consulta,
  ConsultaTipoServico,
  Empreendedor,
  Project,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  buildEmpreendedorSelectOptions,
  buildProjectSelectOptions,
  normalizeEntityId,
} from '@/lib/empreendedor-project-select';

const TIPO_ESTUDO_OPTIONS: { value: ConsultaTipoServico | string; label: string }[] = [
  { value: 'RCA', label: 'RCA' },
  { value: 'PIA', label: 'PIA' },
  { value: 'PCA', label: 'PCA' },
  { value: 'PRADA', label: 'PRADA' },
  { value: 'InventarioFlorestal', label: 'Inventário Florestal' },
  { value: 'Fauna', label: 'Fauna' },
  { value: 'Outorgas', label: 'Outorgas' },
  { value: 'EducacaoAmbiental', label: 'Educação Ambiental' },
  { value: 'RelatorioDiverso', label: 'Relatório Diverso' },
  { value: 'Outro', label: 'Outro' },
];

export default function NewLaudoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consultaIdParam = searchParams?.get('consultaId') ?? '';
  const geoAnalysisIdParam = searchParams?.get('geoAnalysisId') ?? '';
  const tipoEstudoParam = searchParams?.get('tipoEstudo') ?? '';

  const { toast } = useToast();
  const { firestore } = useFirebase();

  const [consultaId, setConsultaId] = useState(consultaIdParam);
  const [empreendedorId, setEmpreendedorId] = useState('');
  const [empreendimentoId, setEmpreendimentoId] = useState('');
  const [tipoEstudo, setTipoEstudo] = useState<ConsultaTipoServico | string>('RCA');
  const [submitting, setSubmitting] = useState(false);

  const consultaDocRef = useMemoFirebase(
    () => (firestore && consultaId ? doc(firestore, 'consultas', consultaId) : null),
    [firestore, consultaId]
  );
  const { data: consulta } = useDoc<Consulta>(consultaDocRef);

  const linkedEmpreendedorRef = useMemoFirebase(
    () =>
      firestore && consulta?.empreendedorId
        ? doc(firestore, 'empreendedores', normalizeEntityId(consulta.empreendedorId))
        : null,
    [firestore, consulta?.empreendedorId],
  );
  const { data: linkedEmpreendedor } = useDoc<Empreendedor>(linkedEmpreendedorRef);

  const linkedProjectRef = useMemoFirebase(
    () =>
      firestore && consulta?.empreendimentoId
        ? doc(firestore, 'projects', normalizeEntityId(consulta.empreendimentoId))
        : null,
    [firestore, consulta?.empreendimentoId],
  );
  const { data: linkedProject } = useDoc<Project>(linkedProjectRef);

  useEffect(() => {
    if (consulta) {
      setEmpreendedorId(normalizeEntityId(consulta.empreendedorId));
      setEmpreendimentoId(normalizeEntityId(consulta.empreendimentoId));
      setTipoEstudo(consulta.tipoServico);
    }
  }, [consulta]);

  useEffect(() => {
    if (tipoEstudoParam) setTipoEstudo(tipoEstudoParam);
  }, [tipoEstudoParam]);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore]
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore]
  );
  const { data: projects } = useCollection<Project>(projectsQuery);
  const empreendedoresForSelect = useMemo(
    () =>
      buildEmpreendedorSelectOptions({
        list: empreendedores,
        selectedId: empreendedorId,
        linkedDoc: linkedEmpreendedor,
      }),
    [empreendedores, empreendedorId, linkedEmpreendedor],
  );

  const projectsForSelect = useMemo(
    () =>
      buildProjectSelectOptions({
        allProjects: projects,
        empreendedorId,
        selectedProjectId: empreendimentoId,
        linkedDoc: linkedProject,
      }),
    [projects, empreendedorId, empreendimentoId, linkedProject],
  );

  const consultasQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'consultas') : null),
    [firestore]
  );
  const { data: consultasList } = useCollection<Consulta>(consultasQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) {
      toast({ title: 'Erro', description: 'Firestore não disponível.', variant: 'destructive' });
      return;
    }
    if (!empreendedorId.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Selecione o empreendedor.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(firestore, 'laudos'), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        consultaId: consultaId.trim() || undefined,
        empreendedorId: empreendedorId.trim(),
        empreendimentoId: empreendimentoId.trim() || undefined,
        tipoEstudo,
        status: 'rascunho' as Laudo['status'],
        ...(geoAnalysisIdParam.trim()
          ? { geoAnalysisId: geoAnalysisIdParam.trim() }
          : {}),
      });
      toast({ title: 'Laudo criado', description: 'O laudo foi registrado. Você pode preencher dados e gerar o documento depois.' });
      router.push(`/laudos/${ref.id}`);
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Não foi possível criar o laudo.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fromConsulta = Boolean(consultaId && consulta);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Novo laudo" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Dados do laudo</CardTitle>
            <CardDescription>
              {fromConsulta
                ? 'Dados preenchidos a partir da consulta. Ajuste se necessário.'
                : 'Vincule a uma consulta (opcional) ou preencha empreendedor e tipo de estudo.'}
              {geoAnalysisIdParam ? (
                <span className="mt-1 block text-primary">
                  Análise geoespacial {geoAnalysisIdParam.slice(0, 8)}… será vinculada ao criar o laudo (Passo 3).
                </span>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label>Consulta (opcional)</Label>
                <Select
                  value={consultaId || '__none__'}
                  onValueChange={(v) => setConsultaId(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma — preencher manualmente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    {consultasList?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.id.slice(0, 8)} — {c.tipoServico} ({c.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Empreendedor *</Label>
                <Select
                  value={empreendedorId}
                  onValueChange={(v) => {
                    setEmpreendedorId(v);
                    setEmpreendimentoId('');
                  }}
                  required
                  disabled={fromConsulta}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o empreendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {empreendedoresForSelect.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Empreendimento</Label>
                <Select
                  value={empreendimentoId || '__none__'}
                  onValueChange={(v) => setEmpreendimentoId(v === '__none__' ? '' : v)}
                  disabled={!empreendedorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !empreendedorId
                        ? 'Selecione primeiro o empreendedor'
                        : projectsForSelect.length === 0
                          ? 'Nenhum empreendimento cadastrado'
                          : 'Selecione (opcional)'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {projectsForSelect.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.propertyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Tipo de estudo *</Label>
                <Select value={tipoEstudo} onValueChange={setTipoEstudo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_ESTUDO_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar laudo
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/laudos')}>
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
