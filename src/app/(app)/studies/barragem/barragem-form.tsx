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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProjetoTecnicoBarragem, Empreendedor as Client, Project } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BARRAGEM_APRESENTACAO_MODELO,
  BARRAGEM_CONSERVACAO_MODELO,
  BARRAGEM_INFO_TOPOGRAFICAS_MODELO,
} from './barragem-defaults';
import {
  BarragemMemorialSection,
  BARRAGEM_MEMORIAL_TEXTAREA_CLASS,
} from './barragem-memorial-section';

const nivelSchema = z.object({
  cota: z.string().optional(),
  areaM2: z.string().optional(),
  alturaM: z.string().optional(),
  volumeM3: z.string().optional(),
  volumeAcumuladoM3: z.string().optional(),
});

const formSchema = z.object({
  status: z.enum(['Rascunho', 'Aprovado']).optional(),
  arquivoCodigo: z.string().optional(),
  apresentacao: z.string().optional(),
  requerente: z.object({
    clientId: z.string().optional(),
    nome: z.string().min(1, 'O nome do proprietário é obrigatório.'),
    cpfCnpj: z.string().min(1, 'O CPF/CNPJ é obrigatório.'),
  }),
  empreendimento: z.object({
    projectId: z.string().optional(),
    nome: z.string().min(1, 'O nome do empreendimento é obrigatório.'),
    denominacao: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional(),
    car: z.string().optional(),
    matricula: z.string().optional(),
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
  usoPretendido: z.string().optional(),
  espelhoDaguaM2: z.string().optional(),
  capacidadeArmazenamentoM3: z.string().optional(),
  localEmissao: z.string().optional(),
  dataEmissao: z.string().optional(),
  informacoesBasicas: z
    .object({
      topograficas: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      altitude: z.string().optional(),
    })
    .optional(),
  definicaoBarragem: z.string().optional(),
  capacidadeReservatorio: z
    .object({
      descricao: z.string().optional(),
      cotaEspelhoDagua: z.string().optional(),
      cotaTerrenoNatural: z.string().optional(),
      areaEspelhoM2: z.string().optional(),
      volumeArmazenadoM3: z.string().optional(),
      tabelaNiveis: z.array(nivelSchema).optional(),
    })
    .optional(),
  aterro: z.string().optional(),
  taludesAterro: z.string().optional(),
  fundacao: z.string().optional(),
  drenoPe: z.string().optional(),
  descargaFundo: z.string().optional(),
  calculosHidrologicos: z
    .object({
      caracteristicasBacia: z.string().optional(),
      tempoConcentracao: z.string().optional(),
      intensidadeChuva: z.string().optional(),
      coeficienteEscoamento: z.string().optional(),
      vazaoCheia: z.string().optional(),
    })
    .optional(),
  dimensionamentoCapacidadeCheia: z.string().optional(),
  extravasor: z.string().optional(),
  implantacaoProjeto: z.string().optional(),
  conservacaoManutencao: z.string().optional(),
  literaturaConsultada: z.string().optional(),
  anexosDescricao: z.string().optional(),
});

type BarragemFormValues = z.infer<typeof formSchema>;

interface BarragemFormProps {
  currentItem?: ProjetoTecnicoBarragem | null;
  /** Chamado após o primeiro salvamento (novo projeto), com o id do documento criado. */
  onCreated?: (id: string) => void;
  onCancel?: () => void;
}

function emptyDefaults(): BarragemFormValues {
  return {
    status: 'Rascunho',
    arquivoCodigo: '',
    apresentacao: BARRAGEM_APRESENTACAO_MODELO,
    requerente: { clientId: '', nome: '', cpfCnpj: '' },
    empreendimento: {
      projectId: '',
      nome: '',
      denominacao: '',
      municipio: '',
      uf: 'MG',
      car: '',
      matricula: '',
    },
    responsavelTecnico: {
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      formacao: '',
      registroConselho: '',
      art: '',
    },
    usoPretendido: '',
    espelhoDaguaM2: '',
    capacidadeArmazenamentoM3: '',
    localEmissao: '',
    dataEmissao: new Date().toLocaleDateString('pt-BR'),
    informacoesBasicas: {
      topograficas: BARRAGEM_INFO_TOPOGRAFICAS_MODELO,
      latitude: '',
      longitude: '',
      altitude: '',
    },
    definicaoBarragem: '',
    capacidadeReservatorio: {
      descricao: '',
      cotaEspelhoDagua: '',
      cotaTerrenoNatural: '',
      areaEspelhoM2: '',
      volumeArmazenadoM3: '',
      tabelaNiveis: [],
    },
    aterro: '',
    taludesAterro: '',
    fundacao: '',
    drenoPe: '',
    descargaFundo: '',
    calculosHidrologicos: {
      caracteristicasBacia: '',
      tempoConcentracao: '',
      intensidadeChuva: '',
      coeficienteEscoamento: '',
      vazaoCheia: '',
    },
    dimensionamentoCapacidadeCheia: '',
    extravasor: '',
    implantacaoProjeto: '',
    conservacaoManutencao: BARRAGEM_CONSERVACAO_MODELO,
    literaturaConsultada: '',
    anexosDescricao: '',
  };
}

export function BarragemForm({ currentItem, onCreated, onCancel }: BarragemFormProps) {
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

  const form = useForm<BarragemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem
      ? { ...emptyDefaults(), ...currentItem }
      : emptyDefaults(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'capacidadeReservatorio.tabelaNiveis',
  });

  const selectedRequerenteId = form.watch('requerente.clientId');
  const selectedProjectId = form.watch('empreendimento.projectId');

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
        form.setValue('empreendimento.denominacao', project.propertyName);
        form.setValue('empreendimento.municipio', project.municipio || '');
        form.setValue('empreendimento.uf', project.uf || 'MG');
        form.setValue('empreendimento.car', project.car?.receiptNumber || '');
        form.setValue('empreendimento.matricula', project.matricula || '');
        const geo = project.geographicLocation;
        if (geo?.latLong) {
          const lat = geo.latLong.lat;
          const lng = geo.latLong.long;
          if (lat?.grau) {
            form.setValue(
              'informacoesBasicas.latitude',
              `${lat.grau}°${lat.min || '0'}'${lat.seg || '0'}"S`,
            );
          }
          if (lng?.grau) {
            form.setValue(
              'informacoesBasicas.longitude',
              `${lng.grau}°${lng.min || '0'}'${lng.seg || '0'}"O`,
            );
          }
        }
        if (geo?.additionalLocationInfo) {
          form.setValue('informacoesBasicas.altitude', geo.additionalLocationInfo);
        }
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
        description: 'Corrija os campos obrigatórios antes de salvar.',
      });
      setLoading(false);
      return;
    }

    const values = form.getValues();
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    const dataToSave = {
      ...values,
      status: (currentItem?.status === 'Aprovado' ? 'Aprovado' : 'Rascunho') as 'Rascunho' | 'Aprovado',
    };

    if (currentItem) {
      const docRef = doc(firestore, 'projetosTecnicosBarragem', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({ title: 'Projeto atualizado', description: 'Salvo com sucesso.' });
        })
        .catch(() => {
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: docRef.path,
              operation: 'update',
              requestResourceData: dataToSave,
            }),
          );
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'projetosTecnicosBarragem');
      addDoc(collectionRef, dataToSave)
        .then((docRef) => {
          toast({
            title: 'Projeto criado',
            description: `Memorial para ${values.empreendimento.nome} registrado.`,
          });
          onCreated?.(docRef.id);
        })
        .catch(() => {
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: collectionRef.path,
              operation: 'create',
              requestResourceData: dataToSave,
            }),
          );
        })
        .finally(() => setLoading(false));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="flex h-full flex-col overflow-hidden">
        <Tabs defaultValue="identificacao" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="identificacao">Identificação</TabsTrigger>
            <TabsTrigger value="apresentacao">Apresentação</TabsTrigger>
            <TabsTrigger value="memorial">Memorial 1–3</TabsTrigger>
            <TabsTrigger value="estruturas">Aterro 4–8</TabsTrigger>
            <TabsTrigger value="hidrologia">Hidrologia 9–11</TabsTrigger>
            <TabsTrigger value="fechamento">Implantação 12–16</TabsTrigger>
          </TabsList>

          <div className="form-scroll-body space-y-6">
            <TabsContent value="identificacao" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Identificação e vínculos</CardTitle>
                  <CardDescription>
                    Proprietário, empreendimento cadastrado e código do arquivo (exportação Word).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                            <SelectValue placeholder="Selecione o cliente" />
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
                            <SelectValue placeholder="Vincule o empreendimento" />
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
                      <FormDescription>
                        Necessário para exportar Word com placeholders do cadastro.
                      </FormDescription>
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
                      <FormLabel>Proprietário / requerente</FormLabel>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dados do empreendimento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                <FormField
                  control={form.control}
                  name="empreendimento.denominacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Denominação do imóvel</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
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
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="arquivoCodigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código do arquivo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: FPT_318-B" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="usoPretendido"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Uso pretendido</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex.: acumulação de água para irrigação"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="espelhoDaguaM2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Espelho d&apos;água (m²)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacidadeArmazenamentoM3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade (m³)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Responsável técnico</CardTitle>
                  <CardDescription>
                    Dados obrigatórios do RT. Local e data de emissão ficam na seção 15 (aba
                    Implantação 12–16).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                  name="responsavelTecnico.registroConselho"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CREA / registro</FormLabel>
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
              </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="apresentacao" className="mt-4 space-y-4">
              <BarragemMemorialSection
                title="Apresentação"
                description="Texto introdutório do memorial (exportado na sequência do sumário, antes da identificação detalhada)."
              >
                <FormField
                  control={form.control}
                  name="apresentacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={8}
                          className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                          placeholder={BARRAGEM_APRESENTACAO_MODELO.slice(0, 120) + '…'}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Descreva o objetivo do projeto, uso pretendido e escopo do memorial. O modelo
                        padrão é carregado em projetos novos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </BarragemMemorialSection>
            </TabsContent>

            <TabsContent value="memorial" className="mt-4 space-y-4">
              <BarragemMemorialSection title="1. Informações básicas">
              <FormField
                control={form.control}
                name="informacoesBasicas.topograficas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informações topográficas</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="informacoesBasicas.latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="informacoesBasicas.longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="informacoesBasicas.altitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altitude (m)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              </BarragemMemorialSection>

              <BarragemMemorialSection title="2. Definição da barragem">
              <FormField
                control={form.control}
                name="definicaoBarragem"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={5}
                        className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              </BarragemMemorialSection>

              <BarragemMemorialSection title="3. Capacidade do reservatório">
              <FormField
                control={form.control}
                name="capacidadeReservatorio.descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="capacidadeReservatorio.cotaEspelhoDagua"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cota espelho d&apos;água</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacidadeReservatorio.cotaTerrenoNatural"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cota terreno natural</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacidadeReservatorio.areaEspelhoM2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área espelho (m²)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacidadeReservatorio.volumeArmazenadoM3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume armazenado (m³)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Tabela de níveis (cota / área / volume)</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        cota: '',
                        areaM2: '',
                        alturaM: '',
                        volumeM3: '',
                        volumeAcumuladoM3: '',
                      })
                    }
                  >
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Linha
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-2 rounded border p-2 md:grid-cols-6">
                    {(['cota', 'areaM2', 'alturaM', 'volumeM3', 'volumeAcumuladoM3'] as const).map(
                      (key) => (
                        <FormField
                          key={key}
                          control={form.control}
                          name={`capacidadeReservatorio.tabelaNiveis.${index}.${key}`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder={key} {...f} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ),
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              </BarragemMemorialSection>
            </TabsContent>

            <TabsContent value="estruturas" className="mt-4 space-y-4">
              {(
                [
                  { name: 'aterro' as const, title: '4. Aterro', rows: 5 },
                  { name: 'taludesAterro' as const, title: '5. Taludes do aterro', rows: 4 },
                  { name: 'fundacao' as const, title: '6. Fundação', rows: 4 },
                  { name: 'drenoPe' as const, title: '7. Dreno de pé', rows: 3 },
                  { name: 'descargaFundo' as const, title: '8. Descarga de fundo', rows: 4 },
                ] as const
              ).map((sec) => (
                <BarragemMemorialSection key={sec.name} title={sec.title}>
                  <FormField
                    control={form.control}
                    name={sec.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            rows={sec.rows}
                            className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </BarragemMemorialSection>
              ))}
            </TabsContent>

            <TabsContent value="hidrologia" className="mt-4 space-y-4">
              <BarragemMemorialSection title="9. Cálculos hidrológicos">
                {(
                  [
                    {
                      name: 'calculosHidrologicos.caracteristicasBacia' as const,
                      label: '9.1 Características da bacia',
                      rows: 4,
                    },
                    {
                      name: 'calculosHidrologicos.tempoConcentracao' as const,
                      label: '9.2 Tempo de concentração',
                      rows: 3,
                    },
                    {
                      name: 'calculosHidrologicos.intensidadeChuva' as const,
                      label: '9.3 Intensidade da chuva',
                      rows: 3,
                    },
                    {
                      name: 'calculosHidrologicos.coeficienteEscoamento' as const,
                      label: '9.4 Coeficiente de escoamento',
                      rows: 3,
                    },
                    {
                      name: 'calculosHidrologicos.vazaoCheia' as const,
                      label: '9.5 Vazão de cheia',
                      rows: 3,
                    },
                  ] as const
                ).map((sec) => (
                  <FormField
                    key={sec.name}
                    control={form.control}
                    name={sec.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{sec.label}</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={sec.rows}
                            className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </BarragemMemorialSection>
              <BarragemMemorialSection title="10. Dimensionamento da capacidade de cheia">
                <FormField
                  control={form.control}
                  name="dimensionamentoCapacidadeCheia"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={4}
                          className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </BarragemMemorialSection>
              <BarragemMemorialSection title="11. Extravasor">
                <FormField
                  control={form.control}
                  name="extravasor"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={5}
                          className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </BarragemMemorialSection>
            </TabsContent>

            <TabsContent value="fechamento" className="mt-4 space-y-4">
              <BarragemMemorialSection
                title="12. Implantação do projeto"
                description="Plano de implantação e obras civis."
              >
                <FormField
                  control={form.control}
                  name="implantacaoProjeto"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={4}
                          className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </BarragemMemorialSection>
              <BarragemMemorialSection
                title="13. Conservação e manutenção da barragem"
                description="Vigilância, inspeções e manutenção após a construção."
              >
                <FormField
                  control={form.control}
                  name="conservacaoManutencao"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={5}
                          className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </BarragemMemorialSection>
              <BarragemMemorialSection title="14. Literatura consultada">
                <FormField
                  control={form.control}
                  name="literaturaConsultada"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={6}
                          className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </BarragemMemorialSection>
              <BarragemMemorialSection
                title="15. Responsabilidade técnica"
                description="Fechamento do memorial exportado em PDF/Word (nome, registro, local e data)."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="responsavelTecnico.nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável técnico</FormLabel>
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
                        <FormLabel>CREA / registro profissional</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="localEmissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local de emissão</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Brasília - DF" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dataEmissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de emissão</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </BarragemMemorialSection>
              <BarragemMemorialSection title="16. Anexos">
                <FormField
                  control={form.control}
                  name="anexosDescricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          rows={4}
                          className={BARRAGEM_MEMORIAL_TEXTAREA_CLASS}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Descreva os anexos; arquivos podem ser anexados na versão futura com Storage.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </BarragemMemorialSection>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex shrink-0 flex-wrap gap-2 border-t pt-4 mt-4">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleSave()}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar rascunho
          </Button>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
              Retornar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
