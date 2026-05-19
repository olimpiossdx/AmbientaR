
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
import { Loader2, CalendarIcon, PlusCircle, Trash2, Paperclip, Image as ImageIcon, FileText } from 'lucide-react';
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
import type { Empreendedor, Project, Inspection } from '@/lib/types';
import { cn } from '@/lib/utils';
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

const MAX_FILE_SIZE = UPLOAD_RAW_FILE_SAFETY_MAX;
const MAX_LAUDO_ATTACHMENTS = 24;
const MAX_INCONF_IMAGES = 12;

const ALLOWED_INSPECTION_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || 'anexo';
}

/** Firestore pode devolver string ou DocumentReference; o Select precisa de string. */
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

const inconformidadeSchema = z.object({
  description: z.string().min(10, 'A descrição da inconformidade é obrigatória.'),
  criticality: z.enum(['Baixa', 'Média', 'Alta', 'Urgente']),
  imageUrls: z.array(z.string()).optional(),
});

const inspectionSchema = z.object({
  empreendedorId: z.string().min(1, 'Selecione um empreendedor.'),
  projectId: z.string().min(1, 'Selecione um empreendimento.'),
  inspectionDate: z.date({ required_error: 'A data da vistoria é obrigatória.' }),
  inconformidades: z.array(inconformidadeSchema).min(1, "Adicione pelo menos uma inconformidade ou observação."),
  /** Documentos extra ao laudo (opcional), além dos anexos por inconformidade. */
  laudoAttachmentUrls: z.array(z.string()).optional(),
  accompaniedBy: z.string().optional(),
  signatureUrl: z.string().optional(),
});

type InspectionFormValues = z.infer<typeof inspectionSchema>;

interface InspectionFormProps {
    onSuccess: () => void;
    currentItem?: Inspection | null;
}

export function InspectionForm({ onSuccess, currentItem }: InspectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [uploadingLaudo, setUploadingLaudo] = React.useState(false);
  const [uploadingIncIndex, setUploadingIncIndex] = React.useState<number | null>(null);
  const laudoInputRef = React.useRef<HTMLInputElement>(null);
  const incInputRefs = React.useRef<Record<number, HTMLInputElement | null>>({});

  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const { prepareFile, dialogProps } = usePreparedUpload({
    storagePathPrefix: 'inspections/',
  });
  const limitLabel = formatUploadLimitMb({ storagePathPrefix: 'inspections/' });

  const uploadToStorage = React.useCallback(
    async (file: File, pathPrefix: string) => {
      if (!user?.uid) throw new Error('Utilizador não autenticado.');
      if (file.size > UPLOAD_RAW_FILE_SAFETY_MAX) {
        throw new Error('Ficheiro excede o limite de processamento no navegador.');
      }
      const prepared = await prepareFile(file);
      if (!prepared) throw new Error('Upload cancelado.');
      const mime = file.type || '';
      const isPdfName = file.name.toLowerCase().endsWith('.pdf');
      const ok =
        ALLOWED_INSPECTION_MIME.has(mime) ||
        (isPdfName &&
          (mime === 'application/pdf' ||
            mime === 'application/octet-stream' ||
            mime === ''));
      if (!ok) {
        throw new Error('Tipo não permitido. Use imagem (JPEG, PNG, WebP, GIF) ou PDF.');
      }
      const storage = getStorage();
      const safe = sanitizeFileName(file.name);
      const storageRef = ref(
        storage,
        `inspections/${pathPrefix}/${user.uid}/${Date.now()}-${safe}`,
      );
      const contentType =
        mime === 'image/jpeg' ||
        mime === 'image/png' ||
        mime === 'image/webp' ||
        mime === 'image/gif'
          ? mime
          : 'application/pdf';
      const snap = await uploadBytes(storageRef, prepared, { contentType });
      return getDownloadURL(snap.ref);
    },
    [user?.uid, prepareFile],
  );

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: allProjects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      empreendedorId: '',
      projectId: '',
      inspectionDate: new Date(),
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

  /** Re-hidratar quando o id OU os ids de empresa mudarem (ex.: 2.º snapshot do Firestore) ou quando a lista de projetos ficar disponível (derivar empreendedor). */
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
      empreendedorId: empreendedorId,
      projectId,
      inspectionDate: c.inspectionDate ? new Date(c.inspectionDate) : new Date(),
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
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'inconformidades'
  });

  const selectedEmpreendedorId = form.watch('empreendedorId');

  const filteredProjects = React.useMemo(() => {
    if (!allProjects || !selectedEmpreendedorId) return [];
    return allProjects.filter(
      (p) => normalizeFirestoreId(p.empreendedorId) === selectedEmpreendedorId,
    );
  }, [allProjects, selectedEmpreendedorId]);
  
  /** Só limpa o empreendimento se deixar de pertencer ao empreendedor (evita apagar após hidratar o formulário). */
  React.useEffect(() => {
    if (!selectedEmpreendedorId || !allProjects?.length) return;
    const pid = form.getValues('projectId');
    if (!pid) return;
    const proj = allProjects.find((p) => p.id === pid);
    if (proj && normalizeFirestoreId(proj.empreendedorId) !== selectedEmpreendedorId) {
      form.resetField('projectId');
    }
  }, [selectedEmpreendedorId, allProjects, form]);

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
          description: `No máximo ${MAX_LAUDO_ATTACHMENTS} ficheiros ao laudo.`,
        });
        return;
      }
      setUploadingLaudo(true);
      try {
        const prefix = currentItem?.id ? `laudo/${currentItem.id}` : 'laudo/rascunho';
        const next = [...current];
        for (const file of Array.from(files)) {
          const url = await uploadToStorage(file, prefix);
          next.push(url);
        }
        form.setValue('laudoAttachmentUrls', next, { shouldValidate: true });
        toast({
          title: 'Documentos adicionais enviados',
          description: `${files.length} ficheiro(s) guardados no Storage.`,
        });
      } catch (err) {
        console.error(err);
        toast({
          variant: 'destructive',
          title: 'Erro no envio',
          description: err instanceof Error ? err.message : 'Não foi possível enviar os ficheiros.',
        });
      } finally {
        setUploadingLaudo(false);
      }
    },
    [currentItem?.id, form, toast, uploadToStorage],
  );

  const handleInconformidadeFiles = React.useCallback(
    async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      e.target.value = '';
      if (!files?.length) return;
      const current = form.getValues(`inconformidades.${index}.imageUrls`) ?? [];
      if (current.length + files.length > MAX_INCONF_IMAGES) {
        toast({
          variant: 'destructive',
          title: 'Limite de anexos',
          description: `No máximo ${MAX_INCONF_IMAGES} ficheiros por inconformidade.`,
        });
        return;
      }
      setUploadingIncIndex(index);
      try {
        const prefix = currentItem?.id
          ? `inconformidades/${currentItem.id}/${index}`
          : `inconformidades/rascunho/${index}`;
        const next = [...current];
        for (const file of Array.from(files)) {
          const url = await uploadToStorage(file, prefix);
          next.push(url);
        }
        form.setValue(`inconformidades.${index}.imageUrls`, next, { shouldValidate: true });
        toast({ title: 'Anexos enviados', description: 'Ficheiros associados a esta inconformidade.' });
      } catch (err) {
        console.error(err);
        toast({
          variant: 'destructive',
          title: 'Erro no envio',
          description: err instanceof Error ? err.message : 'Falha no upload.',
        });
      } finally {
        setUploadingIncIndex(null);
      }
    },
    [currentItem?.id, form, toast, uploadToStorage],
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

  const handleCancelNew = React.useCallback(() => {
    if (uploadingLaudo || uploadingIncIndex !== null) {
      toast({
        variant: 'destructive',
        title: 'Aguarde',
        description: 'Há um envio de ficheiros em curso. Espere que termine ou tente novamente.',
      });
      return;
    }
    const dirty = form.formState.isDirty;
    if (
      dirty &&
      !window.confirm(
        'Cancelar este lançamento? Os dados ainda não guardados serão descartados.',
      )
    ) {
      return;
    }
    router.push('/inspections');
  }, [form, router, toast, uploadingIncIndex, uploadingLaudo]);

  async function onSubmit(values: InspectionFormValues) {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Erro de Autenticação' });
      return;
    }
    setLoading(true);

    const dataToSave = {
      ...values,
      inspectionDate: values.inspectionDate.toISOString(),
      inspectorId: currentItem?.inspectorId ?? user.uid,
      inspectorName: currentItem?.inspectorName ?? user.name ?? user.email,
      ...(currentItem ? {} : { createdAt: serverTimestamp() }),
      status: currentItem?.status ?? 'Em Aberto',
    };

    try {
      if (currentItem?.id) {
        await updateDoc(doc(firestore, 'inspections', currentItem.id), dataToSave);
        toast({
          title: 'Vistoria Atualizada!',
          description: 'O registro da vistoria foi salvo com sucesso.',
        });
      } else {
        await addDoc(collection(firestore, 'inspections'), { ...dataToSave, createdAt: serverTimestamp() });
        toast({
          title: 'Vistoria Registrada!',
          description: 'O registro da vistoria foi salvo com sucesso.',
        });
      }
      if (!currentItem) form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving inspection:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível registrar a vistoria.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="empreendedorId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Empreendedor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingEmpreendedores}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={isLoadingEmpreendedores ? 'Carregando...' : 'Selecione o empreendedor'} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {empreendedores?.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
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
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedEmpreendedorId || isLoadingProjects}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={!selectedEmpreendedorId ? 'Selecione um empreendedor primeiro' : 'Selecione o empreendimento'} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {filteredProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.propertyName}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="inspectionDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Data da Vistoria</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />

            <div className="space-y-4 rounded-md border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                    <div>
                        <h3 className="text-lg font-medium">Inconformidades</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                            As fotos e evidências do laudo acompanham cada inconformidade: ao adicionar um item, use o campo de anexos desse bloco para imagens ou PDF relacionados ao ponto descrito.
                        </p>
                    </div>
                    <Button type="button" size="sm" className="shrink-0" onClick={() => append({ description: '', criticality: 'Baixa', imageUrls: [] })}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Inconformidade
                    </Button>
                </div>
                {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma inconformidade adicionada.</p>
                )}
                <div className="space-y-4">
                    {fields.map((field, index) => {
                        return (
                            <div key={field.id} className="p-4 border rounded-md relative space-y-4">
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <FormField
                                    control={form.control}
                                    name={`inconformidades.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição da Inconformidade</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Descreva a não conformidade, ponto de atenção ou observação geral." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`inconformidades.${index}.imageUrls`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <ImageIcon className="h-4 w-4" />
                                                Fotos e anexos desta inconformidade
                                            </FormLabel>
                                            <FormDescription>
                                                Evidências do laudo para este ponto — JPEG, PNG, WebP, GIF ou PDF; até {MAX_INCONF_IMAGES} ficheiros. Limite após otimização: {limitLabel} cada.
                                            </FormDescription>
                                            <input
                                                ref={(el) => {
                                                    incInputRefs.current[index] = el;
                                                }}
                                                type="file"
                                                multiple
                                                className="hidden"
                                                aria-label={`Anexar ficheiros à inconformidade ${index + 1}`}
                                                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf"
                                                onChange={(ev) => void handleInconformidadeFiles(index, ev)}
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={uploadingIncIndex === index || (field.value?.length ?? 0) >= MAX_INCONF_IMAGES}
                                                    onClick={() => incInputRefs.current[index]?.click()}
                                                >
                                                    {uploadingIncIndex === index ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Paperclip className="h-4 w-4 mr-2" />
                                                    )}
                                                    Anexar
                                                </Button>
                                            </div>
                                            {field.value && field.value.length > 0 && (
                                                <ul className="flex flex-col gap-2 mt-2">
                                                    {field.value.map((url, uidx) => (
                                                        <li
                                                            key={`${url}-${uidx}`}
                                                            className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
                                                        >
                                                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                            <a
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="truncate text-primary underline min-w-0"
                                                            >
                                                                Anexo {uidx + 1}
                                                            </a>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="shrink-0 ml-auto h-8"
                                                                onClick={() => removeIncUrl(index, uidx)}
                                                            >
                                                                Remover
                                                            </Button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`inconformidades.${index}.criticality`}
                                    render={({ field }) => (
                                        <FormItem className="max-w-md">
                                            <FormLabel>Criticidade</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o nível" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {['Baixa', 'Média', 'Alta', 'Urgente'].map((level) => (
                                                        <SelectItem key={level} value={level}>
                                                            {level}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )
                    })}
                </div>
                 <FormMessage>{form.formState.errors.inconformidades?.message}</FormMessage>
            </div>

            <div className="space-y-4 rounded-md border p-4 border-dashed bg-muted/30">
                <div>
                    <h3 className="text-lg font-medium">Outros documentos (opcional)</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                        Campo independente para juntar qualquer outro ficheiro que considere pertinente ao registo (por exemplo mapa, ofício ou PDF geral), além dos anexos ligados a cada inconformidade acima.
                    </p>
                </div>
                <FormField
                    control={form.control}
                    name="laudoAttachmentUrls"
                    render={({ field }) => (
                        <FormItem>
                            <FormDescription>
                                Até {MAX_LAUDO_ATTACHMENTS} ficheiros ({limitLabel} cada após otimização) — imagens ou PDF. Armazenados no Firebase Storage.
                            </FormDescription>
                            <input
                                ref={laudoInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                aria-label="Anexar outros documentos pertinentes ao registo da vistoria"
                                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf"
                                onChange={(ev) => void handleLaudoFiles(ev)}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingLaudo || (field.value?.length ?? 0) >= MAX_LAUDO_ATTACHMENTS}
                                onClick={() => laudoInputRef.current?.click()}
                            >
                                {uploadingLaudo ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Paperclip className="h-4 w-4 mr-2" />
                                )}
                                Anexar documento extra
                            </Button>
                            {field.value && field.value.length > 0 && (
                                <ul className="mt-3 flex flex-col gap-2">
                                    {field.value.map((url, idx) => (
                                        <li
                                            key={`${url}-${idx}`}
                                            className="flex items-center gap-2 flex-wrap rounded-md border px-3 py-2 text-sm"
                                        >
                                            <Badge variant="secondary" className="font-normal">
                                                {idx + 1}
                                            </Badge>
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary underline truncate min-w-0 flex-1"
                                            >
                                                Abrir anexo
                                            </a>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeLaudoUrl(idx)}>
                                                Remover
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
             <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">Finalização</h3>
                 <FormField
                    control={form.control}
                    name="accompaniedBy"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome de quem acompanhou a vistoria</FormLabel>
                        <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="signatureUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assinatura Digital (Opcional)</FormLabel>
                            <FormControl>
                                <SignaturePad onSignatureEnd={(dataUrl) => field.onChange(dataUrl)} />
                            </FormControl>
                            <FormDescription>
                                Peça para a pessoa que acompanhou assinar no quadro acima.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <CardFooter className="p-0 pt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                {!currentItem && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    className="w-full sm:w-auto shrink-0"
                    onClick={handleCancelNew}
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading || uploadingLaudo || uploadingIncIndex !== null}
                  className={cn('w-full', !currentItem && 'sm:max-w-md sm:ml-auto')}
                >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 
                'Salvar Registro de Vistoria'}
                </Button>
            </CardFooter>
        </form>
        <UploadPreparationDialog {...dialogProps} />
    </Form>
  );
}
