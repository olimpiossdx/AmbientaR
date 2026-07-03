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
import type { Oficio, AppUser } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { collection, doc, addDoc, updateDoc, serverTimestamp, limit, query } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { getRoleLabelPt } from '@/lib/user-role-labels';
import {
  OFICIO_SALUTATION_OPTIONS,
  DEFAULT_OFICIO_GREETING,
  DEFAULT_OFICIO_CLOSING,
  composeOficioRecipient,
  buildOficioConsolidatedText,
  legacyOficioRecipientDefaults,
} from '@/lib/oficio-format';
import {
  OFICIO_TEMPLATES,
  type OficioTemplateId,
} from '@/lib/oficio-templates';
import { OficioExportButtons } from '@/components/oficios/oficio-export-buttons';

const formSchema = z.object({
  recipientSalutation: z.string().min(1, 'Selecione a forma de tratamento.'),
  recipientName: z.string().min(2, 'Informe o nome ou cargo do destinatário.'),
  recipientRole: z.string().optional(),
  recipientOrganization: z.string().optional(),
  recipientAddress: z.string().optional(),
  recipientCity: z.string().optional(),
  referente: z.string().optional(),
  processoSei: z.string().optional(),
  subject: z.string().min(5, 'O assunto é obrigatório.'),
  reference: z.string().optional(),
  greeting: z.string().min(3, 'A saudação é obrigatória.'),
  body: z.string().min(20, 'O corpo do ofício deve ter pelo menos 20 caracteres.'),
  closing: z.string().min(3, 'O fecho é obrigatório.'),
  attachments: z.string().optional(),
  solicitante: z.string().optional(),
  signatoryProcuracao: z.string().optional(),
  municipio: z.string().min(1, 'O município é obrigatório.'),
  estado: z.string().min(2, 'O estado é obrigatório.').max(2, 'Use a sigla do estado.'),
  assinanteId: z.string().min(1, 'Selecione o responsável interno (controle).'),
});

type FormValues = z.infer<typeof formSchema>;

function oficioToFormValues(item: Oficio): FormValues {
  const legacy = legacyOficioRecipientDefaults(item);
  return {
    recipientSalutation: item.recipientSalutation || legacy.recipientSalutation || 'Ao',
    recipientName: item.recipientName || legacy.recipientName || '',
    recipientRole: item.recipientRole || '',
    recipientOrganization: item.recipientOrganization || '',
    recipientAddress: item.recipientAddress || '',
    recipientCity: item.recipientCity || '',
    referente: item.referente || item.reference || '',
    processoSei: item.processoSei || '',
    subject: item.subject || '',
    reference: item.reference || '',
    greeting: item.greeting || DEFAULT_OFICIO_GREETING,
    body: item.body || '',
    closing: item.closing || DEFAULT_OFICIO_CLOSING,
    attachments: item.attachments || '',
    solicitante: item.solicitante || '',
    signatoryProcuracao: item.signatoryProcuracao || '',
    municipio: item.municipio || 'Unaí',
    estado: item.estado || 'MG',
    assinanteId: item.assinanteId || '',
  };
}

interface OficioFormProps {
  currentItem?: Oficio | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OficioForm({ currentItem, onSuccess, onCancel }: OficioFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [assinaturaUrl, setAssinaturaUrl] = React.useState<string | null>(
    currentItem?.assinaturaDigitalUrl || null,
  );

  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), limit(100)) : null),
    [firestore],
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection<AppUser>(usersQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem
      ? oficioToFormValues(currentItem)
      : {
          recipientSalutation: 'Ao',
          recipientName: '',
          recipientRole: '',
          recipientOrganization: '',
          recipientAddress: '',
          recipientCity: '',
          referente: '',
          processoSei: '',
          subject: '',
          reference: '',
          greeting: DEFAULT_OFICIO_GREETING,
          body: '',
          closing: DEFAULT_OFICIO_CLOSING,
          attachments: '',
          solicitante: '',
          signatoryProcuracao: '',
          municipio: 'Unaí',
          estado: 'MG',
          assinanteId: '',
        },
  });

  React.useEffect(() => {
    if (currentItem) {
      form.reset(oficioToFormValues(currentItem));
      setAssinaturaUrl(currentItem.assinaturaDigitalUrl || null);
    }
  }, [currentItem, form]);

  const selectedAssinanteId = form.watch('assinanteId');
  const watched = form.watch();

  const assinanteSelecionado = React.useMemo(
    () => users?.find((u) => u.uid === selectedAssinanteId),
    [users, selectedAssinanteId],
  );

  const previewText = React.useMemo(
    () =>
      buildOficioConsolidatedText({
        ...watched,
        oficioNumber: currentItem?.oficioNumber,
        dataEmissao: currentItem?.dataEmissao,
        assinanteNome: assinanteSelecionado?.name,
        assinanteCargo: assinanteSelecionado
          ? getRoleLabelPt(assinanteSelecionado.role)
          : undefined,
      }),
    [watched, currentItem?.oficioNumber, currentItem?.dataEmissao, assinanteSelecionado],
  );

  const applyTemplate = (templateId: OficioTemplateId) => {
    const t = OFICIO_TEMPLATES[templateId].defaults;
    form.reset({
      recipientSalutation: t.recipientSalutation || 'Ao',
      recipientName: t.recipientName || '',
      recipientRole: t.recipientRole || '',
      recipientOrganization: t.recipientOrganization || '',
      recipientAddress: t.recipientAddress || '',
      recipientCity: t.recipientCity || '',
      referente: t.referente || '',
      processoSei: t.processoSei || '',
      subject: t.subject || '',
      reference: t.reference || '',
      greeting: t.greeting || DEFAULT_OFICIO_GREETING,
      body: t.body || '',
      closing: t.closing || DEFAULT_OFICIO_CLOSING,
      attachments: t.attachments || '',
      solicitante: t.solicitante || '',
      signatoryProcuracao: t.signatoryProcuracao || '',
      municipio: t.municipio || 'Unaí',
      estado: t.estado || 'MG',
      assinanteId: form.getValues('assinanteId'),
    });
    toast({
      title: 'Modelo aplicado',
      description: OFICIO_TEMPLATES[templateId].label,
    });
  };

  const copyConsolidatedText = async () => {
    if (!previewText) return;
    try {
      await navigator.clipboard.writeText(previewText);
      toast({ title: 'Texto copiado', description: 'Ofício consolidado na área de transferência.' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Não foi possível copiar',
        description: 'Copie manualmente na pré-visualização.',
      });
    }
  };

  async function handleSave(values: FormValues) {
    setLoading(true);
    if (!firestore || !user || !assinanteSelecionado) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação ou dados.',
        description: 'Não foi possível salvar o ofício.',
      });
      setLoading(false);
      return;
    }

    const recipient = composeOficioRecipient(values);

    const isApproved = currentItem?.status === 'Concluído';

    const dataToSave: Record<string, unknown> = {
      recipientSalutation: values.recipientSalutation,
      recipientName: values.recipientName.trim(),
      recipientRole: values.recipientRole?.trim() || '',
      recipientOrganization: values.recipientOrganization?.trim() || '',
      recipientAddress: values.recipientAddress?.trim() || '',
      recipientCity: values.recipientCity?.trim() || '',
      recipient,
      referente: values.referente?.trim() || '',
      processoSei: values.processoSei?.trim() || '',
      subject: values.subject,
      reference: values.reference?.trim() || '',
      greeting: values.greeting,
      body: values.body,
      closing: values.closing,
      attachments: values.attachments?.trim() || '',
      solicitante: values.solicitante?.trim() || '',
      signatoryProcuracao: values.signatoryProcuracao?.trim() || '',
      municipio: values.municipio,
      estado: values.estado,
      assinanteId: values.assinanteId,
      assinaturaDigitalUrl: assinaturaUrl || '',
      dataEmissao: currentItem?.dataEmissao || new Date().toISOString(),
      assinanteNome: assinanteSelecionado.name,
      assinanteCargo: getRoleLabelPt(assinanteSelecionado.role),
      status: isApproved ? 'Concluído' : 'Rascunho',
    };

    if (!currentItem) {
      dataToSave.createdBy = user.uid;
      dataToSave.creatorName = user.displayName || user.email;
    } else if (isApproved) {
      if (currentItem.oficioNumber) dataToSave.oficioNumber = currentItem.oficioNumber;
      if (currentItem.sequence != null) dataToSave.sequence = currentItem.sequence;
      if (currentItem.year != null) dataToSave.year = currentItem.year;
      if (currentItem.completedAt) dataToSave.completedAt = currentItem.completedAt;
    }

    try {
      if (currentItem) {
        const docRef = doc(firestore, 'oficios', currentItem.id);
        await updateDoc(docRef, dataToSave);
        toast({ title: 'Rascunho atualizado!' });
      } else {
        const collectionRef = collection(firestore, 'oficios');
        await addDoc(collectionRef, { ...dataToSave, createdAt: serverTimestamp() });
        toast({ title: 'Rascunho salvo!' });
      }
      onSuccess?.();
    } catch (error) {
      handleFirestoreFormError(error, {
        toast,
        title: 'Erro ao salvar ofício',
        context: {
          path: 'oficios',
          operation: currentItem ? 'update' : 'create',
          requestResourceData: dataToSave,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="h-full flex flex-col">
        <div className="form-scroll-body space-y-6">
          <section className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <h3 className="text-base font-semibold text-foreground">Modelo consolidado</h3>
            <p className="text-sm text-muted-foreground">
              Formato alinhado ao ofício 033/2025 (OF/PIMENTAAMBIENTAL, referente, processo
              SEI, destinatário ao final). Substitua os campos entre colchetes.
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(OFICIO_TEMPLATES) as OficioTemplateId[]).map((id) => (
                <Button
                  key={id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => applyTemplate(id)}
                >
                  {OFICIO_TEMPLATES[id].label}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Destinatário (bloco final do ofício)
            </h3>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,10rem)_1fr]">
              <FormField
                control={form.control}
                name="recipientSalutation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tratamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tratamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OFICIO_SALUTATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João da Silva" {...field} />
                    </FormControl>
                    <FormDescription>
                      Usado para notificar o portal do cliente quando o nome coincidir com um cadastro.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="recipientRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo / função</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Gerente, Diretor(a), Coordenador(a)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recipientOrganization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Órgão / complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recipientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço do destinatário</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Rua, número, bairro — uma linha por trecho ou tudo em um parágrafo"
                      className="min-h-[72px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recipientCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade / CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Unaí/MG - CEP 38610-000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Cabeçalho (referente e processo)</h3>
            <FormField
              control={form.control}
              name="referente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referente</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Solicitação de assinatura de Termo de Ajustamento de Conduta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="processoSei"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processo SEI/SLA</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 2023.06.01.003.0004632" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Solicitação de documentos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referência</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Opcional — ex: Processo nº 123/2026, contrato, licença"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Texto do ofício</h3>
            <FormField
              control={form.control}
              name="greeting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saudação</FormLabel>
                  <FormControl>
                    <Input placeholder={DEFAULT_OFICIO_GREETING} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Corpo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Desenvolva o conteúdo do ofício (parágrafos, solicitações, fundamentação...)"
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="closing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecho</FormLabel>
                  <FormControl>
                    <Input placeholder={DEFAULT_OFICIO_CLOSING} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anexo(s)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: dos documentos pessoais do representante do empreendimento."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    No texto consolidado: &quot;Anexo, consta cópia: …&quot;
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="solicitante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solicitante / responsável legal</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Qualificação completa (nome, CPF, endereço...)"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Local e data de emissão</h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="municipio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Município</FormLabel>
                      <FormControl>
                        <Input className="w-48" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input className="w-20" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Assinatura no ofício</h3>
            <FormField
              control={form.control}
              name="signatoryProcuracao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assinatura p/p (responsável legal)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Irineu Anselmo Urban" {...field} />
                  </FormControl>
                  <FormDescription>
                    Aparece após a linha de sublinhado, como no modelo Word.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assinanteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável interno (controle)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingUsers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingUsers ? 'Carregando...' : 'Selecione quem irá assinar'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map((u) => (
                        <SelectItem key={u.uid} value={u.uid}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {assinanteSelecionado && (
              <div className="text-center py-2">
                <p className="font-semibold">{assinanteSelecionado.name}</p>
                <p className="text-sm text-muted-foreground">
                  {getRoleLabelPt(assinanteSelecionado.role)}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-dashed border-border/80 bg-background p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Pré-visualização consolidada
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {currentItem && (
                  <OficioExportButtons oficio={currentItem} variant="default" />
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!previewText}
                  onClick={copyConsolidatedText}
                >
                  Copiar texto
                </Button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed max-h-80 overflow-y-auto">
              {previewText || 'Preencha os campos ou aplique um modelo.'}
            </pre>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              'Salvar como Rascunho'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
