'use client';

import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type {
  Consulta,
  ConsultaCanal,
  ConsultaStatus,
  ConsultaTipoServico,
  Empreendedor,
  Project,
  AppUser,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CANAL_OPTIONS: { value: ConsultaCanal; label: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'interno', label: 'Interno' },
];

const TIPO_SERVICO_OPTIONS: { value: ConsultaTipoServico; label: string }[] = [
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

const STATUS_OPTIONS: { value: ConsultaStatus; label: string }[] = [
  { value: 'nova', label: 'Nova' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'aguardando_dados', label: 'Aguardando dados' },
  { value: 'em_analise', label: 'Em análise' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
];

const ORIGEM_LEAD_OPTIONS: { value: NonNullable<Consulta['origemLead']>; label: string }[] = [
  { value: 'organico', label: 'Orgânico' },
  { value: 'anuncio', label: 'Anúncio' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'site', label: 'Site' },
  { value: 'outro', label: 'Outro' },
];

export default function EditConsultaPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const consultaDocRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'consultas', id) : null),
    [firestore, id]
  );
  const { data: consulta, isLoading } = useDoc<Consulta>(consultaDocRef);

  const [empreendedorId, setEmpreendedorId] = useState('');
  const [empreendimentoId, setEmpreendimentoId] = useState('');
  const [tipoServico, setTipoServico] = useState<ConsultaTipoServico>('RCA');
  const [canal, setCanal] = useState<ConsultaCanal>('interno');
  const [status, setStatus] = useState<ConsultaStatus>('nova');
  const [descricaoProblema, setDescricaoProblema] = useState('');
  const [responsavelTecnicoUserId, setResponsavelTecnicoUserId] = useState('');
  const [slaPrevisto, setSlaPrevisto] = useState('');
  const [origemLead, setOrigemLead] = useState<Consulta['origemLead'] | ''>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (consulta) {
      setEmpreendedorId(consulta.empreendedorId ?? '');
      setEmpreendimentoId(consulta.empreendimentoId ?? '');
      setTipoServico(consulta.tipoServico);
      setCanal(consulta.canal);
      setStatus(consulta.status);
      setDescricaoProblema(consulta.descricaoProblema ?? '');
      setResponsavelTecnicoUserId(consulta.responsavelTecnicoUserId ?? '');
      setSlaPrevisto(consulta.slaPrevisto ?? '');
      setOrigemLead(consulta.origemLead ?? '');
    }
  }, [consulta]);

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
  const projectsByEmpreendedor = useMemo(() => {
    if (!projects || !empreendedorId) return [];
    return projects.filter((p) => p.empreendedorId === empreendedorId);
  }, [projects, empreendedorId]);

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users } = useCollection<AppUser>(usersQuery);
  const technicalUsers = useMemo(
    () => users?.filter((u) => ['admin', 'technical', 'gestor', 'supervisor', 'diretor_fauna'].includes(u.role)) ?? [],
    [users]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !id) {
      toast({ title: 'Erro', description: 'Sessão ou registro não disponível.', variant: 'destructive' });
      return;
    }
    if (!empreendedorId.trim()) {
      toast({ title: 'Campo obrigatório', description: 'Selecione o empreendedor.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await updateDoc(doc(firestore, 'consultas', id), {
        updatedAt: serverTimestamp(),
        canal,
        empreendedorId: empreendedorId.trim(),
        empreendimentoId: empreendimentoId.trim() || null,
        tipoServico,
        descricaoProblema: descricaoProblema.trim() || null,
        status,
        responsavelTecnicoUserId: responsavelTecnicoUserId.trim() || null,
        slaPrevisto: slaPrevisto.trim() || null,
        origemLead: origemLead || null,
      });
      toast({ title: 'Consulta atualizada', description: 'As alterações foram salvas.' });
      router.push(`/consultas/${id}`);
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Não foi possível atualizar.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !consulta) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Editar consulta" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Editar consulta" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Dados da demanda</CardTitle>
            <CardDescription>Altere os campos e salve.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label>Empreendedor *</Label>
                <Select value={empreendedorId} onValueChange={setEmpreendedorId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o empreendedor" />
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

              <div className="grid gap-2">
                <Label>Empreendimento</Label>
                <Select
                  value={empreendimentoId}
                  onValueChange={setEmpreendimentoId}
                  disabled={!empreendedorId || projectsByEmpreendedor.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !empreendedorId ? 'Selecione o empreendedor' : projectsByEmpreendedor.length === 0
                        ? 'Nenhum empreendimento' : 'Selecione (opcional)'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {projectsByEmpreendedor.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.propertyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Tipo de estudo *</Label>
                <Select value={tipoServico} onValueChange={(v) => setTipoServico(v as ConsultaTipoServico)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_SERVICO_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Canal</Label>
                  <Select value={canal} onValueChange={(v) => setCanal(v as ConsultaCanal)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CANAL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ConsultaStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Descrição do problema / necessidade</Label>
                <Textarea
                  value={descricaoProblema}
                  onChange={(e) => setDescricaoProblema(e.target.value)}
                  placeholder="Descreva brevemente a demanda do cliente."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label>Responsável técnico</Label>
                <Select value={responsavelTecnicoUserId} onValueChange={setResponsavelTecnicoUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {technicalUsers.map((u) => (
                      <SelectItem key={u.uid} value={u.uid}>{u.name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Prazo previsto (SLA)</Label>
                  <Input value={slaPrevisto} onChange={(e) => setSlaPrevisto(e.target.value)} placeholder="Ex.: 30 dias" />
                </div>
                <div className="grid gap-2">
                  <Label>Origem do lead</Label>
                  <Select value={origemLead ?? ''} onValueChange={(v) => setOrigemLead(v === '' ? '' : (v as Consulta['origemLead']))}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">—</SelectItem>
                      {ORIGEM_LEAD_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push(`/consultas/${id}`)}>
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
