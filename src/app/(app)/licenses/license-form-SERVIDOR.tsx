
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { BrDateFormControl } from '@/components/form/br-date-input';

import { useToast } from '@/hooks/use-toast';
import type { License, PermitType, PermitStatus, Empreendedor, Project } from '@/lib/types';
import { filterProjectsByEmpreendedorId } from '@/lib/processos-form-order';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import {
  uploadFileToStorage,
  sanitizeStorageFileName,
} from '@/lib/storage-upload';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { UPLOAD_RAW_FILE_SAFETY_MAX } from '@/lib/upload-limits';

const MAX_FILE_SIZE = UPLOAD_RAW_FILE_SAFETY_MAX;

const formSchema = z.object({
  empreendedorId: z.string().min(1, 'Selecione um empreendedor.'),
  projectId: z.string().min(1, 'Selecione um empreendimento.'),
  permitType: z.enum(['LP', 'LI', 'LO', 'LAS', 'AAF', 'Outra'], { required_error: 'Selecione o tipo de licença.' }),
  processNumber: z.string().min(1, 'O número do processo é obrigatório.'),
  permitNumber: z.string().min(1, 'O número da licença é obrigatório.'),
  issuingBody: z.string().min(1, 'O órgão emissor é obrigatório.'),
  issueDate: z.date({ required_error: 'A data de emissão é obrigatória.' }),
  expirationDate: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  status: z.enum(['Válida', 'Vencida', 'Em Renovação', 'Suspensa', 'Cancelada', 'Em Andamento'], { required_error: 'Selecione o status.'}),
  description: z.string().optional(),
  file: z.any()
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE,
      `O tamanho máximo do arquivo é ${MAX_FILE_SIZE / 1024 / 1024}MB.`
    ),
}).refine(data => data.expirationDate > data.issueDate, {
  message: 'A data de vencimento deve ser posterior à data de emissão.',
  path: ['expirationDate'],
});


type LicenseFormValues = z.infer<typeof formSchema>;

interface LicenseFormProps {
  currentLicense?: License | null;
  onSuccess?: () => void;
}

const permitTypes: { value: PermitType, label: string }[] = [
    { value: 'LP', label: 'LP - Licença Prévia' },
    { value: 'LI', label: 'LI - Licença de Instalação' },
    { value: 'LO', label: 'LO - Licença de Operação' },
    { value: 'LAS', label: 'LAS - Licença Ambiental Simplificada' },
    { value: 'AAF', label: 'AAF - Autorização Ambiental de Funcionamento' },
    { value: 'Outra', label: 'Outra' },
];

const permitStatuses: { value: PermitStatus, label: string }[] = [
    { value: 'Válida', label: 'Válida' },
    { value: 'Vencida', label: 'Vencida' },
    { value: 'Em Renovação', label: 'Em Renovação' },
    { value: 'Suspensa', label: 'Suspensa' },
    { value: 'Cancelada', label: 'Cancelada' },
    { value: 'Em Andamento', label: 'Em Andamento' },
];

export function LicenseForm({ currentLicense, onSuccess }: LicenseFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(currentLicense?.fileUrl || null);
  
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  
  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: allProjects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });
  
  React.useEffect(() => {
    const defaultValues = {
      empreendedorId: currentLicense?.empreendedorId || '',
      projectId: currentLicense?.projectId || '',
      permitType: currentLicense?.permitType,
      processNumber: currentLicense?.processNumber || '',
      permitNumber: currentLicense?.permitNumber || '',
      issuingBody: currentLicense?.issuingBody || '',
      issueDate: currentLicense?.issueDate ? new Date(currentLicense.issueDate) : undefined,
      expirationDate: currentLicense?.expirationDate ? new Date(currentLicense.expirationDate) : undefined,
      status: currentLicense?.status,
      description: currentLicense?.description || '',
    };
    // @ts-ignore
    form.reset(defaultValues);
    setUploadedFileUrl(currentLicense?.fileUrl || null);
  }, [currentLicense, form]);

  const selectedEmpreendedorId = form.watch('empreendedorId');

  const filteredProjects = React.useMemo(
    () => filterProjectsByEmpreendedorId(allProjects, selectedEmpreendedorId),
    [selectedEmpreendedorId, allProjects],
  );

  React.useEffect(() => {
    if(form.getValues('empreendedorId') !== selectedEmpreendedorId) {
      form.setValue('projectId', '');
    }
  }, [selectedEmpreendedorId, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: `O arquivo não pode exceder ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      });
      return;
    }

    inputEl.value = '';

    setIsUploading(true);
    setUploadedFileUrl(null);
    try {
      const safe = sanitizeStorageFileName(file.name);
      const downloadUrl = await uploadFileToStorage(
        file,
        `licenses/${Date.now()}-${safe}`,
      );
      setUploadedFileUrl(downloadUrl);
      toast({
        title: 'Anexo carregado',
        description: 'O arquivo está pronto para ser salvo.',
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível enviar o arquivo.',
      });
    } finally {
      setIsUploading(false);
    }
  };


  async function onSubmit(values: LicenseFormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave: Record<string, unknown> = {
      empreendedorId: values.empreendedorId,
      projectId: values.projectId,
      permitType: values.permitType,
      processNumber: values.processNumber,
      permitNumber: values.permitNumber,
      issuingBody: values.issuingBody,
      issueDate: values.issueDate.toISOString(),
      expirationDate: values.expirationDate.toISOString(),
      status: values.status,
      fileUrl: uploadedFileUrl || currentLicense?.fileUrl || '',
    };
    if (values.description !== undefined && values.description !== '') {
      dataToSave.description = values.description;
    }


    if (currentLicense) {
      const licenseRef = doc(firestore, 'licenses', currentLicense.id);
      updateDoc(licenseRef, dataToSave)
        .then(() => {
          toast({
            title: 'Licença atualizada!',
            description: 'As informações da licença foram salvas com sucesso.',
          });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: licenseRef.path,
            operation: 'update',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      const licensesCollectionRef = collection(firestore, 'licenses');
      addDoc(licensesCollectionRef, dataToSave)
        .then(() => {
          toast({
            title: 'Licença criada!',
            description: `A licença ${values.permitNumber} foi adicionada com sucesso.`,
          });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: licensesCollectionRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{currentLicense ? 'Editar Licença' : 'Adicionar Nova Licença'}</DialogTitle>
        <DialogDescription>
          {currentLicense ? 'Atualize os detalhes da licença abaixo.' : 'Preencha os detalhes para criar uma nova licença.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 -ml-1 space-y-4">
          <FormField
            control={form.control}
            name="empreendedorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empreendedor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingEmpreendedores ? "Carregando..." : "Selecione um empreendedor"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {empreendedores?.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
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
                <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedEmpreendedorId || isLoadingProjects}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedEmpreendedorId ? 'Selecione um empreendedor primeiro' : "Selecione o empreendimento"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredProjects?.map(proj => (
                      <SelectItem key={proj.id} value={proj.id}>{proj.propertyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="permitType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Licença</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo (LP, LI, LO...)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {permitTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="processNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do Processo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 12345/2022" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="permitNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº da Licença</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 123/2024" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="issuingBody"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Órgão Emissor</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: SEMAD, SUPRAM Sul de Minas" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Emissão</FormLabel>
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
                name="expirationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento</FormLabel>
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
          </div>
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status atual" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {permitStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição / Objeto da Licença</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descreva o objeto da licença e outras informações relevantes." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Anexar Documento da Licença</FormLabel>
                    <FormControl>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            type="file" 
                                            accept="application/pdf,image/jpeg,image/png"
                                            onChange={handleFileChange}
                                            disabled={isUploading}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                    <p>Upload em PDF ou JPG (e PNG). Tamanho máximo 10MB.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </FormControl>
                    <FormDescription>
                        Anexe a licença ou documento relacionado (PDF, JPG, PNG). Máx 10MB.
                        {currentLicense?.fileUrl && !uploadedFileUrl && (
                            <span className="block mt-2 text-xs">
                                Arquivo atual: <a href={currentLicense.fileUrl} target="_blank" className="underline" rel="noreferrer">ver anexo</a>
                            </span>
                        )}
                        {uploadedFileUrl && (
                            <span className="block mt-2 text-xs text-green-600">
                                Novo arquivo carregado: <a href={uploadedFileUrl} target="_blank" className="underline" rel="noreferrer">ver anexo</a>
                            </span>
                        )}
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
          />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
            <Button type="submit" disabled={loading || isUploading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 
              isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</> :
              'Salvar Licença'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
