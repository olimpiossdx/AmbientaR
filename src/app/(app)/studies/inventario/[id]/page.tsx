'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirebase, errorEmitter } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, updateDoc, deleteField } from 'firebase/firestore';
import type { InventoryProject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Import,
  Copy,
  Camera,
  Pencil,
  Ban,
  Save,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { ImportDialog } from './import-dialog';
import { ProjectPhotosDialog } from './project-photos-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { IpeAmareloDefaultCover } from '@/components/studies/inventory/IpeAmareloDefaultCover';
import { uploadFileToStorage, deleteFileAtStoragePath, storagePathFromDownloadUrl, sanitizeStorageFileName } from '@/lib/storage-upload';

const formSchema = z.object({
  nome: z.string().min(1, "O nome do projeto é obrigatório."),
  descricao: z.string().optional(),
  data: z.date(),
  // Add other fields as they become editable
});

type FormValues = z.infer<typeof formSchema>;


const DetailItem = ({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('flex min-w-0 flex-col gap-1', className)}>
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="break-words text-base font-medium leading-snug">{value ?? 'Não informado'}</div>
  </div>
);

export default function InventarioProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [isImporting, setIsImporting] = React.useState(false);
  const [isDuplicateAlertOpen, setIsDuplicateAlertOpen] = React.useState(false);
  const [isDuplicating, setIsDuplicating] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isPhotosOpen, setIsPhotosOpen] = React.useState(false);
  const [coverUploading, setCoverUploading] = React.useState(false);
  const coverFileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { firestore, user, auth } = useFirebase();

  const projectDocRef = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'inventories', projectId);
  }, [firestore, projectId]);

  const { data: project, isLoading } = useDoc<InventoryProject>(projectDocRef);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      data: new Date(),
    },
  });

  React.useEffect(() => {
    if (project) {
      form.reset({
        nome: project.nome,
        descricao: project.descricao,
        data: new Date(project.data),
      });
    }
  }, [project, form]);


  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  const handleDuplicateProject = async () => {
    if (!project || !firestore || !user) {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível duplicar o projeto. Dados do projeto ou do usuário não encontrados.',
        });
        return;
    }
    setIsDuplicating(true);

    const { id, nome, coverImageUrl: _c, selectedPhotoIds: _s, photoOrder: _p, ...restOfProject } = project;
    
    const newProjectData = {
        ...restOfProject,
        nome: `Cópia de ${nome}`,
        data: new Date().toISOString(), // Set to current date
        ownerId: user.uid,
        createdAt: serverTimestamp(),
    };

    try {
        await addDoc(collection(firestore, 'inventories'), newProjectData);
        toast({
            title: 'Projeto Duplicado!',
            description: `O projeto "${newProjectData.nome}" foi criado com sucesso.`
        });
        setIsDuplicateAlertOpen(false);
    } catch (error) {
        console.error("Error duplicating project:", error);
         const permissionError = new FirestorePermissionError({
          path: 'inventories',
          operation: 'create',
          requestResourceData: newProjectData,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsDuplicating(false);
    }
  };

  const handleSaveChanges = async (values: FormValues) => {
    if (!projectDocRef) return;
    form.formState.isSubmitting;
    
    const dataToUpdate = {
        ...values,
        data: values.data.toISOString()
    }
    
    try {
        await updateDoc(projectDocRef, dataToUpdate);
        toast({ title: "Projeto Atualizado", description: "As alterações foram salvas com sucesso." });
        setIsEditing(false);
    } catch (error) {
         console.error("Error updating project:", error);
         const permissionError = new FirestorePermissionError({
            path: projectDocRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        // Here we keep editing mode, but disable loading state. You might want to set isEditing to false.
        // For now, let's just stop the loading indicator on the button. Let's assume you want to keep editing.
    }
  }
  
  const handleDiscardChanges = () => {
    if (project) {
        form.reset({
            nome: project.nome,
            descricao: project.descricao,
            data: new Date(project.data),
        });
    }
    setIsEditing(false);
  }

  const customCoverSrc = project?.coverImageUrl?.trim() ?? '';
  const hasCustomCover = Boolean(customCoverSrc);
  const [customCoverFailed, setCustomCoverFailed] = React.useState(false);

  React.useEffect(() => {
    setCustomCoverFailed(false);
  }, [customCoverSrc]);

  const showInlineDefault = !hasCustomCover || customCoverFailed;

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !projectDocRef || !projectId || !auth?.currentUser) return;
    setCoverUploading(true);
    try {
      const safe = sanitizeStorageFileName(file.name);
      const storagePath = `inventory-project-photos/${projectId}/cover-${Date.now()}-${safe}`;
      const url = await uploadFileToStorage(file, storagePath);
      await updateDoc(projectDocRef, {
        coverImageUrl: url,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Imagem atualizada', description: 'A capa do projeto foi guardada.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar imagem',
        description: (err as Error).message,
      });
    } finally {
      setCoverUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    if (!projectDocRef || !project) return;
    if (!hasCustomCover) {
      toast({ title: 'Capa', description: 'Já está a usar o modelo padrão (ipê-amarelo).' });
      return;
    }
    const url = project.coverImageUrl!;
    const path = storagePathFromDownloadUrl(url);
    if (path) {
      try {
        await deleteFileAtStoragePath(path);
      } catch {
        /* ficheiro pode já não existir */
      }
    }
    try {
      await updateDoc(projectDocRef, {
        coverImageUrl: deleteField(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Capa reposta', description: 'Voltou ao modelo padrão (ipê-amarelo).' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover a capa.' });
    }
  };

  return (
    <>
      {isLoading ? (
        <main className="flex-1 p-6">
          <Skeleton className="mb-4 h-10 w-1/4" />
          <Skeleton className="h-96 w-full" />
        </main>
      ) : !project ? (
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold">Projeto não encontrado</h1>
          <p>O projeto que você está procurando não existe ou foi movido.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Voltar
          </Button>
        </main>
      ) : (
        <>
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b bg-background px-4 md:px-6 py-2">
          <h1 className="text-lg font-semibold md:text-xl">{project.nome}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsImporting(true)}><Import className="mr-2 h-4 w-4"/>Importar Planilha</Button>
             <AlertDialog open={isDuplicateAlertOpen} onOpenChange={setIsDuplicateAlertOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm"><Copy className="mr-2 h-4 w-4"/>Duplicar Projeto</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Duplicar Projeto</AlertDialogTitle>
                     <AlertDialogDescription asChild>
                      <div>
                        <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 flex items-start gap-4">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-300">
                                <div className="font-bold">Atenção!</div>
                                <div className="mt-1">Ao duplicar este projeto, um novo será criado com os mesmos recursos, exceto pelas fotos da árvore e o histórico de cálculos existentes.</div>
                                <div className="mt-2">Apenas o proprietário atual do projeto poderá executar esta ação, e somente ele poderá acessar o novo projeto inicialmente. Podendo compartilhar com outros usuários após sua criação.</div>
                            </div>
                        </div>
                      </div>
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDuplicating}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDuplicateProject} disabled={isDuplicating}>
                        {isDuplicating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Duplicar
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" size="sm" onClick={() => setIsPhotosOpen(true)}>
              <Camera className="mr-2 h-4 w-4"/>Fotos do Projeto
            </Button>
            <Separator orientation="vertical" className="h-6" />
            
            {isEditing ? (
                 <>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDiscardChanges}><Ban className="mr-2 h-4 w-4"/>Descartar Alterações</Button>
                    <Button size="sm" onClick={form.handleSubmit(handleSaveChanges)} disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4"/>Salvar Alterações
                    </Button>
                 </>
            ) : (
                 <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Pencil className="mr-2 h-4 w-4"/>Habilitar Edição</Button>
            )}
          </div>
        </header>
        
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Card className="mx-auto max-w-6xl overflow-hidden rounded-2xl border shadow-sm">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50/50 via-background to-background px-5 py-5 md:px-8 dark:from-emerald-950/20">
              <CardTitle className="text-lg font-semibold tracking-tight md:text-xl">Informações do Projeto</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Modelo padrão: ipê-amarelo. Com <strong className="font-medium text-foreground">Habilitar edição</strong> pode substituir a imagem de capa.
              </p>
            </CardHeader>
            <CardContent className="p-0">
             <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveChanges)}>
                <div className="flex flex-col lg:flex-row lg:items-stretch">
                  <div className="relative flex flex-col items-center border-b bg-muted/15 px-6 py-8 lg:w-[min(100%,340px)] lg:shrink-0 lg:border-b-0 lg:border-r lg:px-8">
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => void handleCoverFileChange(e)}
                      aria-label="Escolher imagem de capa do projeto"
                      disabled={!isEditing || coverUploading}
                    />
                    <div className="relative aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-2xl shadow-md ring-1 ring-border/60 bg-muted/20">
                      {showInlineDefault ? (
                        <IpeAmareloDefaultCover className="block h-full w-full" />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element -- URL Firebase Storage */
                        <img
                          src={customCoverSrc}
                          alt="Capa do projeto"
                          className="absolute inset-0 h-full w-full object-cover object-center"
                          onError={() => setCustomCoverFailed(true)}
                        />
                      )}
                      {coverUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 max-w-[280px] text-center text-xs text-muted-foreground">
                      {hasCustomCover ? 'Foto personalizada' : 'Ilustração modelo — ipê-amarelo'}
                    </p>
                    {isEditing && (
                      <div className="mt-5 flex w-full max-w-[280px] flex-col gap-2 sm:flex-row sm:justify-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={coverUploading}
                          onClick={() => coverFileInputRef.current?.click()}
                        >
                          {coverUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Mudar imagem
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="flex-1 text-destructive hover:text-destructive"
                          disabled={coverUploading}
                          onClick={() => void handleRemoveCover()}
                        >
                          Repor padrão
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-6 p-5 sm:p-6 md:p-8">
                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
                    {isEditing ? (
                        <>
                            <FormField control={form.control} name="nome" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <div className="space-y-2">
                              <Label>Tipo</Label>
                              <p className="text-base leading-snug pt-1">{project.tipoProjeto.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Nome da Empresa</Label>
                              <Input placeholder="Não informado" readOnly className="bg-muted/50" />
                            </div>
                             <FormField control={form.control} name="data" render={({ field }) => (<FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" value={format(field.value, 'yyyy-MM-dd')} onChange={(e) => field.onChange(new Date(e.target.value))}/></FormControl><FormMessage /></FormItem>)} />
                            <div className="space-y-2">
                              <Label>Área do Projeto (ha)</Label>
                              <Input type="number" placeholder="Não informado" readOnly className="bg-muted/50" />
                            </div>
                            <FormField control={form.control} name="descricao" render={({ field }) => (<FormItem className="sm:col-span-2 xl:col-span-3"><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </>
                    ) : (
                        <>
                          <DetailItem label="Nome" value={project.nome} />
                          <DetailItem label="Tipo" value={project.tipoProjeto.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                          <DetailItem label="Nome da Empresa" value="Não informado" />
                          <DetailItem label="Data" value={formatDate(project.data)} />
                           <DetailItem label="Área do Projeto (ha)" value="Não informado" />
                          <DetailItem label="Descrição" value={project.descricao} className="sm:col-span-2 xl:col-span-3" />
                        </>
                    )}
                    <DetailItem label="Casas Decimais" value={5} />
                    <DetailItem label="Identificação dos Fustes da Árvore" value="Número da Árvore Igual" />
                    <DetailItem label="Forma da Parcela" value="Retangular" />
                     {isEditing ? (
                        <div className="space-y-2 sm:col-span-2 xl:col-span-3">
                          <Label>Observações</Label>
                          <Textarea placeholder="Não informado" readOnly className="bg-muted/50 min-h-[80px]" />
                        </div>
                    ) : (
                         <DetailItem label="Observações" value={project.descricao || 'Não informado'} className="sm:col-span-2 xl:col-span-3" />
                    )}
                    </div>
                  </div>
                </div>
              </form>
             </Form>
            </CardContent>
          </Card>
        </main>
        </>
      )}
      <ImportDialog isOpen={isImporting} onOpenChange={setIsImporting} projectId={projectId} />
      <ProjectPhotosDialog
        open={isPhotosOpen && !!project}
        onOpenChange={setIsPhotosOpen}
        projectId={projectId}
        initialSelectedPhotoIds={project?.selectedPhotoIds}
        initialPhotoOrder={project?.photoOrder}
        onSaveSelection={async ({ selectedPhotoIds, photoOrder }) => {
          if (!projectDocRef) return;
          await updateDoc(projectDocRef, {
            selectedPhotoIds,
            photoOrder,
            updatedAt: serverTimestamp(),
          });
        }}
      />
    </>
  );
}
