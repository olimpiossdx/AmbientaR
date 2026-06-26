"use client";

import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Empreendedor } from "@/lib/types";
import {
  useFirebase,
  useCollection,
  useMemoFirebase} from "@/firebase";

import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import { isPdfLikeFile } from "@/lib/file-mime";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription} from "@/components/ui/dialog";

const formSchema = z.object({
  empreendedorId: z.string().min(1, "Selecione o empreendedor."),
  titulo: z.string().min(3, "Informe o título ou período da declaração."),
  tipo: z.enum(["declaracao", "cdf", "manifesto", "outro"]),
  fileUrl: z.string().min(1, "Envie o relatório em PDF.")});

type FormValues = z.infer<typeof formSchema>;

type MtrDeclaracaoUploadFormProps = {
  empreendedores?: Empreendedor[];
  defaultEmpreendedorId?: string;
  onSuccess?: () => void;
};

export function MtrDeclaracaoUploadForm({
  empreendedores: empreendedoresProp,
  defaultEmpreendedorId,
  onSuccess}: MtrDeclaracaoUploadFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const { toast } = useToast();
  const { uploadFile, dialogProps } = useStorageFileUpload({
    storageFolder: "mtr-declaracao"});
  const { firestore, user } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore && !empreendedoresProp ? collection(firestore, "empreendedores") : null),
    [firestore, empreendedoresProp],
  );
  const { data: empreendedoresFetched, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedores = empreendedoresProp ?? empreendedoresFetched;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empreendedorId: defaultEmpreendedorId ?? "",
      titulo: "",
      tipo: "declaracao",
      fileUrl: ""}});

  React.useEffect(() => {
    if (defaultEmpreendedorId) {
      form.setValue("empreendedorId", defaultEmpreendedorId);
    }
  }, [defaultEmpreendedorId, form]);

  const fileUrlValue = form.watch("fileUrl");

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    inputEl.value = "";

    if (!isPdfLikeFile(file)) {
      toast({
        variant: "destructive",
        title: "Tipo inválido",
        description: "Envie apenas PDF."});
      return;
    }

    setIsUploading(true);
    form.setValue("fileUrl", "");
    try {
      const downloadUrl = await uploadFile(file);
      if (!downloadUrl) return;
      form.setValue("fileUrl", downloadUrl, { shouldValidate: true });
      toast({ title: "PDF carregado" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo."});
    } finally {
      setIsUploading(false);
    }
  };

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Sessão inválida." });
      return;
    }
    setLoading(true);
    const dataToSave = {
      ...values,
      source: "upload" as const,
      createdAt: serverTimestamp(),
      ownerId: user.uid};

    addDoc(collection(firestore, "mtrDeclaracoes"), dataToSave)
      .then(() => {
        toast({
          title: "Documento salvo",
          description: "A declaração MTR foi registrada."});
        form.reset({
          empreendedorId: defaultEmpreendedorId ?? "",
          titulo: "",
          tipo: "declaracao",
          fileUrl: ""});
        onSuccess?.();
      })
      .catch((error) => {
        handleFirestoreFormError(error, {
          toast,
          title: 'Erro ao salvar documento MTR',
          context: {
            path: "mtrDeclaracoes",
            operation: "create",
            requestResourceData: dataToSave}});})
      .finally(() => setLoading(false));
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Enviar relatório MTR (PDF)</DialogTitle>
        <DialogDescription>
          Declaração de movimentação (DMR), CDF ou manifesto já emitido fora da
          sincronização automática.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col overflow-hidden"
        >
          <div className="form-scroll-body space-y-4">
            <FormField
              control={form.control}
              name="empreendedorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empreendedor</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={Boolean(defaultEmpreendedorId) || isLoadingEmpreendedores}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o empreendedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {empreendedores?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
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
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="declaracao">Declaração (DMR)</SelectItem>
                      <SelectItem value="cdf">CDF</SelectItem>
                      <SelectItem value="manifesto">Manifesto (MTR)</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título / período</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex.: DMR jan/2026 ou CDF nº 12345"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Arquivo PDF</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </FormControl>
              {isUploading && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </p>
              )}
              <FormDescription>
                Relatório ou comprovante emitido no Sistema MTR-MG.
              </FormDescription>
              <FormMessage>{form.formState.errors.fileUrl?.message}</FormMessage>
              {fileUrlValue ? (
                <AttachmentPreviewSection
                  fileUrl={fileUrlValue}
                  sectionLabel="Pré-visualização"
                  zoomTitle="Relatório MTR"
                />
              ) : null}
            </FormItem>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || isUploading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
      <UploadPreparationDialog {...dialogProps} />
    </>
  );
}
