
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2, List } from 'lucide-react';
import { BrDateFormControl } from '@/components/form/br-date-input';
import { useToast } from '@/hooks/use-toast';
import type { CommercialProposal, Client, CommercialProposalItem, Service } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';

import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { logUserAction } from '@/lib/audit-log';
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from '@/lib/notification-events';
import { notifyClientDocPortalUsers } from '@/lib/notifications';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AttachmentPreviewSection } from '@/components/shared/attachment-preview-section';
import { useOfflineOptional } from '@/lib/offline';
import { isImageOrPdfForTransaction } from '@/lib/file-mime';
import { UploadPreparationDialog } from '@/components/shared/upload-preparation-dialog';
import { useStorageFileUpload } from '@/hooks/use-storage-file-upload';

const formSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente.'),
  empreendimento: z.string().optional(),
  proposalNumber: z.string().min(1, 'O número da proposta é obrigatório.'),
  items: z.array(z.object({
    description: z.string().min(1, 'A descrição do serviço é obrigatória.'),
    value: z.coerce.number().min(0, 'O valor não pode ser negativo.')})).min(1, 'Adicione pelo menos um item de serviço.'),
  paymentTerms: z.string().optional(),
  amount: z.number(),
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected']),
  proposalDate: z.date({ required_error: 'A data de emissão é obrigatória.' }),
  validUntilDate: z.date({ required_error: 'A data de validade é obrigatória.' })}).refine(data => data.validUntilDate >= data.proposalDate, {
    message: 'A data de validade não pode ser anterior à data de emissão.',
    path: ['validUntilDate']});


type FormValues = z.infer<typeof formSchema>;

interface ProposalFormProps {
  currentItem?: CommercialProposal | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const proposalStatuses: { value: CommercialProposal['status'], label: string }[] = [
  { value: 'Draft', label: 'Rascunho' },
  { value: 'Sent', label: 'Enviado' },
  { value: 'Accepted', label: 'Aceito' },
  { value: 'Rejected', label: 'Rejeitado' },
];

const formatCurrencyBRL = (value: number) => {
    if (isNaN(value)) value = 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'}).format(value);
};

const CurrencyInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & { onChange: (value: number) => void; value: number }>(
    ({ value, onChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState(formatCurrencyBRL(value || 0));

        React.useEffect(() => {
            setDisplayValue(formatCurrencyBRL(value || 0));
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/\D/g, '');
            const numericValue = Number(rawValue) / 100;
            onChange(numericValue);
            setDisplayValue(formatCurrencyBRL(numericValue));
        };
        
        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/\D/g, '');
            const numericValue = Number(rawValue) / 100;
            setDisplayValue(formatCurrencyBRL(numericValue));
        };

        return <Input ref={ref} value={displayValue} onChange={handleChange} onBlur={handleBlur} {...props} />;
    }
);
CurrencyInput.displayName = "CurrencyInput";


export function ProposalForm({ currentItem, onSuccess, onCancel }: ProposalFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [fileUrl, setFileUrl] = React.useState<string | null>(currentItem?.fileUrl || null);
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);

  const { toast } = useToast();
  const { firestore, auth, user } = useFirebase();
  const offline = useOfflineOptional();
  const { uploadFile, dialogProps, limitLabel } = useStorageFileUpload({
    storageFolder: 'commercial-proposals',
    buildStoragePath: (_file, safe) => {
      const uid = auth?.currentUser?.uid;
      if (!uid) throw new Error('Sessão inválida. Faça login novamente.');
      return `commercial-proposals/${uid}/${Date.now()}-${safe}`;
    }});

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'clients') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  
  const servicesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: services, isLoading: isLoadingServices } = useCollection<Service>(servicesQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem ? {
      ...currentItem,
      proposalDate: new Date(currentItem.proposalDate),
      validUntilDate: new Date(currentItem.validUntilDate),
      items: currentItem.items?.length ? currentItem.items : []} : {
      clientId: '',
      empreendimento: '',
      proposalNumber: '',
      items: [],
      paymentTerms: '50% de entrada e 50% na entrega do relatório final.',
      amount: 0,
      status: 'Draft',
      proposalDate: new Date(),
      validUntilDate: new Date(new Date().setDate(new Date().getDate() + 30))}});

  React.useEffect(() => {
    if (currentItem) {
      form.reset({
        ...currentItem,
        proposalDate: new Date(currentItem.proposalDate),
        validUntilDate: new Date(currentItem.validUntilDate),
        items: currentItem.items?.length ? currentItem.items : []});
      setFileUrl(currentItem.fileUrl || null);
    }
  }, [currentItem, form]);

  const handleProposalFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;

    if (!isImageOrPdfForTransaction(file)) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Envie apenas PDF, JPG ou PNG.'});
      inputEl.value = '';
      return;
    }

    inputEl.value = '';
    setIsUploadingFile(true);
    setFileUrl(null);
    try {
      const downloadUrl = await uploadFile(file);
      if (!downloadUrl) return;
      setFileUrl(downloadUrl);
      toast({
        title: 'Anexo carregado',
        description: 'O arquivo está pronto para ser salvo com a proposta.'});
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível enviar o arquivo.'});
    } finally {
      setIsUploadingFile(false);
    }
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchedItems = useWatch({
    control: form.control,
    name: 'items'
  });

  const totalAmount = React.useMemo(() => {
    return watchedItems?.reduce((acc, item) => acc + (Number(item.value) || 0), 0) || 0;
  }, [watchedItems]);

  React.useEffect(() => {
    form.setValue('amount', totalAmount);
  }, [totalAmount, form]);

  const handleAddServiceFromTable = (service: Service) => {
    append({
        description: service.name + (service.description ? `\n${service.description}` : ''),
        value: service.price
    });
    setIsServiceModalOpen(false);
    toast({ title: "Serviço Adicionado!", description: `"${service.name}" foi adicionado à proposta.`});
  }
  
  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore || !auth) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    if (offline && !offline.isOnline) {
      toast({
        title: 'Sem rede',
        description:
          'A gravação usa o Firestore offline: os dados serão sincronizados quando a ligação voltar.'});
    }

    const dataToSave = {
      ...values,
      proposalDate: values.proposalDate.toISOString(),
      validUntilDate: values.validUntilDate.toISOString(),
      fileUrl: fileUrl || ''};

    if (currentItem) {
      const docRef = doc(firestore, 'commercialProposals', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({ title: 'Proposta atualizada!', description: 'As informações foram salvas com sucesso.' });
          logUserAction(firestore, auth, 'update_proposal', { proposalId: currentItem.id, proposalNumber: values.proposalNumber });
          onSuccess?.();
        })
        .catch((error) => {
          handleFirestoreFormError(error, {
            toast,
            title: 'Erro ao salvar proposta',
            context: { path: docRef.path, operation: 'update', requestResourceData: dataToSave }});
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'commercialProposals');
      addDoc(collectionRef, dataToSave)
        .then(async (docRef) => {
          try {
            await notifyClientDocPortalUsers(
              firestore,
              values.clientId,
              {
                title: 'Nova proposta comercial',
                description: `Proposta ${values.proposalNumber} disponível no menu Financeiro.`,
                link: NOTIFICATION_LINKS.commercialProposals,
                sourceType: NOTIFICATION_SOURCE.proposta_comercial,
                sourceId: docRef.id,
                actorRole: user?.role},
              { excludeUserId: user?.uid },
            );
          } catch (e) {
            console.warn('[Proposta] notificação:', e);
          }
          toast({ title: 'Proposta criada!', description: `A proposta ${values.proposalNumber} foi criada.` });
          logUserAction(firestore, auth, 'create_proposal', { proposalId: docRef.id, proposalNumber: values.proposalNumber });
          form.reset();
          onSuccess?.();
        })
        .catch((error) => {
          handleFirestoreFormError(error, {
            toast,
            title: 'Erro ao salvar proposta',
            context: { path: collectionRef.path, operation: 'create', requestResourceData: dataToSave }});
        })
        .finally(() => setLoading(false));
    }
  }
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>{currentItem ? 'Editar Proposta Comercial' : 'Adicionar Nova Proposta Comercial'}</DialogTitle>
        <DialogDescription>
            {currentItem ? 'Atualize os detalhes da proposta abaixo.' : 'Preencha os detalhes para criar uma nova proposta comercial.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div className="form-scroll-body space-y-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClients || !clients}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="empreendimento"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Empreendimento</FormLabel>
                <FormControl>
                    <Input placeholder="Nome do empreendimento ou propriedade" {...field} />
                </FormControl>
                 <FormDescription>Este campo é para identificação interna e não cria vínculo com outros cadastros.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
          <FormField
            control={form.control}
            name="proposalNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da Proposta</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: PROP-2024-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="min-w-0 space-y-4 rounded-lg border border-border/80 bg-muted/15 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <h3 className="shrink-0 text-base font-semibold leading-snug text-foreground">
                  Itens da Proposta
                </h3>
                <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:w-auto sm:min-w-[min(100%,20rem)] lg:min-w-[22rem]">
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      className="h-10 min-h-10 min-w-0 gap-1.5 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm"
                      onClick={() => setIsServiceModalOpen(true)}
                    >
                        <List className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="min-w-0 text-balance leading-tight">Adicionar da Tabela</span>
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      className="h-10 min-h-10 min-w-0 gap-1.5 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm"
                      onClick={() => append({ description: '', value: 0 })}
                    >
                        <PlusCircle className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="min-w-0 text-balance leading-tight">Adicionar Manual</span>
                    </Button>
                </div>
              </div>
              {fields.length === 0 ? (
                <p className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/25 px-3 py-3.5 text-center text-sm leading-snug text-muted-foreground">
                  Nenhum item ainda. Use <strong className="font-medium text-foreground/90">Adicionar da Tabela</strong> ou{' '}
                  <strong className="font-medium text-foreground/90">Adicionar Manual</strong> para incluir serviços.
                </p>
              ) : null}
              <div className="space-y-3">
                {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 gap-3 rounded-md border border-border/70 bg-background p-3 sm:grid-cols-[minmax(0,1fr)_10.5rem_auto] sm:items-end sm:gap-x-3 sm:gap-y-2"
                    >
                        <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                                <FormItem className="min-w-0 space-y-1.5">
                                    <FormLabel className="text-sm font-medium">Descrição do Serviço</FormLabel>
                                    <FormControl>
                                        <Textarea
                                          placeholder="Ex: Elaboração de RCA"
                                          {...field}
                                          className="min-h-[4.5rem] w-full resize-y"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`items.${index}.value`}
                            render={({ field }) => (
                                <FormItem className="min-w-0 space-y-1.5 sm:max-w-none">
                                    <FormLabel className="text-sm font-medium">Valor (R$)</FormLabel>
                                    <FormControl>
                                        <CurrencyInput
                                            className="w-full text-right tabular-nums sm:min-w-[9.5rem]"
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center justify-start pb-0.5 sm:items-end sm:justify-end">
                          <Button type="button" variant="destructive" size="icon" className="h-10 w-10 shrink-0" onClick={() => remove(index)} aria-label="Remover item">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                    </div>
                ))}
                {form.formState.errors.items?.root && (
                     <p className="text-sm font-medium text-destructive">{form.formState.errors.items.root.message}</p>
                )}
              </div>
              <Separator className="my-1" />
               <div className="flex flex-wrap items-baseline justify-end gap-x-4 gap-y-1 pt-1">
                    <span className="text-sm font-semibold text-muted-foreground sm:text-base">Valor Total:</span>
                    <span className="text-lg font-bold tabular-nums sm:text-xl">{formatCurrencyBRL(totalAmount)}</span>
                </div>
          </div>
           <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a forma de pagamento..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                  control={form.control}
                  name="proposalDate"
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
                  name="validUntilDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Válido Até</FormLabel>
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
          <div className="space-y-2 rounded-lg border border-border/60 p-3">
            <FormLabel className="text-sm font-medium">
              PDF ou imagem da proposta (opcional)
            </FormLabel>
            <Input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={handleProposalFileChange}
              disabled={isUploadingFile || loading}
              className="cursor-pointer"
            />
            {isUploadingFile ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando arquivo…
              </p>
            ) : null}
          </div>
          {fileUrl ? (
            <div className="rounded-lg border p-3 bg-muted/20">
              <AttachmentPreviewSection
                fileUrl={fileUrl}
                sectionLabel="PDF / anexo da proposta"
                zoomTitle="Anexo da proposta"
              />
            </div>
          ) : null}
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
                    {proposalStatuses.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>
          <DialogFooter className="mt-4 shrink-0 border-t border-border/60 bg-background pt-4 sm:mt-6">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading || isUploadingFile}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Proposta'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>Selecionar Serviço da Tabela</DialogTitle>
                <DialogDescription>Clique em um serviço para adicioná-lo à proposta.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Serviço</TableHead>
                            <TableHead className="text-right">Preço</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingServices && <TableRow><TableCell colSpan={2}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                        {services?.map(service => (
                            <TableRow key={service.id} onClick={() => handleAddServiceFromTable(service)} className="cursor-pointer">
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell className="text-right">{formatCurrencyBRL(service.price)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsServiceModalOpen(false)}>Fechar</Button>
             </DialogFooter>
        </DialogContent>
      </Dialog>
      <UploadPreparationDialog {...dialogProps} />
    </>
  );
}
