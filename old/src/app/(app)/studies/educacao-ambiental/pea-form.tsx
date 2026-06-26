'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Empreendedor, Project } from '@/lib/types';
import type { PeaProgram, PeaProgramStatus } from '@/lib/pea/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { StudyEmpreendedorProjectFields } from '@/components/studies/study-empreendedor-project-fields';

import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  FASES_LICENCIAMENTO,
  newDspTecnicaId,
  newPeaMonitoramentoId,
  newPeaProjetoId,
  newCampoExtraId} from '@/lib/pea/pea-constants';
import { PeaReferencePanel } from '@/components/pea/pea-reference-panel';
import { PeaGeoLinkPanel } from '@/components/pea/pea-geo-link-panel';
import type { PeaGeoVinculo } from '@/lib/pea/types';
import {
  sanitizeGeoAnalysisId,
  sanitizeGeoVinculo} from '@/lib/pea/sanitize-geo-payload';

const projetoSchema = z.object({
  id: z.string(),
  titulo: z.string().min(1, 'Título obrigatório'),
  publicoAlvo: z.string().min(1, 'Público-alvo obrigatório'),
  objetivosGerais: z.string().optional(),
  objetivosEspecificos: z.string().optional(),
  metodologia: z.string().optional(),
  cronograma: z.string().optional(),
  metas: z.string().optional(),
  indicadores: z.string().optional(),
  orcamentoResumo: z.string().optional()});

const monitoramentoSchema = z.object({
  id: z.string(),
  tipo: z.enum(['formulario', 'relatorio']),
  ano: z.coerce.number().min(2000),
  semestre: z.union([z.literal(1), z.literal(2)]),
  introducao: z.string().optional(),
  objetivos: z.string().optional(),
  atividades: z.string().optional(),
  metas: z.string().optional(),
  indicadores: z.string().optional(),
  avaliacao: z.string().optional(),
  consideracoes: z.string().optional(),
  anexosNotas: z.string().optional(),
  status: z.enum(['Rascunho', 'Enviado']).optional()});

const formSchema = z.object({
  status: z.enum(['Rascunho', 'Em elaboração', 'Aprovado', 'Em execução', 'Arquivado']),
  empreendedorId: z.string().min(1, 'Selecione o empreendedor'),
  requerente: z.object({
    clientId: z.string().optional(),
    nome: z.string().min(1, 'Nome do requerente obrigatório'),
    cpfCnpj: z.string().min(1, 'CPF/CNPJ obrigatório')}),
  empreendimento: z.object({
    projectId: z.string().optional(),
    nome: z.string().min(1, 'Nome do empreendimento obrigatório'),
    denominacao: z.string().optional(),
    car: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional()}),
  processoAdministrativo: z.string().optional(),
  solicitacaoLicenciamento: z.string().optional(),
  faseProcesso: z.string().optional(),
  ampliacaoAlteracao: z.enum(['sim', 'nao']).optional(),
  classeEmpreendimento: z.string().optional(),
  porteEmpreendimento: z.string().optional(),
  codigoTipologia: z.string().optional(),
  tipologia: z.string().optional(),
  orgaoLicenciador: z.enum(['FEAM', 'IEF', 'SEMAD', 'Outro']).optional(),
  abeaDescricao: z.string().optional(),
  abeaGeometriaNotas: z.string().optional(),
  adaGeometriaNotas: z.string().optional(),
  geoAnalysisId: z.string().optional(),
  trOrientacoes: z.string().optional(),
  camposExtras: z
    .array(
      z.object({
        id: z.string(),
        titulo: z.string().min(1, 'Título da seção'),
        conteudo: z.string().optional()}),
    )
    .optional(),
  propostaEducacional: z.string().optional(),
  articulacaoPoliticasPublicas: z.string().optional(),
  peaConjuntoNotas: z.string().optional(),
  cronogramaGeral: z.string().optional(),
  dsp: z.object({
    mobilizacao: z.string().optional(),
    devolutivas: z.string().optional(),
    notasParticipacao: z.string().optional(),
    justificativaDispensaDsp: z.string().optional(),
    tecnicas: z.array(
      z.object({
        id: z.string(),
        nome: z.string().min(1, 'Nome da técnica'),
        data: z.string().optional(),
        participantes: z.string().optional(),
        resultados: z.string().optional()}),
    ).optional()}).optional(),
  projetos: z.array(projetoSchema).min(2, 'O PEA exige no mínimo 2 projetos (DN 214)'),
  monitoramentos: z.array(monitoramentoSchema).optional(),
  responsavelTecnico: z.object({
    id: z.string().optional(),
    nome: z.string().min(1, 'Nome do RT obrigatório'),
    documento: z.string().optional(),
    formacao: z.string().optional(),
    registroConselho: z.string().optional(),
    art: z.string().optional(),
    email: z.string().optional(),
    telefone: z.string().optional()})});

type FormValues = z.infer<typeof formSchema>;

function defaultProjetos() {
  return [
    { id: newPeaProjetoId(), titulo: '', publicoAlvo: 'Público externo' },
    { id: newPeaProjetoId(), titulo: '', publicoAlvo: 'Público interno' },
  ];
}

function peaToDefaultValues(pea?: PeaProgram | null): FormValues {
  if (!pea) {
    return {
      status: 'Rascunho',
      empreendedorId: '',
      requerente: { nome: '', cpfCnpj: '' },
      empreendimento: { nome: '' },
      projetos: defaultProjetos(),
      monitoramentos: [],
      responsavelTecnico: { nome: '' },
      dsp: { tecnicas: [] },
      camposExtras: [],
      trOrientacoes: '',
      geoAnalysisId: ''};
  }
  return {
    status: pea.status ?? 'Rascunho',
    empreendedorId: pea.empreendedorId,
    requerente: pea.requerente,
    empreendimento: pea.empreendimento,
    processoAdministrativo: pea.processoAdministrativo,
    solicitacaoLicenciamento: pea.solicitacaoLicenciamento,
    faseProcesso: pea.faseProcesso,
    ampliacaoAlteracao: pea.ampliacaoAlteracao,
    classeEmpreendimento: pea.classeEmpreendimento,
    porteEmpreendimento: pea.porteEmpreendimento,
    codigoTipologia: pea.codigoTipologia,
    tipologia: pea.tipologia,
    orgaoLicenciador: pea.orgaoLicenciador ?? 'FEAM',
    abeaDescricao: pea.abeaDescricao,
    abeaGeometriaNotas: pea.abeaGeometriaNotas,
    adaGeometriaNotas: pea.adaGeometriaNotas,
    geoAnalysisId: pea.geoAnalysisId ?? '',
    trOrientacoes: pea.trOrientacoes,
    camposExtras: pea.camposExtras ?? [],
    propostaEducacional: pea.propostaEducacional,
    articulacaoPoliticasPublicas: pea.articulacaoPoliticasPublicas,
    peaConjuntoNotas: pea.peaConjuntoNotas,
    cronogramaGeral: pea.cronogramaGeral,
    dsp: {
      mobilizacao: pea.dsp?.mobilizacao,
      devolutivas: pea.dsp?.devolutivas,
      notasParticipacao: pea.dsp?.notasParticipacao,
      justificativaDispensaDsp: pea.dsp?.justificativaDispensaDsp,
      tecnicas: pea.dsp?.tecnicas ?? []},
    projetos:
      pea.projetos && pea.projetos.length >= 2
        ? pea.projetos
        : [...(pea.projetos ?? []), ...defaultProjetos()].slice(0, Math.max(2, (pea.projetos?.length ?? 0))),
    monitoramentos: pea.monitoramentos ?? [],
    responsavelTecnico: pea.responsavelTecnico ?? { nome: '' }};
}

export function PeaForm({
  currentItem,
  onSuccess,
  onCancel,
  initialProjectId,
  initialGeoAnalysisId}: {
  currentItem?: PeaProgram | null;
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  /** Query `empreendimentoId` — id do documento em `projects`. */
  initialProjectId?: string;
  /** Query `geoAnalysisId` — análise gravada em `geo_analyses`. */
  initialGeoAnalysisId?: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [geoVinculo, setGeoVinculo] = React.useState<PeaGeoVinculo | undefined>(
    currentItem?.geoVinculo,
  );
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore],
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore],
  );
  const { data: projects } = useCollection<Project>(projectsQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: peaToDefaultValues(currentItem)});

  React.useEffect(() => {
    form.reset(peaToDefaultValues(currentItem));
    setGeoVinculo(currentItem?.geoVinculo);
  }, [currentItem, form]);

  React.useEffect(() => {
    if (currentItem) return;
    const pid = initialProjectId?.trim();
    if (pid) form.setValue('empreendimento.projectId', pid);
    const gid = initialGeoAnalysisId?.trim();
    if (gid) form.setValue('geoAnalysisId', gid);
  }, [currentItem, form, initialGeoAnalysisId, initialProjectId]);

  const projetosField = useFieldArray({ control: form.control, name: 'projetos' });
  const monitorField = useFieldArray({ control: form.control, name: 'monitoramentos' });
  const tecnicasField = useFieldArray({ control: form.control, name: 'dsp.tecnicas' });
  const extrasField = useFieldArray({ control: form.control, name: 'camposExtras' });

  const empreendedorId = form.watch('empreendedorId');
  const projectId = form.watch('empreendimento.projectId');
  const abeaWatch = form.watch('abeaDescricao');
  const adaWatch = form.watch('adaGeometriaNotas');
  const abeaGeoWatch = form.watch('abeaGeometriaNotas');

  React.useEffect(() => {
    const emp = empreendedores?.find((e) => e.id === empreendedorId);
    if (emp) {
      form.setValue('requerente.nome', emp.name);
      form.setValue('requerente.cpfCnpj', emp.cpfCnpj ?? '');
      form.setValue('requerente.clientId', emp.id);
    }
  }, [empreendedorId, empreendedores, form]);

  React.useEffect(() => {
    const proj = projects?.find((p) => p.id === projectId);
    if (proj) {
      form.setValue('empreendimento.nome', proj.fantasyName || proj.propertyName || '');
      form.setValue('empreendimento.denominacao', proj.propertyName);
      form.setValue('empreendimento.municipio', proj.municipio);
      form.setValue('empreendimento.uf', proj.uf);
    }
  }, [projectId, projects, form]);

  async function handleSave(targetStatus: PeaProgramStatus) {
    if (!firestore || !user?.uid) {
      toast({ variant: 'destructive', title: 'Faça login para salvar.' });
      return;
    }

    const strict = targetStatus === 'Aprovado' || targetStatus === 'Em execução';
    if (strict) {
      const ok = await form.trigger();
      if (!ok) {
        toast({
          variant: 'destructive',
          title: 'Formulário incompleto',
          description: 'Corrija os campos indicados antes de concluir.'});
        return;
      }
    }

    setLoading(true);
    const values = form.getValues();
    const payload = {
      ...values,
      status: targetStatus,
      geoAnalysisId: sanitizeGeoAnalysisId(values.geoAnalysisId) ?? null,
      geoVinculo: sanitizeGeoVinculo(geoVinculo) ?? null,
      updatedAt: serverTimestamp(),
      createdBy: currentItem?.createdBy ?? user.uid};

    try {
      if (currentItem?.id) {
        await updateDoc(doc(firestore, 'pea_programs', currentItem.id), payload);
        toast({ title: 'PEA atualizado', description: values.empreendimento.nome });
        onSuccess?.(currentItem.id);
      } else {
        const ref = await addDoc(collection(firestore, 'pea_programs'), {
          ...payload,
          createdAt: serverTimestamp()});
        toast({ title: 'PEA criado', description: values.empreendimento.nome });
        onSuccess?.(ref.id);
      }
    } catch (error) {
      handleFirestoreFormError(error, {
        toast,
        title: 'Erro ao salvar PEA',
        context: {
          path: 'pea_programs',
          operation: currentItem?.id ? 'update' : 'create'}});
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <PeaReferencePanel />

        <Tabs defaultValue="identificacao" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="identificacao">Identificação</TabsTrigger>
            <TabsTrigger value="abea">ABEA / Geo</TabsTrigger>
            <TabsTrigger value="dsp">DSP</TabsTrigger>
            <TabsTrigger value="projetos">Projetos</TabsTrigger>
            <TabsTrigger value="proposta">Proposta</TabsTrigger>
            <TabsTrigger value="flexivel">Flexível</TabsTrigger>
            <TabsTrigger value="monitoramento">Monitoramento</TabsTrigger>
            <TabsTrigger value="rt">RT</TabsTrigger>
          </TabsList>

          <TabsContent value="identificacao" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Identificação e licenciamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StudyEmpreendedorProjectFields
                  form={form}
                  empreendedorName="empreendedorId"
                  empreendedorLabel="Empreendedor"
                  projectLabel="Empreendimento cadastrado"
                />
                <FormField
                  control={form.control}
                  name="empreendimento.nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do empreendimento</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="processoAdministrativo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processo administrativo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="solicitacaoLicenciamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº SLA</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="faseProcesso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fase do processo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Fase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FASES_LICENCIAMENTO.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="codigoTipologia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código tipologia (DN 217)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tipologia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipologia</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="orgaoLicenciador"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? 'FEAM'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(['FEAM', 'IEF', 'SEMAD', 'Outro'] as const).map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="ampliacaoAlteracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ampliação ou alteração?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="sim" />
                            </FormControl>
                            <FormLabel className="font-normal">Sim</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="nao" />
                            </FormControl>
                            <FormLabel className="font-normal">Não</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abea" className="mt-4 space-y-4">
            {user?.uid && (
              <PeaGeoLinkPanel
                userId={user.uid}
                projectId={projectId}
                initialGeoAnalysisId={form.watch('geoAnalysisId') || currentItem?.geoAnalysisId}
                initialVinculo={geoVinculo ?? currentItem?.geoVinculo}
                currentAbea={abeaWatch}
                currentAda={adaWatch}
                currentAbeaGeo={abeaGeoWatch}
                onGeoAnalysisIdChange={(id) => form.setValue('geoAnalysisId', id)}
                onVinculoChange={setGeoVinculo}
                onApplyTexts={(texts) => {
                  form.setValue('abeaDescricao', texts.abeaDescricao);
                  form.setValue('adaGeometriaNotas', texts.adaGeometriaNotas);
                  form.setValue('abeaGeometriaNotas', texts.abeaGeometriaNotas);
                }}
              />
            )}
            <Card>
              <CardHeader>
                <CardTitle>ABEA e geometrias (edição livre)</CardTitle>
                <CardDescription>
                  Delimitação da Área de Abrangência da Educação Ambiental e ADA (KML/SHP em anexo no
                  protocolo SLA). Textos podem ser editados após importar da análise geoespacial.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="abeaDescricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição da ABEA e grupos sociais</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px]" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adaGeometriaNotas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ADA — referência de arquivos / mapa</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="abeaGeometriaNotas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ABEA — referência de arquivos / mapa</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dsp" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>DSP — Diagnóstico Socioambiental Participativo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="dsp.mobilizacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobilização do público-alvo</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[100px]" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dsp.devolutivas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Devolutivas e validação dos projetos</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[100px]" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-between items-center">
                  <FormLabel>Técnicas participativas</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      tecnicasField.append({
                        id: newDspTecnicaId(),
                        nome: ''})
                    }
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Técnica
                  </Button>
                </div>
                {tecnicasField.fields.map((t, idx) => (
                  <Card key={t.id}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => tecnicasField.remove(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormField
                        control={form.control}
                        name={`dsp.tecnicas.${idx}.nome`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`dsp.tecnicas.${idx}.resultados`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resultados</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projetos" className="mt-4 space-y-4">
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Mínimo de 2 projetos por PEA (DN COPAM 214).</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  projetosField.append({
                    id: newPeaProjetoId(),
                    titulo: '',
                    publicoAlvo: ''})
                }
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Projeto
              </Button>
            </div>
            {projetosField.fields.map((p, idx) => (
              <Card key={p.id}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Projeto {idx + 1}</CardTitle>
                  {projetosField.fields.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => projetosField.remove(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <FormField
                    control={form.control}
                    name={`projetos.${idx}.titulo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`projetos.${idx}.publicoAlvo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Público-alvo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`projetos.${idx}.metodologia`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metodologia</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`projetos.${idx}.metas`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metas e indicadores</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Metas / indicadores" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
            <FormMessage>{form.formState.errors.projetos?.message}</FormMessage>
          </TabsContent>

          <TabsContent value="flexivel" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estrutura maleável</CardTitle>
                <CardDescription>
                  Orientações do TR/órgão e seções extras que não estão nos blocos fixos do formulário.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="trOrientacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas do TR / condicionantes / orientações FEAM</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[100px]"
                          placeholder="Cole trechos do TR importado, exigências do analista, etc."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-between items-center">
                  <FormLabel>Seções adicionais</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      extrasField.append({
                        id: newCampoExtraId(),
                        titulo: 'Nova seção',
                        conteudo: ''})
                    }
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Seção
                  </Button>
                </div>
                {extrasField.fields.map((ex, idx) => (
                  <Card key={ex.id}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => extrasField.remove(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormField
                        control={form.control}
                        name={`camposExtras.${idx}.titulo`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`camposExtras.${idx}.conteudo`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conteúdo</FormLabel>
                            <FormControl>
                              <Textarea className="min-h-[80px]" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proposta" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="propostaEducacional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposta educativa coerente</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[120px]" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="articulacaoPoliticasPublicas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Articulação com políticas públicas</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="peaConjuntoNotas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PEA conjunto (art. 11 DN 214)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cronogramaGeral"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cronograma geral (até 5 anos)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoramento" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Formulário (1º semestre) e Relatório (2º semestre), alternados (Anexo II / TR).
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  monitorField.append({
                    id: newPeaMonitoramentoId(),
                    tipo: 'formulario',
                    ano: new Date().getFullYear(),
                    semestre: 1,
                    status: 'Rascunho'})
                }
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Registro
              </Button>
            </div>
            {monitorField.fields.map((m, idx) => (
              <Card key={m.id}>
                <CardHeader className="flex flex-row justify-between pb-2">
                  <CardTitle className="text-base">Acompanhamento {idx + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => monitorField.remove(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`monitoramentos.${idx}.tipo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="formulario">Formulário de Acompanhamento</SelectItem>
                            <SelectItem value="relatorio">Relatório de Acompanhamento</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`monitoramentos.${idx}.ano`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`monitoramentos.${idx}.semestre`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semestre</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(Number(v) as 1 | 2)}
                          value={String(field.value)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1º semestre</SelectItem>
                            <SelectItem value="2">2º semestre</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`monitoramentos.${idx}.atividades`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Atividades realizadas</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[80px]" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rt" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="responsavelTecnico.nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="responsavelTecnico.formacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formação</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsavelTecnico.registroConselho"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registro conselho</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="responsavelTecnico.art"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ART</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => handleSave('Rascunho')}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar rascunho'}
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => handleSave('Em elaboração')}
          >
            Salvar em elaboração
          </Button>
          <Button type="button" disabled={loading} onClick={() => handleSave('Aprovado')}>
            Concluir (aprovado)
          </Button>
        </div>
      </form>
    </Form>
  );
}
