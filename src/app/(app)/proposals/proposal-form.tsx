/**
 * @deprecated Coleção legada `proposals`. Rotas `/proposals/*` redirecionam para
 * `/commercial-proposals`. Formulário ativo: `commercial-proposals/proposal-form.tsx`.
 */
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PlusCircle, Trash2, List } from "lucide-react";
import { BrDateFormControl } from "@/components/form/br-date-input";
import { useToast } from "@/hooks/use-toast";
import type { Proposal, Client, ProposalItem, Service } from "@/lib/types";
import {
  useFirebase,
  errorEmitter,
  useCollection,
  useMemoFirebase,
} from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { collection, doc, addDoc, updateDoc } from "firebase/firestore";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import { UPLOAD_RAW_FILE_SAFETY_MAX } from "@/lib/upload-limits";
import { Textarea } from "@/components/ui/textarea";
import { logUserAction } from "@/lib/audit-log";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogContent,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

const formSchema = z
  .object({
    clientId: z.string().min(1, "Selecione um cliente."),
    empreendimento: z.string().optional(),
    proposalNumber: z.string().min(1, "O número do orçamento é obrigatório."),
    items: z
      .array(
        z.object({
          description: z
            .string()
            .min(1, "A descrição do serviço é obrigatória."),
          value: z.coerce.number().min(0, "O valor não pode ser negativo."),
        }),
      )
      .min(1, "Adicione pelo menos um item de serviço."),
    amount: z.number(),
    status: z.enum(["Draft", "Sent", "Accepted", "Rejected"]),
    proposalDate: z.date({
      required_error: "A data de emissão é obrigatória.",
    }),
    validUntilDate: z.date({
      required_error: "A data de validade é obrigatória.",
    }),
    file: z
      .any()
      .optional()
      .refine(
        (files) =>
          !files || files.length === 0 || files?.[0]?.size <= UPLOAD_RAW_FILE_SAFETY_MAX,
        "Arquivo excede o limite de processamento no navegador.",
      ),
  })
  .refine((data) => data.validUntilDate >= data.proposalDate, {
    message: "A data de validade não pode ser anterior à data de emissão.",
    path: ["validUntilDate"],
  });

type FormValues = z.infer<typeof formSchema>;

interface ProposalFormProps {
  currentItem?: Proposal | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const proposalStatuses: { value: Proposal["status"]; label: string }[] = [
  { value: "Draft", label: "Rascunho" },
  { value: "Sent", label: "Enviado" },
  { value: "Accepted", label: "Aceito" },
  { value: "Rejected", label: "Rejeitado" },
];

const formatCurrencyBRL = (value: number) => {
  if (isNaN(value)) value = 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
    onChange: (value: number) => void;
    value: number;
  }
>(({ value, onChange, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState(
    formatCurrencyBRL(value || 0),
  );

  React.useEffect(() => {
    setDisplayValue(formatCurrencyBRL(value || 0));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const numericValue = Number(rawValue) / 100;
    onChange(numericValue);
    setDisplayValue(formatCurrencyBRL(numericValue));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const numericValue = Number(rawValue) / 100;
    setDisplayValue(formatCurrencyBRL(numericValue));
  };

  return (
    <Input
      ref={ref}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  );
});
CurrencyInput.displayName = "CurrencyInput";

export function ProposalForm({
  currentItem,
  onSuccess,
  onCancel,
}: ProposalFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(
    currentItem?.fileUrl || null,
  );
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);

  const { toast } = useToast();
  const { uploadFile, dialogProps, limitLabel } = useStorageFileUpload({
    storageFolder: "proposals",
  });
  const { firestore, auth } = useFirebase();

  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "clients") : null),
    [firestore],
  );
  const { data: clients, isLoading: isLoadingClients } =
    useCollection<Client>(clientsQuery);

  const servicesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "services") : null),
    [firestore],
  );
  const { data: services, isLoading: isLoadingServices } =
    useCollection<Service>(servicesQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem
      ? {
          ...currentItem,
          proposalDate: new Date(currentItem.proposalDate),
          validUntilDate: new Date(currentItem.validUntilDate),
          items: currentItem.items || [{ description: "", value: 0 }],
        }
      : {
          clientId: "",
          empreendimento: "",
          proposalNumber: "",
          items: [{ description: "", value: 0 }],
          amount: 0,
          status: "Draft",
          proposalDate: new Date(),
          validUntilDate: new Date(
            new Date().setDate(new Date().getDate() + 30),
          ),
        },
  });

  React.useEffect(() => {
    if (currentItem) {
      form.reset({
        ...currentItem,
        proposalDate: new Date(currentItem.proposalDate),
        validUntilDate: new Date(currentItem.validUntilDate),
        items: currentItem.items || [{ description: "", value: 0 }],
      });
      setUploadedFileUrl(currentItem.fileUrl || null);
    }
  }, [currentItem, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });

  const totalAmount = React.useMemo(() => {
    return (
      watchedItems?.reduce((acc, item) => acc + (Number(item.value) || 0), 0) ||
      0
    );
  }, [watchedItems]);

  React.useEffect(() => {
    form.setValue("amount", totalAmount);
  }, [totalAmount, form]);

  const handleAddServiceFromTable = (service: Service) => {
    append({
      description:
        service.name + (service.description ? `\n${service.description}` : ""),
      value: service.price,
    });
    setIsServiceModalOpen(false);
    toast({
      title: "Serviço Adicionado!",
      description: `"${service.name}" foi adicionado ao orçamento.`,
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // Capture o input agora; não reutilizar `event` após `await`.
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileUrl(null);

    try {
      // Permite selecionar o mesmo arquivo novamente.
      inputEl.value = "";

      const downloadUrl = await uploadFile(file);
      if (!downloadUrl) return;
      setUploadedFileUrl(downloadUrl);
      toast({
        title: "Anexo carregado",
        description: "O arquivo está pronto para ser salvo.",
      });
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        variant: "destructive",
        title: "Erro no Upload",
        description: "Não foi possível enviar o arquivo.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore || !auth) {
      toast({ variant: "destructive", title: "Firebase não inicializado." });
      setLoading(false);
      return;
    }

    const dataToSave = {
      ...values,
      proposalDate: values.proposalDate.toISOString(),
      validUntilDate: values.validUntilDate.toISOString(),
      fileUrl: uploadedFileUrl || currentItem?.fileUrl || "",
    };

    if (currentItem) {
      const docRef = doc(firestore, "proposals", currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({
            title: "Orçamento atualizado!",
            description: "As informações foram salvas com sucesso.",
          });
          logUserAction(firestore, auth, "update_proposal", {
            proposalId: currentItem.id,
            proposalNumber: values.proposalNumber,
          });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: "update",
            requestResourceData: dataToSave,
          });
          errorEmitter.emit("permission-error", permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, "proposals");
      addDoc(collectionRef, dataToSave)
        .then((docRef) => {
          toast({
            title: "Orçamento criado!",
            description: `O orçamento ${values.proposalNumber} foi criado.`,
          });
          logUserAction(firestore, auth, "create_proposal", {
            proposalId: docRef.id,
            proposalNumber: values.proposalNumber,
          });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: "create",
            requestResourceData: dataToSave,
          });
          errorEmitter.emit("permission-error", permissionError);
        })
        .finally(() => setLoading(false));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {currentItem ? "Editar Orçamento" : "Adicionar Novo Orçamento"}
        </DialogTitle>
        <DialogDescription>
          {currentItem
            ? "Atualize os detalhes do orçamento abaixo."
            : "Preencha os detalhes para criar um novo orçamento."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full flex flex-col overflow-hidden"
        >
          <div className="form-scroll-body space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingClients || !clients}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingClients
                              ? "Carregando..."
                              : "Selecione um cliente"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
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
              name="empreendimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empreendimento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do empreendimento ou propriedade"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Este campo é para identificação interna e não cria vínculo
                    com outros cadastros.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="proposalNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do Orçamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: ORC-2024-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-md border p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold">Itens de Serviço</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => setIsServiceModalOpen(true)}
                  >
                    <List className="mr-2 h-4 w-4" /> Adicionar da Tabela
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => append({ description: "", value: 0 })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Manual
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-end gap-2 border p-2 rounded-md"
                  >
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">
                            Descrição do Serviço
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ex: Elaboração de RCA"
                              {...field}
                              className="min-h-[40px]"
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
                        <FormItem>
                          <FormLabel className="text-xs">Valor (R$)</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              className="w-40 text-right"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {form.formState.errors.items?.root && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.items.root.message}
                  </p>
                )}
              </div>
              <Separator />
              <div className="flex justify-end items-center gap-4">
                <span className="font-semibold">Valor Total:</span>
                <span className="text-xl font-bold">
                  {formatCurrencyBRL(totalAmount)}
                </span>
              </div>
            </div>

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
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status atual" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {proposalStatuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
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
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anexar Documento (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </FormControl>
                  <FormDescription>
                    Anexe a minuta do orçamento (PDF). Máx 10MB.
                  </FormDescription>
                  {(currentItem?.fileUrl || uploadedFileUrl) && (
                    <div className="mt-3">
                      <AttachmentPreviewSection
                        fileUrl={uploadedFileUrl || currentItem?.fileUrl || null}
                        sectionLabel={
                          uploadedFileUrl
                            ? "Pré-visualização do novo PDF"
                            : "PDF atual"
                        }
                        zoomTitle="Anexo do orçamento"
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || isUploading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Carregando...
                </>
              ) : (
                "Salvar Orçamento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
      <UploadPreparationDialog {...dialogProps} />
      {/* Service Selection Modal */}
    </>
  );
}
