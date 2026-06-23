'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, PlusCircle, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type {
  EstudoCavidade,
  Empreendedor as Client,
  Project,
  TechnicalResponsible} from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';

import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CHECKLIST_IS08_LABELS } from '@/lib/cavidades/checklist-is08';
import {
  clearTriagemSession,
  loadTriagemFromSession} from '@/lib/cavidades/cavidades-triagem-bridge';
import {
  CAVIDADES_APRESENTACAO_MODELO,
  CAVIDADES_CRITERIO_LOCACIONAL_MODELO,
  CAVIDADES_IMPACTO_MODELO,
  CAVIDADES_MAPA_POTENCIAL_MODELO,
  CAVIDADES_PROSPECCAO_MODELO} from './cavidades-defaults';
import { CoordinateInput } from '@/components/coordinates';
import {
  barragemCoordenadasToLatLngStrings,
  barragemLatLngStringsToCoordenadas} from '@/lib/barragem/barragem-coordenadas';
import {
  createDefaultMonitoringPontoCoordenadas,
  type MonitoringPontoCoordenadasForm} from '@/lib/monitoring-pontos-form';
import type { EstudoCavidadeCavidadeRegistro } from '@/lib/types';

const cavidadeRegistroSchema = z.object({
  codigo: z.string().optional(),
  denominacao: z.string().optional(),
  tipo: z.enum(['caverna', 'abismo', 'abrigo', 'outro']).optional(),
  coordenadas: z.any().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  desenvolvimentoLinearM: z.string().optional(),
  litologia: z.string().optional(),
  grauRelevancia: z
    .enum(['maximo', 'alto', 'medio', 'baixo', 'nao_classificado'])
    .optional(),
  naAda: z.boolean().optional(),
  observacoes: z.string().optional()});

const formSchema = z.object({
  nivelEstudo: z
    .enum([
      'triagem',
      'laudo_urbano',
      'laudo_prospecao',
      'avaliacao_impacto',
      'relevancia_compensacao',
      'criterio_locacional',
    ])
    .optional(),
  requerente: z.object({
    clientId: z.string().optional(),
    nome: z.string().min(1, 'Nome do requerente obrigatório.'),
    cpfCnpj: z.string().min(1, 'CPF/CNPJ obrigatório.')}),
  empreendimento: z.object({
    projectId: z.string().optional(),
    nome: z.string().min(1, 'Nome do empreendimento obrigatório.'),
    municipio: z.string().optional(),
    uf: z.string().optional(),
    car: z.string().optional()}),
  responsavelTecnico: z.object({
    technicalResponsibleId: z.string().optional(),
    nome: z.string().min(1, 'Responsável técnico obrigatório.'),
    formacao: z.string().min(1, 'Formação obrigatória.'),
    registroConselho: z.string().min(1, 'Registro no conselho obrigatório.'),
    art: z.string().optional()}),
  processo: z
    .object({
      sla: z.string().optional(),
      sei: z.string().optional(),
      supram: z.string().optional(),
      modalidadeSugerida: z.string().optional(),
      classeAtividade: z.string().optional()})
    .optional(),
  triagem: z
    .object({
      potencialCecav: z
        .enum(['nao_aplicavel', 'baixo', 'medio', 'alto', 'muito_alto', 'misto'])
        .optional(),
      criterioLocacionalIncide: z.boolean().optional(),
      adaUrbanizada: z.boolean().optional(),
      observacoesIde: z.string().optional(),
      pedidoNaoIncidenciaCriterio: z.boolean().optional(),
      justificativaNaoIncidencia: z.string().optional()})
    .optional(),
  prospecao: z
    .object({
      kmCaminhamento: z.string().optional(),
      areaAdaHa: z.string().optional(),
      conclusaoSemCavidades: z.boolean().optional(),
      mapaPotencialNotas: z.string().optional(),
      memorialProspecao: z.string().optional()})
    .optional(),
  impactos: z
    .object({
      haImpactoIrreversivel: z.boolean().optional(),
      medidasMitigadoras: z.string().optional(),
      areaInfluenciaNotas: z.string().optional(),
      compensacaoNotas: z.string().optional()})
    .optional(),
  cavidadesRegistradas: z.array(cavidadeRegistroSchema).optional(),
  checklistIs08: z.record(z.string(), z.boolean()).optional(),
  linksUteis: z
    .object({
      ecosistemasUrl: z.string().optional(),
      ideSisemaNotas: z.string().optional()})
    .optional(),
  memorialApresentacao: z.string().optional(),
  memorialCriterioLocacional: z.string().optional()});

type CavidadesFormValues = z.infer<typeof formSchema>;

interface CavidadesFormProps {
  currentItem?: EstudoCavidade | null;
  onCreated?: (id: string) => void;
  onCancel?: () => void;
}

function emptyDefaults(): CavidadesFormValues {
  const checklist: Record<string, boolean> = {};
  for (const item of CHECKLIST_IS08_LABELS) {
    checklist[item.key] = false;
  }
  return {
    nivelEstudo: 'triagem',
    requerente: { clientId: '', nome: '', cpfCnpj: '' },
    empreendimento: { projectId: '', nome: '', municipio: '', uf: 'MG', car: '' },
    responsavelTecnico: {
      technicalResponsibleId: '',
      nome: '',
      formacao: '',
      registroConselho: '',
      art: ''},
    processo: { sla: '', sei: '', supram: '', modalidadeSugerida: '', classeAtividade: '' },
    triagem: {
      potencialCecav: 'nao_aplicavel',
      criterioLocacionalIncide: false,
      adaUrbanizada: false,
      observacoesIde: '',
      pedidoNaoIncidenciaCriterio: false,
      justificativaNaoIncidencia: ''},
    prospecao: {
      kmCaminhamento: '',
      areaAdaHa: '',
      conclusaoSemCavidades: false,
      mapaPotencialNotas: CAVIDADES_MAPA_POTENCIAL_MODELO,
      memorialProspecao: CAVIDADES_PROSPECCAO_MODELO},
    impactos: {
      haImpactoIrreversivel: false,
      medidasMitigadoras: '',
      areaInfluenciaNotas: '',
      compensacaoNotas: CAVIDADES_IMPACTO_MODELO},
    cavidadesRegistradas: [],
    checklistIs08: checklist,
    linksUteis: { ecosistemasUrl: '', ideSisemaNotas: '' },
    memorialApresentacao: CAVIDADES_APRESENTACAO_MODELO,
    memorialCriterioLocacional: CAVIDADES_CRITERIO_LOCACIONAL_MODELO};
}

function mapCavidadeRegistroToForm(
  reg: EstudoCavidadeCavidadeRegistro,
): NonNullable<CavidadesFormValues['cavidadesRegistradas']>[number] {
  return {
    ...reg,
    coordenadas: barragemLatLngStringsToCoordenadas(reg.latitude, reg.longitude)};
}

function mapCavidadeRegistroToFirestore(
  reg: NonNullable<CavidadesFormValues['cavidadesRegistradas']>[number],
): EstudoCavidadeCavidadeRegistro {
  const { coordenadas: _coordenadas, ...rest } = reg;
  const { latitude, longitude } = barragemCoordenadasToLatLngStrings(
    reg.coordenadas as MonitoringPontoCoordenadasForm | undefined,
  );
  return { ...rest, latitude, longitude };
}

function mapItemToForm(item: EstudoCavidade): CavidadesFormValues {
  const base = emptyDefaults();
  return {
    ...base,
    nivelEstudo: item.nivelEstudo ?? base.nivelEstudo,
    requerente: { ...base.requerente, ...item.requerente },
    empreendimento: { ...base.empreendimento, ...item.empreendimento },
    responsavelTecnico: { ...base.responsavelTecnico, ...item.responsavelTecnico },
    processo: { ...base.processo, ...item.processo },
    triagem: { ...base.triagem, ...item.triagem },
    prospecao: { ...base.prospecao, ...item.prospecao },
    impactos: { ...base.impactos, ...item.impactos },
    cavidadesRegistradas: (item.cavidadesRegistradas ?? []).map(mapCavidadeRegistroToForm),
    checklistIs08: { ...base.checklistIs08, ...item.checklistIs08 },
    linksUteis: { ...base.linksUteis, ...item.linksUteis },
    memorialApresentacao: item.apresentacao ?? base.memorialApresentacao,
    memorialCriterioLocacional:
      item.memorialCriterioLocacional ?? base.memorialCriterioLocacional};
}

function mapFormToFirestore(values: CavidadesFormValues, status: 'Rascunho' | 'Aprovado') {
  const now = new Date().toISOString();
  const responsavelTecnico = { ...values.responsavelTecnico };
  if (!responsavelTecnico.technicalResponsibleId?.trim()) {
    delete responsavelTecnico.technicalResponsibleId;
  }
  return {
    status,
    nivelEstudo: values.nivelEstudo,
    requerente: values.requerente,
    empreendimento: values.empreendimento,
    responsavelTecnico,
    processo: values.processo,
    triagem: values.triagem,
    prospecao: values.prospecao,
    impactos: values.impactos,
    cavidadesRegistradas: (values.cavidadesRegistradas ?? []).map(
      mapCavidadeRegistroToFirestore,
    ),
    apresentacao: values.memorialApresentacao,
    memorialCriterioLocacional: values.memorialCriterioLocacional,
    checklistIs08: values.checklistIs08,
    linksUteis: values.linksUteis,
    updatedAt: now};
}

const NIVEL_LABELS: Record<string, string> = {
  triagem: 'Triagem (IDE / DN 217)',
  laudo_urbano: 'Laudo urbano (dados secundários)',
  laudo_prospecao: 'Laudo + prospecção ADA+250 m',
  avaliacao_impacto: 'Avaliação de impactos',
  relevancia_compensacao: 'Relevância e compensação',
  criterio_locacional: 'Estudo critério locacional'};

export function CavidadesForm({ currentItem, onCreated, onCancel }: CavidadesFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

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

  const responsiblesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'technicalResponsibles') : null),
    [firestore],
  );
  const { data: technicalResponsibles, isLoading: isLoadingResponsibles } =
    useCollection<TechnicalResponsible>(responsiblesQuery);

  const form = useForm<CavidadesFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem ? mapItemToForm(currentItem) : emptyDefaults()});

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'cavidadesRegistradas'});

  const selectedRequerenteId = form.watch('requerente.clientId');
  const selectedProjectId = form.watch('empreendimento.projectId');
  const selectedTechnicalResponsibleId = form.watch('responsavelTecnico.technicalResponsibleId');

  React.useEffect(() => {
    if (!selectedTechnicalResponsibleId) return;
    const rt = technicalResponsibles?.find((r) => r.id === selectedTechnicalResponsibleId);
    if (!rt) return;
    form.setValue('responsavelTecnico.nome', rt.name);
    form.setValue('responsavelTecnico.formacao', rt.profession || '');
    form.setValue('responsavelTecnico.registroConselho', rt.registrationNumber || '');
    form.setValue('responsavelTecnico.art', rt.art || '');
  }, [selectedTechnicalResponsibleId, technicalResponsibles, form]);

  /** Estudos antigos sem `technicalResponsibleId`: tenta associar pelo nome/registro. */
  React.useEffect(() => {
    if (!currentItem || !technicalResponsibles?.length) return;
    if (form.getValues('responsavelTecnico.technicalResponsibleId')) return;
    const nome = form.getValues('responsavelTecnico.nome')?.trim();
    if (!nome) return;
    const registro = form.getValues('responsavelTecnico.registroConselho')?.trim();
    const match = technicalResponsibles.find(
      (r) =>
        r.name.trim() === nome &&
        (!registro || (r.registrationNumber || '').trim() === registro),
    );
    if (match) form.setValue('responsavelTecnico.technicalResponsibleId', match.id);
  }, [currentItem, technicalResponsibles, form]);

  React.useEffect(() => {
    if (currentItem) return;
    const fromGeo = loadTriagemFromSession();
    if (!fromGeo) return;
    form.setValue('triagem.potencialCecav', fromGeo.potencialCecav);
    form.setValue('triagem.criterioLocacionalIncide', fromGeo.criterioLocacionalIncide);
    form.setValue('triagem.observacoesIde', fromGeo.observacoesIde);
    form.setValue('checklistIs08.consultaIdeCecav', true);
    form.setValue('checklistIs08.verificacaoDn217', true);
    clearTriagemSession();
    toast({
      title: 'Triagem importada',
      description: 'Dados da análise geoespacial (CECAV) aplicados à aba Triagem.'});
  }, [currentItem, form, toast]);

  React.useEffect(() => {
    if (selectedRequerenteId) {
      const client = clients?.find((c) => c.id === selectedRequerenteId);
      if (client) {
        form.setValue('requerente.nome', client.name);
        form.setValue('requerente.cpfCnpj', client.cpfCnpj || '');
      }
    }
  }, [selectedRequerenteId, clients, form]);

  React.useEffect(() => {
    if (selectedProjectId) {
      const project = projects?.find((p) => p.id === selectedProjectId);
      if (project) {
        form.setValue('empreendimento.nome', project.fantasyName || project.propertyName);
        form.setValue('empreendimento.municipio', project.municipio || '');
        form.setValue('empreendimento.uf', project.uf || 'MG');
        form.setValue('empreendimento.car', project.car?.receiptNumber || '');
      }
    }
  }, [selectedProjectId, projects, form]);

  async function handleSave() {
    setLoading(true);
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Formulário inválido',
        description: 'Corrija os campos obrigatórios antes de salvar.'});
      setLoading(false);
      return;
    }

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    const values = form.getValues();
    const status =
      currentItem?.status === 'Aprovado' ? ('Aprovado' as const) : ('Rascunho' as const);
    const dataToSave = {
      ...mapFormToFirestore(values, status),
      ...(currentItem ? {} : { createdAt: new Date().toISOString() })};

    if (currentItem) {
      const docRef = doc(firestore, 'estudosCavidades', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => toast({ title: 'Estudo atualizado' }))
        .catch((error) => {
          handleFirestoreFormError(error, {
            toast,
            title: 'Erro ao salvar estudo de cavidades',
            context: {
              path: docRef.path,
              operation: 'update',
              requestResourceData: dataToSave}});})
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'estudosCavidades');
      addDoc(collectionRef, dataToSave)
        .then((docRef) => {
          toast({ title: 'Estudo criado', description: values.empreendimento.nome });
          onCreated?.(docRef.id);
        })
        .catch((error) => {
          handleFirestoreFormError(error, {
            toast,
            title: 'Erro ao salvar estudo de cavidades',
            context: {
              path: collectionRef.path,
              operation: 'create',
              requestResourceData: dataToSave}});})
        .finally(() => setLoading(false));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 text-sm">
          <Button variant="outline" size="sm" asChild>
            <Link href="/analise-ambiental">Análise geoespacial</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/studies/ide-sisemanet">IDE-SisemaNet</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://ecosistemas.meioambiente.mg.gov.br/sla/#/acesso-visitante"
              target="_blank"
              rel="noopener noreferrer"
            >
              EcoSistemas (visitante)
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>

        <Tabs defaultValue="identificacao" className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="identificacao">Identificação</TabsTrigger>
            <TabsTrigger value="triagem">Triagem</TabsTrigger>
            <TabsTrigger value="prospecao">Prospecção</TabsTrigger>
            <TabsTrigger value="impactos">Impactos</TabsTrigger>
            <TabsTrigger value="cavidades">Cavidades</TabsTrigger>
            <TabsTrigger value="checklist">Checklist IS 08</TabsTrigger>
          </TabsList>

          <TabsContent value="identificacao" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="nivelEstudo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível do estudo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(NIVEL_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>IS SISEMA 08/2017 — ver docs/ESTUDO-CAVIDADES-MG.md</FormDescription>
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="requerente.clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingClients}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vincular cliente" />
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
                    <FormLabel>Projeto / imóvel</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingProjects}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vincular projeto" />
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
            </div>
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="empreendimento.nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empreendimento</FormLabel>
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
            </div>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Responsável técnico</CardTitle>
                <CardDescription>
                  Selecione um profissional já cadastrado em{' '}
                  <Link
                    href="/technical-responsible"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Configurações → Responsáveis técnicos
                  </Link>
                  . Os campos abaixo são preenchidos automaticamente e podem ser ajustados para
                  este estudo (ex.: ART específica).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="responsavelTecnico.technicalResponsibleId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Buscar responsável técnico cadastrado</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (value === '__none__') {
                            field.onChange('');
                            return;
                          }
                          field.onChange(value);
                        }}
                        value={field.value || '__none__'}
                        disabled={isLoadingResponsibles}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingResponsibles
                                  ? 'Carregando...'
                                  : 'Selecione o responsável técnico'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">— Preencher manualmente —</SelectItem>
                          {technicalResponsibles?.map((rt) => (
                            <SelectItem key={rt.id} value={rt.id}>
                              {rt.name}
                              {rt.registrationNumber
                                ? ` · ${rt.registrationNumber}`
                                : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="responsavelTecnico.formacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formação</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Processo (SLA / SEI)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="processo.sla"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº processo SLA</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="processo.sei"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº SEI</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="processo.supram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SUPRAM</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex.: Leste Mineiro" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="processo.modalidadeSugerida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modalidade</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="LAS, LAC1, LAC2, LAT..." />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <FormField
              control={form.control}
              name="memorialApresentacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apresentação / objetivo do estudo</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[120px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="triagem" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="triagem.potencialCecav"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potencial CECAV (IDE-Sisema)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nao_aplicavel">Não verificado</SelectItem>
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="muito_alto">Muito alto</SelectItem>
                      <SelectItem value="misto">Misto na ADA</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="triagem.criterioLocacionalIncide"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Critério locacional cavidades incide (DN 217)</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="triagem.adaUrbanizada"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">ADA+250 m totalmente urbanizada</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="triagem.pedidoNaoIncidenciaCriterio"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Pedido não incidência critério (ampliação)</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="triagem.observacoesIde"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas da consulta IDE / camadas</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[80px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="triagem.justificativaNaoIncidencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa não incidência (Dec. 47.383 art. 35)</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[80px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memorialCriterioLocacional"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memorial — estudo critério locacional (cavidades)</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[100px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="prospecao" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="prospecao.kmCaminhamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caminhamento (km)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prospecao.areaAdaHa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ADA (ha)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prospecao.conclusaoSemCavidades"
                render={({ field }) => (
                  <FormItem className="flex items-end gap-2 pb-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Conclusão: sem cavidades na prospecção</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="prospecao.mapaPotencialNotas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mapa de potencial espeleológico local</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[100px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prospecao.memorialProspecao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memorial de prospecção</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[120px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="impactos" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="impactos.haImpactoIrreversivel"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Há impacto negativo irreversível</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="impactos.medidasMitigadoras"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medidas mitigadoras / monitoramento</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[80px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="impactos.areaInfluenciaNotas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área de influência (definitiva)</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[80px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="impactos.compensacaoNotas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relevância e compensação (IN 02/2017, Dec. 47.041/2016)</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[120px]" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="cavidades" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <CardDescription>Cadastro de cavidades identificadas na prospecção.</CardDescription>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    codigo: '',
                    denominacao: '',
                    tipo: 'caverna',
                    coordenadas: createDefaultMonitoringPontoCoordenadas(),
                    latitude: '',
                    longitude: '',
                    desenvolvimentoLinearM: '',
                    litologia: '',
                    grauRelevancia: 'nao_classificado',
                    naAda: true,
                    observacoes: ''})
                }
              >
                <PlusCircle className="mr-1 h-4 w-4" />
                Adicionar
              </Button>
            </div>
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma cavidade registrada.</p>
            )}
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="grid gap-3 pt-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`cavidadesRegistradas.${index}.codigo`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input {...f} placeholder="MG-0000" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`cavidadesRegistradas.${index}.denominacao`}
                    render={({ field: f }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Denominação</FormLabel>
                        <FormControl>
                          <Input {...f} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`cavidadesRegistradas.${index}.tipo`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={f.onChange} value={f.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="caverna">Caverna</SelectItem>
                            <SelectItem value="abismo">Abismo</SelectItem>
                            <SelectItem value="abrigo">Abrigo</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-3">
                    <CoordinateInput
                      form={form}
                      basePath={`cavidadesRegistradas.${index}.coordenadas`}
                      variant="coords-only"
                      title="Coordenadas da entrada (SIRGAS 2000)"
                      lockDatum
                      showLegacyDatums={false}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`cavidadesRegistradas.${index}.desenvolvimentoLinearM`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Desenv. linear (m)</FormLabel>
                        <FormControl>
                          <Input {...f} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`cavidadesRegistradas.${index}.grauRelevancia`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Relevância</FormLabel>
                        <Select onValueChange={f.onChange} value={f.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nao_classificado">Não classificado</SelectItem>
                            <SelectItem value="maximo">Máximo</SelectItem>
                            <SelectItem value="alto">Alto</SelectItem>
                            <SelectItem value="medio">Médio</SelectItem>
                            <SelectItem value="baixo">Baixo</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <div className="flex items-end justify-end md:col-span-3">
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                      <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4 pt-4">
            <CardDescription>
              Itens alinhados à IS SISEMA 08/2017 — marque conforme o estudo avança.
            </CardDescription>
            <div className="grid gap-3">
              {CHECKLIST_IS08_LABELS.map((item) => (
                <FormField
                  key={item.key}
                  control={form.control}
                  name={`checklistIs08.${item.key}`}
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal leading-snug">{item.label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 border-t pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}
