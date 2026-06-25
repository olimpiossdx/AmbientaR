'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type {
  EstudoSegurancaBarragem,
  Empreendedor as Client,
  Project,
  ProjetoTecnicoBarragem,
  OutorgaProcesso,
  RCA,
  PCA,
} from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PSB_CHECKLIST_ITENS,
  INSPECAO_CHECKLIST_ITENS,
  DAM_BREAK_CENARIOS,
  NIVEL_ANOMALIA_OPCOES,
  NIVEL_PAE_OPCOES,
  DPA_OPCOES,
} from '@/lib/seguranca-barragens/config';
import { parseNumeroFormulario } from '@/lib/barragem/calculos';
import { StudyGeoImportPanel } from '@/components/studies/study-geo-import-panel';
import { SegurancaHecRasExportPanel } from '@/components/seguranca-barragens/seguranca-hec-ras-export-buttons';
import { SegurancaHecRasImportPanel } from '@/components/seguranca-barragens/seguranca-hec-ras-import-panel';

const formSchema = z.object({
  status: z.enum(['Rascunho', 'Aprovado']).optional(),
  projetoTecnicoBarragemId: z.string().optional(),
  geoAnalysisId: z.string().optional(),
  outorgaProcessoId: z.string().optional(),
  rcaId: z.string().optional(),
  pcaId: z.string().optional(),
  requerente: z.object({
    clientId: z.string().optional(),
    nome: z.string().min(1, 'O nome do proprietário é obrigatório.'),
    cpfCnpj: z.string().min(1, 'O CPF/CNPJ é obrigatório.'),
  }),
  empreendimento: z.object({
    projectId: z.string().optional(),
    nome: z.string().min(1, 'O nome do empreendimento é obrigatório.'),
    municipio: z.string().optional(),
    uf: z.string().optional(),
    car: z.string().optional(),
  }),
  responsavelTecnico: z.object({
    nome: z.string().min(1, 'O nome do responsável é obrigatório.'),
    cpf: z.string().optional(),
    email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
    telefone: z.string().optional(),
    formacao: z.string().min(1, 'A formação é obrigatória.'),
    registroConselho: z.string().min(1, 'O registro no conselho é obrigatório.'),
    art: z.string().optional(),
  }),
  classificacao: z
    .object({
      categoriaRisco: z.string().optional(),
      danoPotencialAssociado: z.enum(['baixo', 'medio', 'alto']).optional(),
      volumeReservatorioM3: z.string().optional(),
      alturaBarragemM: z.string().optional(),
      observacoes: z.string().optional(),
    })
    .optional(),
  psb: z
    .object({
      itens: z.record(z.boolean()).optional(),
      observacoes: z.string().optional(),
    })
    .optional(),
  inspecao: z
    .object({
      itens: z.record(z.boolean()).optional(),
      nivelAnomalia: z.enum(['normal', 'atencao', 'alerta', 'emergencia']).optional(),
      observacoes: z.string().optional(),
    })
    .optional(),
  pae: z
    .object({
      nivelAtual: z.enum(['verde', 'amarelo', 'laranja', 'vermelho']).optional(),
      contatos: z.string().optional(),
      rotasFuga: z.string().optional(),
      observacoes: z.string().optional(),
    })
    .optional(),
  damBreak: z
    .object({
      cenario: z.string().optional(),
      larguraBrechaM: z.string().optional(),
      tempoFormacaoH: z.string().optional(),
      volumeMobilizadoM3: z.string().optional(),
      vazaoPicoM3s: z.string().optional(),
      observacoes: z.string().optional(),
    })
    .optional(),
  hecRasResultados: z
    .object({
      importedAt: z.string().optional(),
      sourceFile: z.string().optional(),
      formatoOrigem: z.enum(['ambientar', 'geojson', 'csv']).optional(),
      resumo: z
        .object({
          areaInundadaM2: z.string().optional(),
          profundidadeMaxM: z.string().optional(),
          velocidadeMaxMs: z.string().optional(),
          tempoChegadaMinMin: z.string().optional(),
          tempoChegadaMaxH: z.string().optional(),
          vazaoPicoModeladaM3s: z.string().optional(),
          cenarioModelado: z.string().optional(),
          software: z.string().optional(),
          dataSimulacao: z.string().optional(),
        })
        .optional(),
      pontos: z
        .array(
          z.object({
            label: z.string().optional(),
            lat: z.string().optional(),
            lng: z.string().optional(),
            profundidadeMaxM: z.string().optional(),
            velocidadeMaxMs: z.string().optional(),
            tempoChegadaMin: z.string().optional(),
          }),
        )
        .optional(),
      geojsonStats: z
        .object({
          featureCount: z.string().optional(),
          bbox: z.string().optional(),
          storedInline: z.string().optional(),
        })
        .optional(),
      geojsonInline: z.record(z.unknown()).optional(),
      memorial: z.string().optional(),
      observacoes: z.string().optional(),
    })
    .optional(),
  localEmissao: z.string().optional(),
  dataEmissao: z.string().optional(),
});

type SegurancaFormValues = z.infer<typeof formSchema>;

function emptyDefaults(): SegurancaFormValues {
  return {
    status: 'Rascunho',
    projetoTecnicoBarragemId: '',
    geoAnalysisId: '',
    outorgaProcessoId: '',
    rcaId: '',
    pcaId: '',
    requerente: { clientId: '', nome: '', cpfCnpj: '' },
    empreendimento: { projectId: '', nome: '', municipio: '', uf: 'MG', car: '' },
    responsavelTecnico: {
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      formacao: '',
      registroConselho: '',
      art: '',
    },
    classificacao: {
      categoriaRisco: '',
      danoPotencialAssociado: undefined,
      volumeReservatorioM3: '',
      alturaBarragemM: '',
      observacoes: '',
    },
    psb: { itens: {}, observacoes: '' },
    inspecao: { itens: {}, nivelAnomalia: 'normal', observacoes: '' },
    pae: { nivelAtual: 'verde', contatos: '', rotasFuga: '', observacoes: '' },
    damBreak: {
      cenario: '',
      larguraBrechaM: '',
      tempoFormacaoH: '',
      volumeMobilizadoM3: '',
      vazaoPicoM3s: '',
      observacoes: '',
    },
    localEmissao: '',
    dataEmissao: new Date().toLocaleDateString('pt-BR'),
  };
}

interface SegurancaBarragensFormProps {
  currentItem?: EstudoSegurancaBarragem | null;
  onCreated?: (id: string) => void;
  onCancel?: () => void;
}

export function SegurancaBarragensForm({
  currentItem,
  onCreated,
  onCancel,
}: SegurancaBarragensFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'clients') : null),
    [firestore],
  );
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore],
  );
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);
  const projetosBarragemQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projetosTecnicosBarragem') : null),
    [firestore],
  );
  const { data: projetosBarragem } = useCollection<ProjetoTecnicoBarragem>(projetosBarragemQuery);
  const outorgasQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'outorga_processos') : null),
    [firestore],
  );
  const { data: outorgas } = useCollection<OutorgaProcesso>(outorgasQuery);
  const rcasQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'rcas') : null),
    [firestore],
  );
  const { data: rcas } = useCollection<RCA>(rcasQuery);
  const pcasQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'pcas') : null),
    [firestore],
  );
  const { data: pcas } = useCollection<PCA>(pcasQuery);

  const form = useForm<SegurancaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem
      ? { ...emptyDefaults(), ...currentItem }
      : emptyDefaults(),
  });

  const selectedRequerenteId = form.watch('requerente.clientId');
  const selectedProjectId = form.watch('empreendimento.projectId');
  const selectedProjetoBarragemId = form.watch('projetoTecnicoBarragemId');

  const outorgasFiltradas = React.useMemo(() => {
    if (!outorgas?.length) return [];
    const pid = selectedProjectId?.trim();
    const cid = selectedRequerenteId?.trim();
    return outorgas.filter((o) => {
      if (pid && o.projectId === pid) return true;
      if (cid && o.empreendedorId === cid) return true;
      return !pid && !cid;
    });
  }, [outorgas, selectedProjectId, selectedRequerenteId]);

  const rcasFiltradas = React.useMemo(() => {
    if (!rcas?.length) return [];
    const pid = selectedProjectId?.trim();
    const cid = selectedRequerenteId?.trim();
    return rcas.filter((r) => {
      if (pid && r.empreendimento?.projectId === pid) return true;
      if (cid && r.empreendedor?.clientId === cid) return true;
      return !pid && !cid;
    });
  }, [rcas, selectedProjectId, selectedRequerenteId]);

  const pcasFiltradas = React.useMemo(() => {
    if (!pcas?.length) return [];
    const pid = selectedProjectId?.trim();
    const cid = selectedRequerenteId?.trim();
    return pcas.filter((p) => {
      if (pid && p.empreendimento?.projectId === pid) return true;
      if (cid && p.empreendedor?.clientId === cid) return true;
      return !pid && !cid;
    });
  }, [pcas, selectedProjectId, selectedRequerenteId]);

  React.useEffect(() => {
    if (!selectedRequerenteId || !clients?.length) return;
    const client = clients.find((c) => c.id === selectedRequerenteId);
    if (client) {
      form.setValue('requerente.nome', client.name);
      form.setValue('requerente.cpfCnpj', client.cpfCnpj || '');
    }
  }, [selectedRequerenteId, clients, form]);

  React.useEffect(() => {
    if (!selectedProjectId || !projects?.length) return;
    const project = projects.find((p) => p.id === selectedProjectId);
    if (project) {
      form.setValue('empreendimento.nome', project.fantasyName || project.propertyName);
      form.setValue('empreendimento.municipio', project.municipio || '');
      form.setValue('empreendimento.uf', project.uf || 'MG');
      form.setValue('empreendimento.car', project.car?.receiptNumber || '');
    }
  }, [selectedProjectId, projects, form]);

  React.useEffect(() => {
    if (!selectedProjetoBarragemId || !projetosBarragem?.length) return;
    const pb = projetosBarragem.find((p) => p.id === selectedProjetoBarragemId);
    if (!pb) return;
    form.setValue('requerente.nome', pb.requerente.nome);
    form.setValue('requerente.cpfCnpj', pb.requerente.cpfCnpj);
    if (pb.requerente.clientId) form.setValue('requerente.clientId', pb.requerente.clientId);
    form.setValue('empreendimento.nome', pb.empreendimento.nome);
    if (pb.empreendimento.projectId) {
      form.setValue('empreendimento.projectId', pb.empreendimento.projectId);
    }
    form.setValue('empreendimento.municipio', pb.empreendimento.municipio || '');
    form.setValue('empreendimento.uf', pb.empreendimento.uf || 'MG');
    form.setValue('responsavelTecnico.nome', pb.responsavelTecnico.nome);
    form.setValue('responsavelTecnico.formacao', pb.responsavelTecnico.formacao);
    form.setValue('responsavelTecnico.registroConselho', pb.responsavelTecnico.registroConselho);
    if (pb.capacidadeReservatorio?.volumeArmazenadoM3) {
      form.setValue('classificacao.volumeReservatorioM3', pb.capacidadeReservatorio.volumeArmazenadoM3);
    }
  }, [selectedProjetoBarragemId, projetosBarragem, form]);

  async function handleSave(status: 'Rascunho' | 'Aprovado') {
    setLoading(true);
    const isValid = await form.trigger();
    if (!isValid && status === 'Aprovado') {
      toast({
        variant: 'destructive',
        title: 'Formulário inválido',
        description: 'Corrija os erros antes de aprovar.',
      });
      setLoading(false);
      return;
    }

    const values = form.getValues();
    const payload = {
      ...values,
      status,
      projetoTecnicoBarragemId: values.projetoTecnicoBarragemId?.trim() || undefined,
      geoAnalysisId: values.geoAnalysisId?.trim() || undefined,
      outorgaProcessoId: values.outorgaProcessoId?.trim() || undefined,
      rcaId: values.rcaId?.trim() || undefined,
      pcaId: values.pcaId?.trim() || undefined,
    };

    try {
      if (currentItem?.id) {
        await updateDoc(doc(firestore!, 'estudosSegurancaBarragem', currentItem.id), payload);
        toast({ title: 'Estudo salvo', description: `Status: ${status}` });
      } else {
        const ref = await addDoc(collection(firestore!, 'estudosSegurancaBarragem'), payload);
        toast({ title: 'Estudo criado', description: 'Rascunho salvo com sucesso.' });
        onCreated?.(ref.id);
      }
    } catch (serverError) {
      handleFirestoreFormError(serverError, {
        toast,
        title: 'Erro ao salvar',
        context: {
          path: currentItem?.id
            ? `estudosSegurancaBarragem/${currentItem.id}`
            : 'estudosSegurancaBarragem',
          operation: currentItem?.id ? 'update' : 'create',
        },
      });
    } finally {
      setLoading(false);
    }
  }

  const calcularQpDamBreak = () => {
    const V = parseNumeroFormulario(form.getValues('damBreak.volumeMobilizadoM3'));
    const T = parseNumeroFormulario(form.getValues('damBreak.tempoFormacaoH'));
    if (V == null || T == null || T <= 0) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Informe volume mobilizado (m³) e tempo de formação (h).',
      });
      return;
    }
    const Qp = (2 * V) / (T * 3600);
    form.setValue('damBreak.vazaoPicoM3s', Qp.toFixed(2));
    toast({
      title: 'Qp estimado (triagem)',
      description: `${Qp.toFixed(2)} m³/s — resultado preliminar; use modelo hidrodinâmico para estudo formal.`,
    });
  };

  const watched = form.watch();
  const estudoParaHecRas = React.useMemo((): EstudoSegurancaBarragem | null => {
    if (!currentItem?.id) return null;
    return {
      ...currentItem,
      projetoTecnicoBarragemId: watched.projetoTecnicoBarragemId || currentItem.projetoTecnicoBarragemId,
      geoAnalysisId: watched.geoAnalysisId || currentItem.geoAnalysisId,
      outorgaProcessoId: watched.outorgaProcessoId || currentItem.outorgaProcessoId,
      empreendimento: { ...currentItem.empreendimento, ...watched.empreendimento },
      classificacao: watched.classificacao
        ? { ...currentItem.classificacao, ...watched.classificacao }
        : currentItem.classificacao,
      damBreak: { ...currentItem.damBreak, ...watched.damBreak },
    };
  }, [currentItem, watched]);

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Alert>
          <AlertDescription>
            Classificação CRI/DPA, PSB e PAE registrados aqui são <strong>preliminares</strong> e
            exigem revisão do engenheiro responsável e atendimento à ANA/CNRH quando aplicável.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="identificacao">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="identificacao">Identificação</TabsTrigger>
            <TabsTrigger value="classificacao">Classificação</TabsTrigger>
            <TabsTrigger value="psb">PSB</TabsTrigger>
            <TabsTrigger value="inspecao">Inspeções</TabsTrigger>
            <TabsTrigger value="pae">PAE</TabsTrigger>
            <TabsTrigger value="dambreak">Dam Break</TabsTrigger>
          </TabsList>

          <TabsContent value="identificacao" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vínculos</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="projetoTecnicoBarragemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projeto técnico de barragem (opcional)</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === '_none_' ? '' : v)}
                        value={field.value || '_none_'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vincular memorial existente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {projetosBarragem?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.empreendimento.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Ao selecionar, dados do empreendimento e RT são preenchidos automaticamente.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requerente.clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proprietário cadastrado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingClients}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="empreendimento.projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empreendimento cadastrado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingProjects}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.fantasyName || p.propertyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requerente.nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requerente</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requerente.cpfCnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF/CNPJ</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="empreendimento.nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empreendimento / barragem</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <StudyGeoImportPanel
              userId={user?.uid}
              empreendimentoId={selectedProjectId}
              initialGeoAnalysisId={form.watch('geoAnalysisId')}
              onImported={(r) => {
                form.setValue('geoAnalysisId', r.geoAnalysisId);
                const obs = form.getValues('classificacao.observacoes') ?? '';
                const sep = obs.trim() ? '\n\n' : '';
                form.setValue(
                  'classificacao.observacoes',
                  `${obs}${sep}geo_analyses/${r.geoAnalysisId} — ${r.areaHa.toFixed(2)} ha\n${r.factualSummary.slice(0, 1500)}`,
                );
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Processo de outorga (opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="outorgaProcessoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Processo IGAM</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === '_none_' ? '' : v)}
                        value={field.value || '_none_'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Nenhum" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {outorgasFiltradas.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.modoUsoLabel} — {o.municipio ?? o.id.slice(0, 8)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Licenciamento ambiental (opcional)</CardTitle>
                <CardDescription>
                  Vincule RCA e/ou PCA do mesmo empreendimento para referência no estudo e na exportação.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rcaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RCA</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === '_none_' ? '' : v)}
                        value={field.value || '_none_'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Nenhum" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {rcasFiltradas.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.activity}
                              {r.empreendimento?.nome ? ` — ${r.empreendimento.nome}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pcaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PCA</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === '_none_' ? '' : v)}
                        value={field.value || '_none_'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Nenhum" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none_">Nenhum</SelectItem>
                          {pcasFiltradas.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.activity}
                              {p.listagemCode ? ` (${p.listagemCode})` : ''}
                              {p.empreendimento?.nome ? ` — ${p.empreendimento.nome}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Responsável técnico</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {(
                  [
                    ['responsavelTecnico.nome', 'Nome'],
                    ['responsavelTecnico.formacao', 'Formação'],
                    ['responsavelTecnico.registroConselho', 'Registro conselho'],
                    ['responsavelTecnico.art', 'ART'],
                    ['responsavelTecnico.email', 'E-mail'],
                    ['responsavelTecnico.telefone', 'Telefone'],
                  ] as const
                ).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classificacao" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Classificação preliminar</CardTitle>
                <CardDescription>CNRH 143/2012 e critérios ANA — sujeito a validação do RT.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="classificacao.categoriaRisco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria de risco (CRI)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} placeholder="Ex.: CRI I, II, III" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classificacao.danoPotencialAssociado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dano potencial associado (DPA)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DPA_OPCOES.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classificacao.volumeReservatorioM3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume do reservatório (m³)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classificacao.alturaBarragemM"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura da barragem (m)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classificacao.observacoes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="psb" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plano de Segurança da Barragem (PSB)</CardTitle>
                <CardDescription>Conteúdo mínimo recomendado — ANA Res. 236/2017.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {PSB_CHECKLIST_ITENS.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={`psb.itens.${item.id}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{item.label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
                <FormField
                  control={form.control}
                  name="psb.observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações PSB</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspecao" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inspeção de segurança regular</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="inspecao.nivelAnomalia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de anomalia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? 'normal'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NIVEL_ANOMALIA_OPCOES.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                {INSPECAO_CHECKLIST_ITENS.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={`inspecao.itens.${item.id}`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{item.label}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
                <FormField
                  control={form.control}
                  name="inspecao.observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações da inspeção</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pae" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plano de Ação de Emergência (PAE)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="pae.nivelAtual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de resposta atual</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? 'verde'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NIVEL_PAE_OPCOES.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pae.contatos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lista de contatos (empreendedor, RT, Defesa Civil, etc.)</FormLabel>
                      <FormControl>
                        <Textarea rows={5} {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pae.rotasFuga"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rotas de fuga e pontos de encontro</FormLabel>
                      <FormControl>
                        <Textarea rows={5} {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pae.observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações PAE</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dambreak" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dam Break — triagem preliminar</CardTitle>
                <CardDescription>
                  Hidrograma triangular Qp = 2V/T. Estudo formal exige modelo hidrodinâmico (ex. HEC-RAS).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="damBreak.cenario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cenário</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cenário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAM_BREAK_CENARIOS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="damBreak.larguraBrechaM"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largura final da brecha (m)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="damBreak.tempoFormacaoH"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo de formação (h)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="damBreak.volumeMobilizadoM3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Volume mobilizado (m³)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="damBreak.vazaoPicoM3s"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vazão de pico Qp (m³/s)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} readOnly className="bg-muted" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={calcularQpDamBreak}>
                  Calcular Qp (triagem)
                </Button>
                <FormField
                  control={form.control}
                  name="damBreak.observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações / metodologia</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {estudoParaHecRas ? (
                  <SegurancaHecRasExportPanel estudo={estudoParaHecRas} />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Salve o estudo para exportar insumos HEC-RAS.
                  </p>
                )}
                <SegurancaHecRasImportPanel
                  estudoId={currentItem?.id}
                  value={form.watch('hecRasResultados')}
                  disabled={loading}
                  onChange={(v) => form.setValue('hecRasResultados', v, { shouldDirty: true })}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button type="button" disabled={loading} onClick={() => handleSave('Rascunho')}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar rascunho
          </Button>
          <Button type="button" variant="secondary" disabled={loading} onClick={() => handleSave('Aprovado')}>
            Aprovar estudo
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
