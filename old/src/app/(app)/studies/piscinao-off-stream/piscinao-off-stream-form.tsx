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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type {
  PiscinaoOffStream,
  Empreendedor as Client,
  Project,
  ProjetoTecnicoBarragem,
  OutorgaProcesso,
} from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { StudyEmpreendedorProjectFields } from '@/components/studies/study-empreendedor-project-fields';
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
import { StudyGeoImportPanel } from '@/components/studies/study-geo-import-panel';
import {
  PISCINAO_OBSERVACOES_MODELO,
  PISCINAO_REGULARIZACAO_MODELO,
} from '@/lib/piscinao-off-stream/defaults';
import { PiscinaoRipplPanel, type PiscinaoRipplFormApi } from '@/components/piscinao/piscinao-rippl-panel';
import { criarSerieRipplMensalVazia } from '@/lib/barragem/calculos';

const formSchema = z.object({
  status: z.enum(['Rascunho', 'Aprovado']).optional(),
  projetoTecnicoBarragemId: z.string().optional(),
  geoAnalysisId: z.string().optional(),
  outorgaProcessoId: z.string().optional(),
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
  caracteristicas: z
    .object({
      usoPretendido: z.string().optional(),
      capacidadeUtilM3: z.string().optional(),
      espelhoDaguaM2: z.string().optional(),
      profundidadeMediaM: z.string().optional(),
      tempoResidenciaDias: z.string().optional(),
      observacoes: z.string().optional(),
    })
    .optional(),
  demandaHidrica: z
    .object({
      vazaoCaptacaoLs: z.string().optional(),
      demandaAnualM3: z.string().optional(),
      volumeUtilRipplM3: z.string().optional(),
      ripplSeries: z
        .array(
          z.object({
            label: z.string().optional(),
            qAfluenteM3s: z.string().optional(),
            qDemandaM3s: z.string().optional(),
            diasNoPeriodo: z.string().optional(),
            evapM3: z.string().optional(),
          }),
        )
        .optional(),
      regularizacao: z.string().optional(),
      observacoes: z.string().optional(),
    })
    .optional(),
  localEmissao: z.string().optional(),
  dataEmissao: z.string().optional(),
});

type PiscinaoFormValues = z.infer<typeof formSchema>;

function emptyDefaults(): PiscinaoFormValues {
  return {
    status: 'Rascunho',
    projetoTecnicoBarragemId: '',
    geoAnalysisId: '',
    outorgaProcessoId: '',
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
    caracteristicas: {
      usoPretendido: '',
      capacidadeUtilM3: '',
      espelhoDaguaM2: '',
      profundidadeMediaM: '',
      tempoResidenciaDias: '',
      observacoes: PISCINAO_OBSERVACOES_MODELO,
    },
    demandaHidrica: {
      vazaoCaptacaoLs: '',
      demandaAnualM3: '',
      volumeUtilRipplM3: '',
      ripplSeries: criarSerieRipplMensalVazia().map((p) => ({
        label: p.label,
        qAfluenteM3s: '',
        qDemandaM3s: '',
        diasNoPeriodo: String(p.diasNoPeriodo ?? 30),
        evapM3: '0',
      })),
      regularizacao: PISCINAO_REGULARIZACAO_MODELO,
      observacoes: '',
    },
    localEmissao: '',
    dataEmissao: new Date().toLocaleDateString('pt-BR'),
  };
}

interface PiscinaoOffStreamFormProps {
  currentItem?: PiscinaoOffStream | null;
  onCreated?: (id: string) => void;
  onCancel?: () => void;
}

export function PiscinaoOffStreamForm({
  currentItem,
  onCreated,
  onCancel,
}: PiscinaoOffStreamFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'clients') : null),
    [firestore],
  );
  const { data: clients } = useCollection<Client>(clientsQuery);
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore],
  );
  const { data: projects } = useCollection<Project>(projectsQuery);
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

  const form = useForm<PiscinaoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem ? { ...emptyDefaults(), ...currentItem } : emptyDefaults(),
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

  React.useEffect(() => {
    if (!selectedProjetoBarragemId || !projetosBarragem?.length) return;
    const pb = projetosBarragem.find((p) => p.id === selectedProjetoBarragemId);
    if (!pb) return;
    if (pb.requerente?.nome) form.setValue('requerente.nome', pb.requerente.nome);
    if (pb.requerente?.cpfCnpj) form.setValue('requerente.cpfCnpj', pb.requerente.cpfCnpj);
    if (pb.requerente?.clientId) form.setValue('requerente.clientId', pb.requerente.clientId);
    if (pb.empreendimento?.projectId) {
      form.setValue('empreendimento.projectId', pb.empreendimento.projectId);
    }
    if (pb.empreendimento?.nome) form.setValue('empreendimento.nome', pb.empreendimento.nome);
    if (pb.empreendimento?.municipio) {
      form.setValue('empreendimento.municipio', pb.empreendimento.municipio);
    }
    if (pb.empreendimento?.uf) form.setValue('empreendimento.uf', pb.empreendimento.uf);
    if (pb.empreendimento?.car) form.setValue('empreendimento.car', pb.empreendimento.car);
    if (pb.responsavelTecnico?.nome) {
      form.setValue('responsavelTecnico.nome', pb.responsavelTecnico.nome);
    }
    if (pb.responsavelTecnico?.formacao) {
      form.setValue('responsavelTecnico.formacao', pb.responsavelTecnico.formacao);
    }
    if (pb.responsavelTecnico?.registroConselho) {
      form.setValue('responsavelTecnico.registroConselho', pb.responsavelTecnico.registroConselho);
    }
    if (pb.responsavelTecnico?.art) form.setValue('responsavelTecnico.art', pb.responsavelTecnico.art);
    if (pb.espelhoDaguaM2) form.setValue('caracteristicas.espelhoDaguaM2', pb.espelhoDaguaM2);
    if (pb.capacidadeArmazenamentoM3) {
      form.setValue('caracteristicas.capacidadeUtilM3', pb.capacidadeArmazenamentoM3);
    }
    if (pb.usoPretendido) form.setValue('caracteristicas.usoPretendido', pb.usoPretendido);
    if (pb.outorgaProcessoId) form.setValue('outorgaProcessoId', pb.outorgaProcessoId);
    if (pb.geoAnalysisId) form.setValue('geoAnalysisId', pb.geoAnalysisId);
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
    };

    try {
      if (currentItem?.id) {
        await updateDoc(doc(firestore!, 'piscinoesOffStream', currentItem.id), payload);
        toast({ title: 'Cadastro salvo', description: `Status: ${status}` });
      } else {
        const ref = await addDoc(collection(firestore!, 'piscinoesOffStream'), payload);
        toast({ title: 'Cadastro criado', description: 'Rascunho salvo com sucesso.' });
        onCreated?.(ref.id);
      }
    } catch (serverError) {
      handleFirestoreFormError(serverError, {
        toast,
        title: 'Erro ao salvar',
        context: {
          path: currentItem?.id
            ? `piscinoesOffStream/${currentItem.id}`
            : 'piscinoesOffStream',
          operation: currentItem?.id ? 'update' : 'create',
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Alert>
          <AlertDescription>
            Piscinão <strong>off-stream</strong> não barra curso d&apos;água. Estudos de remanso,
            galgamento e Dam Break de barragem não se aplicam; priorize demanda, regularização e
            outorga de captação.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="identificacao">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="identificacao">Identificação</TabsTrigger>
            <TabsTrigger value="caracteristicas">Características</TabsTrigger>
            <TabsTrigger value="demanda">Demanda hídrica</TabsTrigger>
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
                    <FormItem className="md:col-span-2">
                      <FormLabel>Projeto técnico de barragem (opcional)</FormLabel>
                      <FormDescription>
                        Reutilize dados de um projeto existente (mesmo empreendimento).
                      </FormDescription>
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
                          {projetosBarragem?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.empreendimento?.nome || p.id.slice(0, 8)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <StudyEmpreendedorProjectFields
                  form={form}
                  empreendedorLabel="Proprietário / empreendedor"
                  projectLabel="Empreendimento (projeto)"
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
                      <FormLabel>Nome do piscinão / empreendimento</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="empreendimento.municipio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Município</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="empreendimento.uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={2} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="empreendimento.car"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>CAR</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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

          <TabsContent value="caracteristicas" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dimensões e uso</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="caracteristicas.usoPretendido"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Uso pretendido</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="caracteristicas.capacidadeUtilM3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade útil (m³)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="caracteristicas.espelhoDaguaM2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Espelho d&apos;água (m²)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="caracteristicas.profundidadeMediaM"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profundidade média (m)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="caracteristicas.tempoResidenciaDias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo de residência (dias)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormDescription>Útil para balanço hídrico / Rippl.</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="caracteristicas.observacoes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observações técnicas</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px]" {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demanda" className="mt-4 space-y-4">
            <PiscinaoRipplPanel form={form as unknown as PiscinaoRipplFormApi} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parâmetros e memorial</CardTitle>
                <CardDescription>
                  Resultados do Rippl preenchem demanda anual, volume útil e a tabela na regularização.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="demandaHidrica.volumeUtilRipplM3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume útil necessário — Rippl (m³)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} readOnly className="bg-muted/50" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="demandaHidrica.vazaoCaptacaoLs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vazão de captação (L/s)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="demandaHidrica.demandaAnualM3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demanda anual (m³)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="demandaHidrica.regularizacao"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Regularização / Rippl</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[140px]" {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="demandaHidrica.observacoes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
          )}
          <Button type="button" variant="secondary" disabled={loading} onClick={() => handleSave('Rascunho')}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar rascunho
          </Button>
          <Button type="button" disabled={loading} onClick={() => handleSave('Aprovado')}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Aprovar
          </Button>
        </div>
      </form>
    </Form>
  );
}
