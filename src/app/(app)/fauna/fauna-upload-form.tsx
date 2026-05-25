"use client";

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
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Empreendedor } from "@/lib/types";
import {
  useFirebase,
  errorEmitter,
  useCollection,
  useMemoFirebase,
} from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import { UPLOAD_RAW_FILE_SAFETY_MAX } from "@/lib/upload-limits";
import { isPdfLikeFile } from "@/lib/file-mime";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyEmpreendedorPortalUsers } from "@/lib/notifications";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const formSchema = z.object({
  empreendedorId: z.string().min(1, "Selecione um empreendedor."),
  documentName: z.string().min(5, "O nome do documento é obrigatório."),
  fileUrl: z.string().min(1, "Por favor, faça o upload de um arquivo."),
});

type FormValues = z.infer<typeof formSchema>;

interface FaunaUploadFormProps {
  onSuccess?: () => void;
}

export function FaunaUploadForm({ onSuccess }: FaunaUploadFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const { toast } = useToast();
  const { uploadFile, dialogProps, limitLabel } = useStorageFileUpload({
    storageFolder: "fauna",
  });
  const { firestore, user } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empreendedorId: "",
      documentName: "",
      fileUrl: "",
    },
  });

  const fileUrlValue = form.watch("fileUrl");

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    // Capture o input e o arquivo agora; evitar depender de `event` após `await`.
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;

    // Permite selecionar o mesmo arquivo novamente.
    inputEl.value = "";

    if (!isPdfLikeFile(file)) {
      toast({
        variant: "destructive",
        title: "Tipo de arquivo inválido",
        description: "Apenas arquivos PDF são permitidos.",
      });
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast({
        variant: "destructive",
        title: "Sem ligação",
        description:
          "O envio do PDF para o Storage precisa de internet. Tente novamente quando estiver online.",
      });
      return;
    }

    setIsUploading(true);
    form.setValue("fileUrl", "");

    try {
      const downloadUrl = await uploadFile(file);
      if (!downloadUrl) return;
      form.setValue("fileUrl", downloadUrl, { shouldValidate: true });
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
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Erro de autenticação." });
      setLoading(false);
      return;
    }

    const dataToSave = {
      ...values,
      studyType: "externo" as const,
      status: "completed" as const,
      createdAt: serverTimestamp(),
      ownerId: user.uid,
    };

    const collectionRef = collection(firestore, "faunaStudies");

    addDoc(collectionRef, dataToSave)
      .then(async (ref) => {
        try {
          await notifyEmpreendedorPortalUsers(
            firestore,
            values.empreendedorId,
            {
              title: "Novo documento de fauna",
              description: `${values.documentName} em Documentos Ambientais.`,
              link: NOTIFICATION_LINKS.fauna,
              sourceType: NOTIFICATION_SOURCE.fauna,
              sourceId: ref.id,
              actorRole: user.role,
            },
            { excludeUserId: user.uid },
          );
        } catch (e) {
          console.warn("[Fauna] notificação:", e);
        }
        toast({
          title: "Documento Salvo!",
          description: "O documento de fauna foi adicionado com sucesso.",
        });
        form.reset();
        onSuccess?.();
      })
      .catch((error: any) => {
        console.error("Error saving fauna document:", error);
        const permissionError = new FirestorePermissionError({
          path: "faunaStudies",
          operation: "create",
          requestResourceData: dataToSave,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Adicionar Documento de Fauna Externo</DialogTitle>
        <DialogDescription>
          Faça o upload de uma autorização, licença ou relatório em PDF já
          existente.
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
              name="empreendedorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empreendedor</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingEmpreendedores}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingEmpreendedores
                              ? "Carregando..."
                              : "Selecione um empreendedor"
                          }
                        />
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
              name="documentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome/Descrição do Documento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Autorização de Manejo de Fauna Nº 123/2024"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Este nome será exibido na lista de documentos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Arquivo (PDF)</FormLabel>
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando
                  arquivo...
                </p>
              )}
              <FormMessage>{form.formState.errors.fileUrl?.message}</FormMessage>
              {fileUrlValue ? (
                <div className="mt-3">
                  <AttachmentPreviewSection
                    fileUrl={fileUrlValue}
                    sectionLabel="Pré-visualização do PDF"
                    zoomTitle="Documento"
                  />
                </div>
              ) : null}
            </FormItem>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onSuccess}>
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
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Salvar Documento
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
