'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  CalendarIcon,
  PlusCircle,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  DocumentReference,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type {
  Empreendedor,
  Project,
  Inspection,
  License,
  WaterPermit,
  InsignificantWaterUse,
  FieldInspectionMotivo,
} from '@/lib/types';
import { cleanEmptyValues, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { CardFooter } from '@/components/ui/card';
import { SignaturePad } from '@/components/ui/signature-pad';
import { Badge } from '@/components/ui/badge';
import { UploadPreparationDialog } from '@/components/shared/upload-preparation-dialog';
import { usePreparedUpload } from '@/hooks/use-prepared-upload';
import {
  formatUploadLimitMb,
  UPLOAD_RAW_FILE_SAFETY_MAX,
} from '@/lib/upload-limits';
import {
  FIELD_INSPECTION_CHECKLIST,
  FIELD_INSPECTION_MOTIVOS,
  defaultChecklistResponses,
  mergeChecklistWithTemplate,
} from '@/lib/field-inspection-checklist';
import {
  buildIdentificacaoFromCadastro,
  mergeIdentificacaoPreferExisting,
} from '@/lib/field-inspection-cadastro';
import { inspectionUploadContentType } from '@/lib/inspection-attachment-media';
import { prepareInspectionEvidenceForUpload } from '@/lib/inspection-upload-prepare';
import { getUploadMaxBytes } from '@/lib/upload-limits';
import { filterProjectsByEmpreendedorId } from '@/lib/processos-form-order';
import { InspectionChecklistItem } from './inspection-checklist-item';
import { InspectionAttachmentList } from './inspection-attachment-list';

const MAX_LAUDO_ATTACHMENTS = 24;
const MAX_INCONF_IMAGES = 12;
const MAX_CHECKLIST_IMAGES = 12;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || 'anexo';
}

function normalizeFirestoreId(raw: unknown): string {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number' || typeof raw === 'bigint') return String(raw);
  if (typeof raw === 'object') {
    if (raw instanceof DocumentReference) return raw.id;
    const id = (raw as { id?: unknown }).id;
    if (typeof id === 'string' && id) return id;
  }
  return '';
}

const identificacaoSchema = z.object({
  razaoSocial: z.string().optional(),
  nomeFantasia: z.string().optional(),
  cnpjCpf: z.string().optional(),
  atividadePrincipal: z.string().optional(),
  enderecoCompleto: z.string().optional(),
  coordenadasGeograficas: z.string().optional(),
  processoLicenciamentoOutorga: z.string().optional(),
  motivoFiscalizacao: z.array(
    z.enum(['Denúncia', 'Rotina', 'Condicionante', 'Auto anterior']),
  ).optional(),
});

const checklistItemSchema = z.object({
  sectionId: z.string(),
  itemId: z.string(),
  label: z.string(),
  status: z.enum(['conforme', 'nao_conforme', 'nao_aplicavel', 'nao_verificado']),
  criticality: z.enum(['Baixa', 'Média', 'Alta', 'Urgente']).optional(),
  observations: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
});

const inconformidadeSchema = z.object({
  description: z.string().min(10, 'A descrição é obrigatória (mín. 10 caracteres).'),
  criticality: z.enum(['Baixa', 'Média', 'Alta', 'Urgente']),
  imageUrls: z.array(z.string()).optional(),
});

const inspectionSchema = z.object({
  empreendedorId: z.string().min(1, 'Selecione um empreendedor.'),
  projectId: z.string().min(1, 'Selecione um empreendimento.'),
  inspectionDate: z.date({ required_error: 'A data da vistoria é obrigatória.' }),
  identificacao: identificacaoSchema,
  checklistResponses: z.array(checklistItemSchema),
  teamObservations: z.string().optional(),
  inconformidades: z.array(inconformidadeSchema),
  laudoAttachmentUrls: z.array(z.string()).optional(),
  accompaniedBy: z.string().optional(),
  signatureUrl: z.string().optional(),
});

type InspectionFormValues = z.infer<typeof inspectionSchema>;

interface InspectionFormProps {
  onSuccess: () => void;
  currentItem?: Inspection | null;
}

const emptyIdentificacao = () => ({
  razaoSocial: '',
  nomeFantasia: '',
  cnpjCpf: '',
  atividadePrincipal: '',
  enderecoCompleto: '',
  coordenadasGeograficas: '',
  processoLicenciamentoOutorga: '',
  motivoFiscalizacao: [] as FieldInspectionMotivo[],
});

export function InspectionForm({ onSuccess, currentItem }: InspectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [uploadingLaudo, setUploadingLaudo] = React.useState(false);
  const [uploadingIncIndex, setUploadingIncIndex] = React.useState<number | null>(null);
  const [uploadingChecklistIndex, setUploadingChecklistIndex] = React.useState<number | null>(null);
  const [capturingGps, setCapturingGps] = React.useState(false);
  const laudoInputRef = React.useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const { prepareFile, dialogProps } = usePreparedUpload({
    storagePathPrefix: 'inspections/',
  });
  const limitLabel = formatUploadLimitMb({ storagePathPrefix: 'inspections/' });
  const inspectionMaxBytes = React.useMemo(
    () => getUploadMaxBytes({ storagePathPrefix: 'inspections/' }),
    [],
  );

  const uploadToStorage = React.useCallback(
    async (file: File, pathPrefix: string) => {
      if (!user?.uid) throw new Error('Utilizador não autenticado.');
      if (file.size > UPLOAD_RAW_FILE_SAFETY_MAX) {
        throw new Error('Ficheiro excede o limite de processamento no navegador.');
      }
      const prepared = await prepareInspectionEvidenceForUpload(file, {
        maxBytes: inspectionMaxBytes,
        prepareHeavy: prepareFile,
      });
      if (!prepared) throw new Error('Upload cancelado.');
      const storage = getStorage();
      const safe = sanitizeFileName(file.name);
      const storageRef = ref(
        storage,
        `inspections/${pathPrefix}/${user.uid}/${Date.now()}-${safe}`,
      );
      const snap = await uploadBytes(storageRef, prepared, {
        contentType: inspectionUploadContentType(file),
      });
      return getDownloadURL(snap.ref);
    },
    [inspectionMaxBytes, prepareFile, user?.uid],
  );

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore],
  );
  const { data: allProjects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const licensesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'licenses') : null),
    [firestore],
  );
  const { data: allLicenses } = useCollection<License>(licensesQuery);

  const outorgasQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'outorgas') : null),
    [firestore],
  );
  const { data: allOutorgas } = useCollection<WaterPermit>(outorgasQuery);

  const usosQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'usosInsignificantes') : null),
    [firestore],
  );
  const { data: allUsos } = useCollection<InsignificantWaterUse>(usosQuery);

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      empreendedorId: '',
      projectId: '',
      inspectionDate: new Date(),
      identificacao: emptyIdentificacao(),
      checklistResponses: defaultChecklistResponses(),
      teamObservations: '',
      inconformidades: [],
      laudoAttachmentUrls: [],
      accompaniedBy: '',
      signatureUrl: '',
    },
  });

  const inspectionRef = React.useRef(currentItem);
  inspectionRef.current = currentItem;
  const allProjectsRef = React.useRef(allProjects);
  allProjectsRef.current = allProjects;

  const inspectionHydrateKey = currentItem?.id
    ? [
        currentItem.id,
        normalizeFirestoreId(currentItem.empreendedorId),
        normalizeFirestoreId(currentItem.projectId),
        String(currentItem.inspectionDate ?? ''),
      ].join('\0')
    : 'new';
  const projectsListReady = allProjects != null;

  React.useLayoutEffect(() => {
    const c = inspectionRef.current;
    if (!c?.id) return;
    const projects = allProjectsRef.current;
    let empreendedorId = normalizeFirestoreId(c.empreendedorId);
    const projectId = normalizeFirestoreId(c.projectId);
    if (!empreendedorId && projectId && projects?.length) {
      const p = projects.find((x) => x.id === projectId);
      if (p?.empreendedorId) empreendedorId = normalizeFirestoreId(p.empreendedorId);
    }
    form.reset({
      empreendedorId,
      projectId,
      inspectionDate: c.inspectionDate ? new Date(c.inspectionDate) : new Date(),
      identificacao: {
        ...emptyIdentificacao(),
        ...c.identificacao,
        motivoFiscalizacao: c.identificacao?.motivoFiscalizacao ?? [],
      },
      checklistResponses: mergeChecklistWithTemplate(c.checklistResponses) as InspectionFormValues['checklistResponses'],
      teamObservations: c.teamObservations ?? '',
      inconformidades: c.inconformidades?.length
        ? c.inconformidades.map((i) => ({
            description: i.description,
            criticality: i.criticality,
            imageUrls: i.imageUrls ?? [],
          }))
        : [],
      accompaniedBy: c.accompaniedBy ?? '',
      signatureUrl: c.signatureUrl ?? '',
      laudoAttachmentUrls: c.laudoAttachmentUrls?.length ? [...c.laudoAttachmentUrls] : [],
    });
  }, [inspectionHydrateKey, projectsListReady, form]);

  const { fields: inconformidadeFields, append, remove } = useFieldArray({
    control: form.control,
    name: 'inconformidades',
  });

  const selectedEmpreendedorId = form.watch('empreendedorId');
  const selectedProjectId = form.watch('projectId');
  const checklistResponses = form.watch('checklistResponses');

  const filteredProjects = React.useMemo(
    () =>
      filterProjectsByEmpreendedorId(
        allProjects,
        selectedEmpreendedorId,
        normalizeFirestoreId,
      ),
    [allProjects, selectedEmpreendedorId],
  );

  const applyCadastro = React.useCallback(
    (onlyEmptyFields: boolean) => {
      const emp = empreendedores?.find((e) => e.id === selectedEmpreendedorId);
      const proj = allProjects?.find((p) => p.id === selectedProjectId);
      if (!emp && !proj) {
        toast({
          variant: 'destructive',
          title: 'Selecione empreendedor e empreendimento',
          description: 'Escolha os cadastros antes de importar os dados.',
        });
        return;
      }
      const built = buildIdentificacaoFromCadastro({
        empreendedor: emp,
        project: proj,
        licenses: allLicenses ?? [],
        outorgas: allOutorgas ?? [],
        usosInsignificantes: allUsos ?? [],
      });
      const current = form.getValues('identificacao');
      const merged = onlyEmptyFields
        ? mergeIdentificacaoPreferExisting(current, built)
        : { ...built, motivoFiscalizacao: current.motivoFiscalizacao ?? [] };
      form.setValue('identificacao', merged, { shouldDirty: true });
      toast({
        title: 'Dados do cadastro aplicados',
        description: onlyEmptyFields
          ? 'Campos vazios foram preenchidos. Revise e ajuste se necessário.'
          : 'Identificação atualizada a partir do cadastro.',
      });
    },
    [
      allLicenses,
      allOutorgas,
      allProjects,
      allUsos,
      empreendedores,
      form,
      selectedEmpreendedorId,
      selectedProjectId,
      toast,
    ],
  );

  const lastAppliedProjectRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!selectedProjectId) return;
    if (lastAppliedProjectRef.current === selectedProjectId) return;
    lastAppliedProjectRef.current = selectedProjectId;
    applyCadastro(true);
  }, [selectedProjectId, applyCadastro]);

  React.useEffect(() => {
    if (!selectedEmpreendedorId || !allProjects?.length) return;
    const pid = form.getValues('projectId');
    if (!pid) return;
    const proj = allProjects.find((p) => p.id === pid);
    if (proj && normalizeFirestoreId(proj.empreendedorId) !== selectedEmpreendedorId) {
      form.resetField('projectId');
    }
  }, [selectedEmpreendedorId, allProjects, form]);

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'GPS indisponível',
        description: 'Este dispositivo ou navegador não suporta geolocalização.',
      });
      return;
    }
    setCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const text = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}${accuracy ? ` (±${Math.round(accuracy)} m)` : ''}`;
        form.setValue('identificacao.coordenadasGeograficas', text, { shouldDirty: true });
        setCapturingGps(false);
        toast({ title: 'Coordenadas capturadas', description: text });
      },
      () => {
        setCapturingGps(false);
        toast({
          variant: 'destructive',
          title: 'Falha na captura',
          description: 'Permita o acesso à localização ou tente novamente ao ar livre.',
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handleLaudoFiles = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      e.target.value = '';
      if (!files?.length) return;
      const current = form.getValues('laudoAttachmentUrls') ?? [];
      if (current.length + files.length > MAX_LAUDO_ATTACHMENTS) {
        toast({
          variant: 'destructive',
          title: 'Limite de anexos',
          description: `No máximo ${MAX_LAUDO_ATTACHMENTS} ficheiros.`,
        });
        return;
      }
      setUploadingLaudo(true);
      try {
        const prefix = currentItem?.id ? `laudo/${currentItem.id}` : 'laudo/rascunho';
        const next = [...current];
        for (const file of Array.from(files)) {
          next.push(await uploadToStorage(file, prefix));
        }
        form.setValue('laudoAttachmentUrls', next, { shouldValidate: true });
        toast({ title: 'Documentos enviados' });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Erro no envio',
          description: err instanceof Error ? err.message : 'Falha no upload.',
        });
      } finally {
        setUploadingLaudo(false);
      }
    },
    [currentItem?.id, toast, uploadToStorage],
  );

  const handleInconformidadeFiles = React.useCallback(
    async (
      index: number,
      e: React.ChangeEvent<HTMLInputElement>,
      onUrlsChange: (urls: string[]) => void,
      currentUrls: string[],
    ) => {
      const files = e.target.files;
      if (!files?.length) return;
      const current = currentUrls ?? [];
      if (current.length + files.length > MAX_INCONF_IMAGES) {
        toast({ variant: 'destructive', title: 'Limite de anexos por registro.' });
        return;
      }
      setUploadingIncIndex(index);
      const optimizing = toast({
        title: 'Otimizando e enviando…',
        description: 'Aguarde o processamento do ficheiro.',
      });
      try {
        const prefix = currentItem?.id
          ? `adicional/${currentItem.id}/${index}`
          : `adicional/rascunho/${index}`;
        const next = [...current];
        for (const file of Array.from(files)) {
          next.push(await uploadToStorage(file, prefix));
        }
        onUrlsChange(next);
        toast({ title: 'Anexo enviado' });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Erro no envio',
          description: err instanceof Error ? err.message : 'Falha no upload.',
        });
      } finally {
        optimizing.dismiss?.();
        setUploadingIncIndex(null);
      }
    },
    [currentItem?.id, toast, uploadToStorage],
  );

  const handleChecklistFiles = React.useCallback(
    async (
      index: number,
      e: React.ChangeEvent<HTMLInputElement>,
      onUrlsChange: (urls: string[]) => void,
      currentUrls: string[],
    ) => {
      const files = e.target.files;
      if (!files?.length) return;
      const current = currentUrls ?? [];
      if (current.length + files.length > MAX_CHECKLIST_IMAGES) {
        toast({ variant: 'destructive', title: 'Limite de anexos por item.' });
        return;
      }
      setUploadingChecklistIndex(index);
      const optimizing = toast({
        title: 'Otimizando e enviando…',
        description: 'Aguarde o processamento do ficheiro.',
      });
      try {
        const item = form.getValues(`checklistResponses.${index}`);
        const prefix = currentItem?.id
          ? `checklist/${currentItem.id}/${item.sectionId}-${item.itemId}`
          : `checklist/rascunho/${item.sectionId}-${item.itemId}`;
        const next = [...current];
        for (const file of Array.from(files)) {
          next.push(await uploadToStorage(file, prefix));
        }
        onUrlsChange(next);
        toast({
          title: 'Evidência anexada',
          description: `${next.length} de ${MAX_CHECKLIST_IMAGES} ficheiros.`,
        });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Erro no envio',
          description: err instanceof Error ? err.message : 'Falha no upload.',
        });
      } finally {
        optimizing.dismiss?.();
        setUploadingChecklistIndex(null);
      }
    },
    [currentItem?.id, toast, uploadToStorage],
  );

  const removeLaudoUrl = (idx: number) => {
    const cur = [...(form.getValues('laudoAttachmentUrls') ?? [])];
    cur.splice(idx, 1);
    form.setValue('laudoAttachmentUrls', cur);
  };

  const removeIncUrl = (index: number, idx: number) => {
    const cur = [...(form.getValues(`inconformidades.${index}.imageUrls`) ?? [])];
    cur.splice(idx, 1);
    form.setValue(`inconformidades.${index}.imageUrls`, cur);
  };

  const removeChecklistUrl = (index: number, idx: number) => {
    const cur = [...(form.getValues(`checklistResponses.${index}.imageUrls`) ?? [])];
    cur.splice(idx, 1);
    form.setValue(`checklistResponses.${index}.imageUrls`, cur);
  };

  const toggleMotivo = (motivo: FieldInspectionMotivo, checked: boolean) => {
    const cur = form.getValues('identificacao.motivoFiscalizacao') ?? [];
    const next = checked ? [...cur, motivo] : cur.filter((m) => m !== motivo);
    form.setValue('identificacao.motivoFiscalizacao', next, { shouldDirty: true });
  };

  const handleCancelNew = React.useCallback(() => {
    if (uploadingLaudo || uploadingIncIndex !== null || uploadingChecklistIndex !== null) {
      toast({ variant: 'destructive', title: 'Aguarde o envio de ficheiros.' });
      return;
    }
    if (
      form.formState.isDirty &&
      !window.confirm('Cancelar? Os dados não guardados serão descartados.')
    ) {
      return;
    }
    router.push('/inspections');
  }, [form, router, toast, uploadingChecklistIndex, uploadingIncIndex, uploadingLaudo]);

  async function onSubmit(values: InspectionFormValues) {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Erro de autenticação' });
      return;
    }
    setLoading(true);

    const dataToSave = cleanEmptyValues({
      empreendedorId: values.empreendedorId,
      projectId: values.projectId,
      inspectionDate: values.inspectionDate.toISOString(),
      identificacao: values.identificacao,
      checklistResponses: values.checklistResponses.map((r) => {
        const row = {
          sectionId: r.sectionId,
          itemId: r.itemId,
          label: r.label,
          status: r.status,
          ...(r.status === 'nao_conforme'
            ? { criticality: r.criticality ?? 'Média' }
            : {}),
          ...(r.observations?.trim() ? { observations: r.observations.trim() } : {}),
          ...(r.imageUrls?.length ? { imageUrls: r.imageUrls } : {}),
        };
        return row;
      }),
      ...(values.teamObservations?.trim()
        ? { teamObservations: values.teamObservations.trim() }
        : {}),
      inconformidades: values.inconformidades.map((i) => ({
        description: i.description,
        criticality: i.criticality,
        ...(i.imageUrls?.length ? { imageUrls: i.imageUrls } : {}),
      })),
      ...(values.laudoAttachmentUrls?.length
        ? { laudoAttachmentUrls: values.laudoAttachmentUrls }
        : {}),
      ...(values.accompaniedBy?.trim()
        ? { accompaniedBy: values.accompaniedBy.trim() }
        : {}),
      ...(values.signatureUrl ? { signatureUrl: values.signatureUrl } : {}),
      inspectorId: currentItem?.inspectorId ?? user.uid,
      inspectorName: currentItem?.inspectorName ?? user.name ?? user.email ?? '',
      status: currentItem?.status ?? 'Em Aberto',
    });

    try {
      if (currentItem?.id) {
        await updateDoc(doc(firestore, 'inspections', currentItem.id), dataToSave);
        toast({ title: 'Vistoria atualizada!' });
      } else {
        await addDoc(collection(firestore, 'inspections'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Vistoria registrada!' });
      }
      if (!currentItem) form.reset();
      onSuccess();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível registrar a vistoria.',
      });
    } finally {
      setLoading(false);
    }
  }

  const findChecklistIndex = (sectionId: string, itemId: string) =>
    checklistResponses?.findIndex(
      (r) => r.sectionId === sectionId && r.itemId === itemId,
    ) ?? -1;

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Selecione o empreendedor e o empreendimento do Cadastro. A identificação será
              sugerida automaticamente (editável).
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="empreendedorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empreendedor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingEmpreendedores}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {empreendedores?.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
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
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empreendimento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedEmpreendedorId || isLoadingProjects}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.propertyName}
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
              name="inspectionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da vistoria</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'min-h-10 pl-3 text-left font-normal w-full sm:w-auto',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? format(field.value, 'PPP', { locale: ptBR })
                            : 'Escolha a data'}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Accordion
            type="multiple"
            defaultValue={['identificacao', 'check-documentacao']}
            className="w-full space-y-2"
          >
            <AccordionItem value="identificacao" className="border rounded-lg px-3 sm:px-4">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-3">
                1. Identificação do empreendimento
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-10 flex-1"
                    onClick={() => applyCadastro(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2 shrink-0" />
                    Preencher campos vazios do cadastro
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-10 flex-1"
                    onClick={() => applyCadastro(false)}
                  >
                    Atualizar tudo do cadastro
                  </Button>
                </div>
                {(
                  [
                    ['razaoSocial', 'Razão social'],
                    ['nomeFantasia', 'Nome fantasia'],
                    ['cnpjCpf', 'CNPJ / CPF'],
                    ['atividadePrincipal', 'Atividade principal'],
                    ['enderecoCompleto', 'Endereço completo'],
                  ] as const
                ).map(([name, label]) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={`identificacao.${name}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input className="min-h-10" {...field} value={field.value ?? ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
                <FormField
                  control={form.control}
                  name="identificacao.coordenadasGeograficas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coordenadas geográficas (Latitude / Longitude)</FormLabel>
                      <FormControl>
                        <Input
                          className="min-h-10"
                          placeholder="Ex.: -16.123456, -46.123456"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full min-h-10 mt-2"
                        disabled={capturingGps}
                        onClick={handleCaptureGps}
                      >
                        {capturingGps ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <MapPin className="h-4 w-4 mr-2" />
                        )}
                        Capturar coordenadas (GPS)
                      </Button>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="identificacao.processoLicenciamentoOutorga"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Processo de licenciamento / outorga vinculado</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-20 resize-y" {...field} value={field.value ?? ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <FormLabel>Motivo da fiscalização</FormLabel>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {FIELD_INSPECTION_MOTIVOS.map((motivo) => {
                      const checked =
                        form.watch('identificacao.motivoFiscalizacao')?.includes(motivo) ?? false;
                      return (
                        <label
                          key={motivo}
                          className="flex items-center gap-2 rounded-md border px-3 py-2.5 min-h-10 cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => toggleMotivo(motivo, v === true)}
                          />
                          <span className="text-sm">{motivo}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {FIELD_INSPECTION_CHECKLIST.map((section) => (
              <AccordionItem
                key={section.id}
                value={`check-${section.id}`}
                className="border rounded-lg px-3 sm:px-4"
              >
                <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline py-3 leading-snug">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {section.items.map((item) => {
                    const index = findChecklistIndex(section.id, item.id);
                    if (index < 0) return null;
                    return (
                      <InspectionChecklistItem
                        key={item.id}
                        index={index}
                        label={item.label}
                        maxImages={MAX_CHECKLIST_IMAGES}
                        limitLabel={limitLabel}
                        uploading={uploadingChecklistIndex === index}
                        onAttach={handleChecklistFiles}
                      />
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}

            <AccordionItem value="observacoes" className="border rounded-lg px-3 sm:px-4">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-3">
                10. Observações da equipe fiscalizadora
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <FormField
                  control={form.control}
                  name="teamObservations"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          className="min-h-32 resize-y"
                          placeholder="Estado geral do empreendimento, comportamento do responsável, justificativas no momento da fiscalização..."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="adicional" className="border rounded-lg px-3 sm:px-4">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-3">
                Registros adicionais (fora do checklist)
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <Button
                  type="button"
                  size="sm"
                  className="w-full sm:w-auto min-h-10"
                  onClick={() =>
                    append({ description: '', criticality: 'Média', imageUrls: [] })
                  }
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar registro
                </Button>
                {inconformidadeFields.map((field, index) => (
                  <div key={field.id} className="p-3 border rounded-lg space-y-3 relative">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <FormField
                      control={form.control}
                      name={`inconformidades.${index}.description`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea className="min-h-24 pr-10" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`inconformidades.${index}.criticality`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Criticidade</FormLabel>
                          <Select onValueChange={f.onChange} value={f.value}>
                            <FormControl>
                              <SelectTrigger className="min-h-10">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {['Baixa', 'Média', 'Alta', 'Urgente'].map((l) => (
                                <SelectItem key={l} value={l}>
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`inconformidades.${index}.imageUrls`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Fotos / anexos</FormLabel>
                          <InspectionAttachmentList
                            urls={f.value ?? []}
                            maxFiles={MAX_INCONF_IMAGES}
                            limitLabel={limitLabel}
                            uploading={uploadingIncIndex === index}
                            attachButtonLabel="Anexar"
                            onFilesSelected={(ev) =>
                              void handleInconformidadeFiles(
                                index,
                                ev,
                                f.onChange,
                                f.value ?? [],
                              )
                            }
                            onRemove={(uidx) => {
                              const cur = [...(f.value ?? [])];
                              cur.splice(uidx, 1);
                              f.onChange(cur);
                            }}
                          />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="docs" className="border rounded-lg px-3 sm:px-4">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-3">
                Outros documentos (opcional)
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <FormField
                  control={form.control}
                  name="laudoAttachmentUrls"
                  render={({ field }) => (
                    <FormItem>
                      <input
                        ref={laudoInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf"
                        onChange={(ev) => void handleLaudoFiles(ev)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full min-h-10"
                        disabled={
                          uploadingLaudo || (field.value?.length ?? 0) >= MAX_LAUDO_ATTACHMENTS
                        }
                        onClick={() => laudoInputRef.current?.click()}
                      >
                        {uploadingLaudo ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Paperclip className="h-4 w-4 mr-2" />
                        )}
                        Anexar documento
                      </Button>
                      {field.value?.map((url, idx) => (
                        <div
                          key={url}
                          className="flex items-center gap-2 mt-2 border rounded px-2 py-2 text-sm"
                        >
                          <Badge variant="secondary">{idx + 1}</Badge>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate underline">
                            Abrir
                          </a>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeLaudoUrl(idx)}>
                            Remover
                          </Button>
                        </div>
                      ))}
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="finalizacao" className="border rounded-lg px-3 sm:px-4">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-3">
                11. Finalização e assinaturas
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <p className="text-sm text-muted-foreground">
                  Fiscal / técnico: {user?.name || user?.email || '—'} (registrado automaticamente)
                </p>
                <FormField
                  control={form.control}
                  name="accompaniedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de quem acompanhou a vistoria</FormLabel>
                      <FormControl>
                        <Input className="min-h-10" placeholder="Responsável / acompanhante" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="signatureUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assinatura do acompanhante (opcional)</FormLabel>
                      <SignaturePad onSignatureEnd={(dataUrl) => field.onChange(dataUrl)} />
                      <FormDescription>
                        Peça para a pessoa que acompanhou assinar no quadro acima.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <CardFooter className="p-0 pt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {!currentItem && (
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="w-full sm:w-auto min-h-10"
                onClick={handleCancelNew}
              >
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading} className="w-full sm:max-w-xs sm:ml-auto min-h-11">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar registro de vistoria'
              )}
            </Button>
          </CardFooter>
        </form>
        <UploadPreparationDialog {...dialogProps} />
      </Form>
  );
}
