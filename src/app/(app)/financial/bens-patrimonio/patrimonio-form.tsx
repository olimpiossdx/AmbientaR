'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { BrDateFormControl } from '@/components/form/br-date-input';
import { useToast } from '@/hooks/use-toast';
import type {
  BemPatrimonio,
  BemPatrimonioCategoria,
  BemPatrimonioSubtipo,
  BemPatrimonioStatus,
  BemPatrimonioMetodoDepreciacao,
} from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AttachmentPreviewSection } from '@/components/shared/attachment-preview-section';
import { UploadPreparationDialog } from '@/components/shared/upload-preparation-dialog';
import { useStorageFileUpload } from '@/hooks/use-storage-file-upload';
import { UPLOAD_RAW_FILE_SAFETY_MAX } from '@/lib/upload-limits';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const MOVEL_SUBTIPOS: { value: BemPatrimonioSubtipo; label: string }[] = [
  { value: 'veiculo', label: 'Veículo automotor' },
  { value: 'moto', label: 'Moto' },
  { value: 'motocicleta', label: 'Motocicleta' },
  { value: 'barco', label: 'Barco / embarcação' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'maquina', label: 'Máquina' },
  { value: 'informatica', label: 'Informática / TI' },
  { value: 'moveis_utensilios', label: 'Móveis e utensílios' },
  { value: 'outro', label: 'Outro bem móvel' },
];

const IMOVEL_SUBTIPOS: { value: BemPatrimonioSubtipo; label: string }[] = [
  { value: 'lote', label: 'Lote' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'fazenda', label: 'Fazenda / propriedade rural' },
  { value: 'predio', label: 'Prédio / edificação' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'sala_comercial', label: 'Sala comercial' },
  { value: 'outro', label: 'Outro imóvel' },
];

const STATUS_OPTIONS: { value: BemPatrimonioStatus; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'em_manutencao', label: 'Em manutenção' },
  { value: 'alienado', label: 'Alienado / vendido' },
  { value: 'baixado', label: 'Baixado' },
];

const formSchema = z.object({
  codigoPatrimonio: z.string().optional(),
  descricao: z.string().min(2, 'A descrição é obrigatória.'),
  categoria: z.enum(['movel', 'imovel']),
  subtipo: z.string().min(1, 'Selecione o subtipo.'),
  status: z.enum(['ativo', 'baixado', 'alienado', 'em_manutencao']),
  identificacao: z.string().optional(),
  dataAquisicao: z.date({ required_error: 'A data de aquisição é obrigatória.' }),
  valorAquisicao: z.coerce.number().positive('Informe o valor de aquisição.'),
  notaFiscalNumero: z.string().optional(),
  notaFiscalSerie: z.string().optional(),
  notaFiscalChave: z.string().optional(),
  fornecedorNome: z.string().optional(),
  fornecedorCnpj: z.string().optional(),
  contaContabilAtivo: z.string().optional(),
  contaContabilDepreciacao: z.string().optional(),
  contaContabilDespesaDepreciacao: z.string().optional(),
  centroCusto: z.string().optional(),
  classificacaoFiscal: z.string().optional(),
  unidadeMedida: z.string().optional(),
  metodoDepreciacao: z.enum(['linear', 'nao_depreciavel']),
  vidaUtilMeses: z.coerce.number().optional(),
  taxaDepreciacaoAnual: z.coerce.number().optional(),
  valorResidual: z.coerce.number().optional(),
  depreciacaoAcumulada: z.coerce.number().optional(),
  depreciarNoMesAquisicao: z.boolean().optional(),
  logradouro: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
  matricula: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  areaM2: z.coerce.number().optional(),
  observacoes: z.string().optional(),
  lalurObservacoes: z.string().optional(),
  file: z
    .any()
    .optional()
    .refine(
      (files) =>
        !files || files.length === 0 || files?.[0]?.size <= UPLOAD_RAW_FILE_SAFETY_MAX,
      'Arquivo excede o limite de processamento no navegador.',
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface PatrimonioFormProps {
  currentItem?: BemPatrimonio | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value.slice(0, 10));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function subtiposForCategoria(cat: BemPatrimonioCategoria) {
  return cat === 'imovel' ? IMOVEL_SUBTIPOS : MOVEL_SUBTIPOS;
}

export function PatrimonioForm({ currentItem, onSuccess, onCancel }: PatrimonioFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(
    currentItem?.fileUrl || null,
  );
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { uploadFile, dialogProps } = useStorageFileUpload({
    storageFolder: 'bens_patrimonio',
    buildStoragePath: (file, safe) =>
      `bens_patrimonio/${currentItem?.id ?? 'novo'}/${Date.now()}-${safe}`,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigoPatrimonio: currentItem?.codigoPatrimonio ?? '',
      descricao: currentItem?.descricao ?? '',
      categoria: currentItem?.categoria ?? 'movel',
      subtipo: currentItem?.subtipo ?? 'equipamento',
      status: currentItem?.status ?? 'ativo',
      identificacao: currentItem?.identificacao ?? '',
      dataAquisicao: parseDate(currentItem?.dataAquisicao),
      valorAquisicao: currentItem?.valorAquisicao ?? 0,
      notaFiscalNumero: currentItem?.notaFiscalNumero ?? '',
      notaFiscalSerie: currentItem?.notaFiscalSerie ?? '',
      notaFiscalChave: currentItem?.notaFiscalChave ?? '',
      fornecedorNome: currentItem?.fornecedorNome ?? '',
      fornecedorCnpj: currentItem?.fornecedorCnpj ?? '',
      contaContabilAtivo: currentItem?.contaContabilAtivo ?? '',
      contaContabilDepreciacao: currentItem?.contaContabilDepreciacao ?? '',
      contaContabilDespesaDepreciacao: currentItem?.contaContabilDespesaDepreciacao ?? '',
      centroCusto: currentItem?.centroCusto ?? '',
      classificacaoFiscal: currentItem?.classificacaoFiscal ?? '',
      unidadeMedida: currentItem?.unidadeMedida ?? 'UN',
      metodoDepreciacao: currentItem?.metodoDepreciacao ?? 'linear',
      vidaUtilMeses: currentItem?.vidaUtilMeses ?? undefined,
      taxaDepreciacaoAnual: currentItem?.taxaDepreciacaoAnual ?? undefined,
      valorResidual: currentItem?.valorResidual ?? 0,
      depreciacaoAcumulada: currentItem?.depreciacaoAcumulada ?? 0,
      depreciarNoMesAquisicao: currentItem?.depreciarNoMesAquisicao ?? false,
      logradouro: currentItem?.logradouro ?? '',
      municipio: currentItem?.municipio ?? '',
      uf: currentItem?.uf ?? '',
      cep: currentItem?.cep ?? '',
      matricula: currentItem?.matricula ?? '',
      inscricaoMunicipal: currentItem?.inscricaoMunicipal ?? '',
      areaM2: currentItem?.areaM2 ?? undefined,
      observacoes: currentItem?.observacoes ?? '',
      lalurObservacoes: currentItem?.lalurObservacoes ?? '',
    },
  });

  const categoria = form.watch('categoria');
  const metodoDepreciacao = form.watch('metodoDepreciacao');
  const subtipoOptions = subtiposForCategoria(categoria);

  React.useEffect(() => {
    const currentSub = form.getValues('subtipo');
    const valid = subtipoOptions.some((s) => s.value === currentSub);
    if (!valid) {
      form.setValue('subtipo', subtipoOptions[0]?.value ?? 'outro');
    }
  }, [categoria, form, subtipoOptions]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    inputEl.value = '';
    setIsUploading(true);
    setUploadedFileUrl(null);
    try {
      const downloadUrl = await uploadFile(file);
      if (!downloadUrl) return;
      setUploadedFileUrl(downloadUrl);
      toast({ title: 'Documento carregado', description: 'PDF/nota fiscal pronto para salvar.' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: 'Não foi possível enviar o arquivo.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  async function onSubmit(values: FormValues) {
    setLoading(true);
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    const now = new Date().toISOString();
    const dataToSave: Omit<BemPatrimonio, 'id'> = {
      codigoPatrimonio: values.codigoPatrimonio?.trim() || undefined,
      descricao: values.descricao.trim(),
      categoria: values.categoria,
      subtipo: values.subtipo as BemPatrimonioSubtipo,
      status: values.status,
      identificacao: values.identificacao?.trim() || undefined,
      dataAquisicao: values.dataAquisicao.toISOString().slice(0, 10),
      valorAquisicao: values.valorAquisicao,
      notaFiscalNumero: values.notaFiscalNumero?.trim() || undefined,
      notaFiscalSerie: values.notaFiscalSerie?.trim() || undefined,
      notaFiscalChave: values.notaFiscalChave?.trim() || undefined,
      fornecedorNome: values.fornecedorNome?.trim() || undefined,
      fornecedorCnpj: values.fornecedorCnpj?.trim() || undefined,
      contaContabilAtivo: values.contaContabilAtivo?.trim() || undefined,
      contaContabilDepreciacao: values.contaContabilDepreciacao?.trim() || undefined,
      contaContabilDespesaDepreciacao: values.contaContabilDespesaDepreciacao?.trim() || undefined,
      centroCusto: values.centroCusto?.trim() || undefined,
      classificacaoFiscal: values.classificacaoFiscal?.trim() || undefined,
      unidadeMedida: values.unidadeMedida?.trim() || undefined,
      metodoDepreciacao: values.metodoDepreciacao as BemPatrimonioMetodoDepreciacao,
      vidaUtilMeses: values.metodoDepreciacao === 'linear' ? values.vidaUtilMeses : undefined,
      taxaDepreciacaoAnual: values.metodoDepreciacao === 'linear' ? values.taxaDepreciacaoAnual : undefined,
      valorResidual: values.valorResidual,
      depreciacaoAcumulada: values.depreciacaoAcumulada,
      depreciarNoMesAquisicao: values.depreciarNoMesAquisicao,
      logradouro: values.logradouro?.trim() || undefined,
      municipio: values.municipio?.trim() || undefined,
      uf: values.uf?.trim() || undefined,
      cep: values.cep?.trim() || undefined,
      matricula: values.matricula?.trim() || undefined,
      inscricaoMunicipal: values.inscricaoMunicipal?.trim() || undefined,
      areaM2: values.areaM2,
      observacoes: values.observacoes?.trim() || undefined,
      lalurObservacoes: values.lalurObservacoes?.trim() || undefined,
      fileUrl: uploadedFileUrl || currentItem?.fileUrl || undefined,
      updatedAt: now,
      createdAt: currentItem?.createdAt ?? now,
    };

    const persist = currentItem
      ? updateDoc(doc(firestore, 'bens_patrimonio', currentItem.id), dataToSave)
      : addDoc(collection(firestore, 'bens_patrimonio'), dataToSave);

    persist
      .then(() => {
        toast({
          title: currentItem ? 'Bem atualizado' : 'Bem cadastrado',
          description: 'Registro de patrimônio salvo com sucesso.',
        });
        onSuccess?.();
      })
      .catch(() => {
        const path = currentItem
          ? `bens_patrimonio/${currentItem.id}`
          : 'bens_patrimonio';
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path,
            operation: currentItem ? 'update' : 'create',
          }),
        );
      })
      .finally(() => setLoading(false));
  }

  const valorLiquido =
    (form.watch('valorAquisicao') || 0) - (form.watch('depreciacaoAcumulada') || 0);

  return (
    <>
      <UploadPreparationDialog {...dialogProps} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Accordion type="multiple" defaultValue={['identificacao', 'aquisicao']} className="w-full">
            <AccordionItem value="identificacao">
              <AccordionTrigger>Identificação do bem</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="codigoPatrimonio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código patrimônio / plaqueta</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: PAT-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Veículo Fiat Strada — frota campo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v as BemPatrimonioCategoria)}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="movel">Bem móvel</SelectItem>
                            <SelectItem value="imovel">Imóvel</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subtipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtipo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subtipoOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="identificacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {categoria === 'movel' ? 'Placa / nº série / RENAVAM' : 'Matrícula / inscrição'}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="aquisicao">
              <AccordionTrigger>Aquisição e nota fiscal</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataAquisicao"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de aquisição *</FormLabel>
                        <FormControl>
                          <BrDateFormControl
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            asDate
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="valorAquisicao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor de aquisição (R$) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="notaFiscalNumero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº nota fiscal</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notaFiscalSerie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Série NF</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notaFiscalChave"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chave NF-e (44 dígitos)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fornecedorNome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor / vendedor</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fornecedorCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ do fornecedor</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contabil">
              <AccordionTrigger>Contabilidade e centro de custo</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contaContabilAtivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta contábil do ativo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: 1.2.3.01.001" {...field} />
                        </FormControl>
                        <FormDescription>Plano de contas — imobilizado</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="centroCusto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Centro de custo (SPED)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contaContabilDepreciacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta depreciação acumulada</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contaContabilDespesaDepreciacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta despesa de depreciação</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="classificacaoFiscal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classificação fiscal / grupo do bem</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unidadeMedida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade de medida</FormLabel>
                        <FormControl>
                          <Input placeholder="UN" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="depreciacao">
              <AccordionTrigger>Depreciação (LALUR / fiscal)</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="metodoDepreciacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="linear">Linear (depreciável)</SelectItem>
                          <SelectItem value="nao_depreciavel">Não depreciável (ex.: terreno)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Terrenos e lotes sem edificação costumam ser não depreciáveis para IRPJ.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {metodoDepreciacao === 'linear' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="vidaUtilMeses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vida útil (meses)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="taxaDepreciacaoAnual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxa anual (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="valorResidual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor residual (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="depreciacaoAcumulada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Depreciação acumulada (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center gap-3">
                      <FormField
                        control={form.control}
                        name="depreciarNoMesAquisicao"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <Label>Depreciar no mês da aquisição</Label>
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
                <p className="text-sm text-muted-foreground rounded-md border p-3 bg-muted/30">
                  Valor contábil líquido estimado:{' '}
                  <strong>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      Math.max(0, valorLiquido),
                    )}
                  </strong>
                </p>
                <FormField
                  control={form.control}
                  name="lalurObservacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações LALUR / ajustes fiscais</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Diferenças entre depreciação contábil e fiscal, adições, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            {categoria === 'imovel' && (
              <AccordionItem value="imovel">
                <AccordionTrigger>Localização do imóvel</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <FormField
                    control={form.control}
                    name="logradouro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="municipio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Município</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="uf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <FormControl>
                            <Input maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <MaskedInput mask="cep" placeholder="00000-000" maxLength={9} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="matricula"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Matrícula (cartório)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="inscricaoMunicipal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inscrição municipal / IPTU</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="areaM2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área (m²)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="documentos">
              <AccordionTrigger>Documentos (PDF)</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { value: _v, onChange: _o, ...field } }) => (
                    <FormItem>
                      <FormLabel>Nota fiscal / comprovante (PDF ou imagem)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="application/pdf,image/*"
                          disabled={isUploading}
                          onChange={handleFileChange}
                          {...field}
                        />
                      </FormControl>
                      {isUploading && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando arquivo…
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(uploadedFileUrl || currentItem?.fileUrl) && (
                  <AttachmentPreviewSection
                    fileUrl={uploadedFileUrl || currentItem?.fileUrl || null}
                    sectionLabel="Documento do bem"
                  />
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="obs">
              <AccordionTrigger>Observações gerais</AccordionTrigger>
              <AccordionContent className="pt-2">
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading || isUploading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentItem ? 'Salvar alterações' : 'Cadastrar bem'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
