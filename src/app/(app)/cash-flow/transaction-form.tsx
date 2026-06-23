"use client";

import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import * as React from "react";
import { z } from "zod";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { numberToWordsBRL } from "@/lib/utils";
import { BrDateFormControl } from "@/components/form/br-date-input";
import { useToast } from "@/hooks/use-toast";
import type {
  Revenue,
  Expense,
  Client,
  Fornecedor,
  ExpenseCategory,
  Contract,
  Project,
  ProjectRoiCase} from "@/lib/types";
import {
  TransactionExtraFields,
  type TransactionExtraFieldsForm} from "@/components/financial/transaction-extra-fields";
import {
  useFirebase,
  useCollection,
  useMemoFirebase} from "@/firebase";

import { collection, doc, addDoc, updateDoc } from "firebase/firestore";
import { isImageOrPdfForTransaction } from "@/lib/file-mime";
import { logUserAction } from "@/lib/audit-log";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import { UPLOAD_RAW_FILE_SAFETY_MAX } from "@/lib/upload-limits";
import { Label } from "@/components/ui/label";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from "@/components/ui/select";

const formSchema = z.object({
  description: z.string().min(2, "A descrição é obrigatória."),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  amountInWords: z.string().optional(),
  date: z.date({ required_error: "A data é obrigatória." }),
  clientId: z.string().optional(),
  category: z.string().optional(),
  supplierId: z.string().optional(),
  requestId: z.string().optional(),
  projectId: z.string().optional(),
  centroCusto: z.string().optional(),
  invoiceId: z.string().optional(),
  projectRoiCaseId: z.string().optional(),
  contractId: z.string().optional(),
  impostoValor: z.coerce.number().optional(),
  file: z
    .any()
    .optional()
    .refine(
      (files) =>
        !files ||
          files.length === 0 ||
          files?.[0]?.size <= UPLOAD_RAW_FILE_SAFETY_MAX,
      "Arquivo excede o limite de processamento no navegador.",
    )});

type TransactionFormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  transactionType: "revenue" | "expense";
  currentItem?: Revenue | Expense | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  /** Pré-vínculo ao abrir a partir de Projetos & ROI */
  defaultProjectRoiCaseId?: string;
  defaultContractId?: string;
  defaultClientId?: string;
  defaultProjectId?: string;
}

const formatCurrencyBRL = (value: number) => {
  if (isNaN(value)) value = 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"}).format(value);
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

export function TransactionForm({
  transactionType,
  currentItem,
  onSuccess,
  onCancel,
  defaultProjectRoiCaseId,
  defaultContractId,
  defaultClientId,
  defaultProjectId}: TransactionFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(
    currentItem?.fileUrl || null,
  );
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();
  const { uploadFile, dialogProps, limitLabel } = useStorageFileUpload({
    storageFolder: "transactions",
    buildStoragePath: (file, safe) => {
      const uid = auth?.currentUser?.uid;
      if (!uid) throw new Error("Sessão inválida. Faça login novamente.");
      const sub =
        transactionType === "revenue" ? "revenues" : "expenses";
      return `transactions/${sub}/${uid}/${Date.now()}-${safe}`;
    }});

  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "clients") : null),
    [firestore],
  );
  const { data: clients, isLoading: isLoadingClients } =
    useCollection<Client>(clientsQuery);

  const suppliersQuery = useMemoFirebase(
    () => (firestore && transactionType === "expense" ? collection(firestore, "fornecedores") : null),
    [firestore, transactionType],
  );
  const { data: suppliers, isLoading: isLoadingSuppliers } =
    useCollection<Fornecedor>(suppliersQuery);

  const roiCasesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "project_roi_cases") : null),
    [firestore],
  );
  const { data: roiCases, isLoading: isLoadingRoiCases } =
    useCollection<ProjectRoiCase>(roiCasesQuery);

  const contractsQuery = useMemoFirebase(
    () => (firestore && transactionType === "revenue" ? collection(firestore, "contracts") : null),
    [firestore, transactionType],
  );
  const { data: contracts, isLoading: isLoadingContracts } =
    useCollection<Contract>(contractsQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );
  const { data: projects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: currentItem?.description || "",
      amount: currentItem?.amount || 0,
      amountInWords: currentItem?.amount
        ? numberToWordsBRL(currentItem.amount)
        : "",
      date: currentItem ? new Date(currentItem.date) : new Date(),
      clientId: (currentItem as Revenue)?.clientId || "",
      category: (currentItem as Expense)?.category || "",
      supplierId: (currentItem as Expense)?.supplierId || "",
      requestId: currentItem?.requestId || "",
      projectId: currentItem?.projectId || "",
      centroCusto: currentItem?.centroCusto || "",
      invoiceId: (currentItem as Revenue)?.invoiceId || "",
      projectRoiCaseId:
        (currentItem as Revenue | Expense)?.projectRoiCaseId ||
        defaultProjectRoiCaseId ||
        "",
      contractId:
        (currentItem as Revenue)?.contractId || defaultContractId || "",
      impostoValor: (currentItem as Expense)?.impostoValor}});

  const amountValue = form.watch("amount");

  React.useEffect(() => {
    form.setValue("amountInWords", numberToWordsBRL(amountValue));
  }, [amountValue, form]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // Capture o input e o arquivo agora; não reutilizar `event` após `await`,
    // para evitar comportamento inesperado do React.
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;

    if (!isImageOrPdfForTransaction(file)) {
      toast({
        variant: "destructive",
        title: "Tipo de arquivo inválido",
        description: "Envie apenas PDF, JPG ou PNG."});
      inputEl.value = "";
      return;
    }

    // Permite selecionar o mesmo arquivo novamente sem depender de `event` no async.
    inputEl.value = "";

    setIsUploading(true);
    setUploadedFileUrl(null);
    try {
      const downloadUrl = await uploadFile(file);
      if (!downloadUrl) return;
      setUploadedFileUrl(downloadUrl);
      toast({
        title: "Anexo carregado",
        description: "O arquivo está pronto para ser salvo."});
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        variant: "destructive",
        title: "Erro no Upload",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o arquivo."});
    } finally {
      setIsUploading(false);
    }
  };

  async function onSubmit(values: TransactionFormValues) {
    setLoading(true);

    if (!firestore || !auth) {
      toast({ variant: "destructive", title: "Firebase não inicializado." });
      setLoading(false);
      return;
    }

    const collectionName =
      transactionType === "revenue" ? "revenues" : "expenses";
    const dataToSave: Record<string, unknown> = {
      description: values.description,
      amount: values.amount,
      date: values.date.toISOString(),
      fileUrl: uploadedFileUrl || currentItem?.fileUrl || ""};
    if (values.requestId) dataToSave.requestId = values.requestId;
    if (values.projectId) dataToSave.projectId = values.projectId;
    if (values.centroCusto) dataToSave.centroCusto = values.centroCusto;
    if (values.projectRoiCaseId) {
      dataToSave.projectRoiCaseId = values.projectRoiCaseId;
    } else if (defaultProjectRoiCaseId) {
      dataToSave.projectRoiCaseId = defaultProjectRoiCaseId;
    }
    const contractIdVal = values.contractId || defaultContractId;
    if (contractIdVal) dataToSave.contractId = contractIdVal;
    if (transactionType === "revenue") {
      const cid =
        values.clientId ||
        defaultClientId ||
        (currentItem as Revenue | undefined)?.clientId;
      if (cid) dataToSave.clientId = cid;
      if (values.invoiceId) dataToSave.invoiceId = values.invoiceId;
    }
    if (!values.projectId && defaultProjectId) {
      dataToSave.projectId = defaultProjectId;
    }
    if (transactionType === "expense") {
      if (values.category) dataToSave.category = values.category as ExpenseCategory;
      if (values.supplierId) dataToSave.supplierId = values.supplierId;
      if (values.impostoValor != null && values.impostoValor > 0) {
        dataToSave.impostoValor = values.impostoValor;
      }
    }

    if (currentItem) {
      const itemRef = doc(firestore, collectionName, currentItem.id);
      updateDoc(itemRef, dataToSave)
        .then(() => {
          toast({
            title: `Lançamento atualizado!`,
            description: "As informações foram salvas com sucesso."});
          logUserAction(firestore, auth, `update_${transactionType}`, {
            id: currentItem.id,
            description: values.description});
          onSuccess?.();
        })
        .catch((error) => {
          handleFirestoreFormError(error, {
            toast,
            title: 'Erro ao salvar transação',
            context: {
            path: itemRef.path,
            operation: "update",
            requestResourceData: dataToSave}});
        })
        .finally(() => setLoading(false));
    } else {
      const itemsCollectionRef = collection(firestore, collectionName);
      addDoc(itemsCollectionRef, dataToSave)
        .then((docRef) => {
          toast({
            title: `Lançamento criado!`,
            description: `O lançamento foi adicionado com sucesso.`});
          logUserAction(firestore, auth, `create_${transactionType}`, {
            id: docRef.id,
            description: values.description});
          form.reset();
          onSuccess?.();
        })
        .catch((error) => {
          handleFirestoreFormError(error, {
            toast,
            title: 'Erro ao salvar transação',
            context: {
            path: itemsCollectionRef.path,
            operation: "create",
            requestResourceData: dataToSave}});
        })
        .finally(() => setLoading(false));
    }
  }

  const title = transactionType === "revenue" ? "Receita" : "Despesa";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          {transactionType === "revenue" && (
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente (Opcional)</FormLabel>
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
                  <FormDescription>
                    Vincule esta receita a um cliente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição da {title}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={`Ex: Venda de serviço de consultoria`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amountInWords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor por Extenso</FormLabel>
                <FormControl>
                  <Input readOnly disabled {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da {title}</FormLabel>
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
          <TransactionExtraFields
            control={
              form.control as unknown as Control<TransactionExtraFieldsForm>
            }
            transactionType={transactionType}
            suppliers={suppliers ?? undefined}
            isLoadingSuppliers={isLoadingSuppliers}
            showInvoiceLink={transactionType === "revenue"}
            roiCases={roiCases ?? undefined}
            isLoadingRoiCases={isLoadingRoiCases}
            contracts={contracts ?? undefined}
            isLoadingContracts={isLoadingContracts}
            projects={projects ?? undefined}
            isLoadingProjects={isLoadingProjects}
            onRoiCaseChange={(id, selected) => {
              form.setValue("projectRoiCaseId", id);
              if (selected?.contractId) {
                form.setValue("contractId", selected.contractId);
              }
              if (selected?.projectId) {
                form.setValue("projectId", selected.projectId);
              }
              if (selected?.clientId && transactionType === "revenue") {
                form.setValue("clientId", selected.clientId);
              }
            }}
          />
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anexar Comprovante (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(e) => {
                      field.onChange(e.target.files);
                      void handleFileChange(e);
                    }}
                    disabled={isUploading}
                  />
                </FormControl>
                <FormDescription>
                  Anexe o comprovante (PDF, JPG, PNG). Limite após otimização:{" "}
                  {limitLabel}.
                </FormDescription>
                {(currentItem?.fileUrl || uploadedFileUrl) && (
                  <div className="mt-3">
                    <AttachmentPreviewSection
                      fileUrl={uploadedFileUrl || currentItem?.fileUrl || null}
                      sectionLabel={
                        uploadedFileUrl
                          ? "Pré-visualização do novo anexo"
                          : "Anexo atual"
                      }
                      zoomTitle="Anexo do lançamento"
                    />
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end space-x-2">
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </form>
      <UploadPreparationDialog {...dialogProps} />
    </Form>
  );
}
