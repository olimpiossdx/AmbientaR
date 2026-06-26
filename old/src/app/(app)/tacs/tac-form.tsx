"use client";

import { handleFirestoreFormError } from "@/lib/firestore-form-errors";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { BrDateFormControl } from "@/components/form/br-date-input";
import { useToast } from "@/hooks/use-toast";
import type {
  Tac,
  TacStatus,
  Empreendedor,
  Project,
  AppUser,
} from "@/lib/types";
import {
  useFirebase,
  useCollection,
  useMemoFirebase,
  useDoc,
} from "@/firebase";
import { guardPortalPackageAction } from "@/lib/package-portal-guard";
import { assertFileAllowedForPackage } from "@/lib/storage-upload";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import { UPLOAD_RAW_FILE_SAFETY_MAX } from "@/lib/upload-limits";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyProjectPortalUsers } from "@/lib/notifications";
import {
  buildEmpreendedorSelectOptions,
  buildProjectSelectOptions,
  normalizeEntityId,
} from "@/lib/empreendedor-project-select";
import { collection, doc, addDoc, updateDoc, limit, query } from "firebase/firestore";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formSchema = z
  .object({
    empreendedorId: z.string().min(1, "Selecione um empreendedor."),
    projectId: z.string().min(1, "Selecione um empreendimento."),
    gtacId: z.string().optional(),
    protocolNumber: z.string().optional(),
    processNumber: z.string().min(1, "O número do processo SEI é obrigatório."),
    tacNumber: z.string().optional(),
    issuingBody: z.string().min(1, "A unidade administrativa é obrigatória."),
    issueDate: z.date({ required_error: "A data de assinatura é obrigatória." }),
    publicationDate: z.date().optional(),
    expirationDate: z.date().optional(),
    status: z.enum(["Vigente", "Concluído", "Cancelado", "Em Andamento"], {
      required_error: "Selecione a situação.",
    }),
    description: z.string().optional(),
    licensingProcessBeforeTac: z.string().optional(),
    licensingProcessAfterTac: z.string().optional(),
    file: z
      .any()
      .optional()
      .refine(
        (files) =>
          !files || files.length === 0 || files?.[0]?.size <= UPLOAD_RAW_FILE_SAFETY_MAX,
        "Arquivo excede o limite de processamento no navegador.",
      ),
  })
  .superRefine((data, ctx) => {
    if (
      data.publicationDate &&
      data.publicationDate < data.issueDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data de publicação deve ser igual ou posterior à assinatura.",
        path: ["publicationDate"],
      });
    }
    if (
      data.expirationDate &&
      data.expirationDate <= data.issueDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data de vencimento deve ser posterior à assinatura.",
        path: ["expirationDate"],
      });
    }
  });

type TacFormValues = z.infer<typeof formSchema>;

interface TacFormProps {
  currentTac?: Tac | null;
  onSuccess?: () => void;
  hideHeader?: boolean;
}

const tacStatuses: { value: TacStatus; label: string }[] = [
  { value: "Vigente", label: "Vigente" },
  { value: "Concluído", label: "Concluído" },
  { value: "Cancelado", label: "Cancelado" },
  { value: "Em Andamento", label: "Em Andamento" },
];

export function TacForm({
  currentTac,
  onSuccess,
  hideHeader,
}: TacFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(
    currentTac?.fileUrl || null,
  );

  const { toast } = useToast();
  const { uploadFile, dialogProps } = useStorageFileUpload({
    storageFolder: "tacs",
  });
  const { firestore, user, auth } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "empreendedores"), limit(200)) : null),
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "projects"), limit(200)) : null),
    [firestore],
  );
  const { data: allProjects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const form = useForm<TacFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const isHydratingFormRef = React.useRef(false);

  React.useEffect(() => {
    if (!currentTac) return;
    isHydratingFormRef.current = true;
    form.reset({
      empreendedorId: normalizeEntityId(currentTac.empreendedorId),
      projectId: normalizeEntityId(currentTac.projectId),
      gtacId: currentTac.gtacId || "",
      protocolNumber: currentTac.protocolNumber || "",
      processNumber: currentTac.processNumber || "",
      tacNumber: currentTac.tacNumber || "",
      issuingBody: currentTac.issuingBody || "",
      issueDate: currentTac.issueDate ? new Date(currentTac.issueDate) : undefined,
      publicationDate: currentTac.publicationDate
        ? new Date(currentTac.publicationDate)
        : undefined,
      expirationDate: currentTac.expirationDate
        ? new Date(currentTac.expirationDate)
        : undefined,
      status: currentTac.status,
      description: currentTac.description || "",
      licensingProcessBeforeTac: currentTac.licensingProcessBeforeTac || "",
      licensingProcessAfterTac: currentTac.licensingProcessAfterTac || "",
    });
    setUploadedFileUrl(currentTac.fileUrl || null);
    queueMicrotask(() => {
      isHydratingFormRef.current = false;
    });
  }, [currentTac, form]);

  const selectedEmpreendedorId = form.watch("empreendedorId");
  const selectedProjectId = form.watch("projectId");

  const linkedEmpreendedorRef = useMemoFirebase(
    () =>
      firestore && currentTac?.empreendedorId
        ? doc(
            firestore,
            "empreendedores",
            normalizeEntityId(currentTac.empreendedorId),
          )
        : null,
    [firestore, currentTac?.empreendedorId],
  );
  const { data: linkedEmpreendedor } = useDoc<Empreendedor>(linkedEmpreendedorRef);

  const linkedProjectRef = useMemoFirebase(
    () =>
      firestore && currentTac?.projectId
        ? doc(firestore, "projects", normalizeEntityId(currentTac.projectId))
        : null,
    [firestore, currentTac?.projectId],
  );
  const { data: linkedProject } = useDoc<Project>(linkedProjectRef);

  const empreendedoresForSelect = React.useMemo(
    () =>
      buildEmpreendedorSelectOptions({
        list: empreendedores,
        selectedId: selectedEmpreendedorId,
        linkedDoc: linkedEmpreendedor,
      }),
    [empreendedores, selectedEmpreendedorId, linkedEmpreendedor],
  );

  const projectsForSelect = React.useMemo(
    () =>
      buildProjectSelectOptions({
        allProjects,
        empreendedorId: selectedEmpreendedorId,
        selectedProjectId,
        linkedDoc: linkedProject,
      }),
    [allProjects, selectedEmpreendedorId, selectedProjectId, linkedProject],
  );

  React.useEffect(() => {
    if (isHydratingFormRef.current) return;
    if (form.getValues("empreendedorId") !== selectedEmpreendedorId) {
      form.setValue("projectId", "");
    }
  }, [selectedEmpreendedorId, form]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    inputEl.value = "";

    if (user) {
      try {
        assertFileAllowedForPackage(file, user as AppUser);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Limite do plano",
          description:
            err instanceof Error
              ? err.message
              : "Upload não permitido neste plano.",
        });
        return;
      }
    }

    setIsUploading(true);
    setUploadedFileUrl(null);
    try {
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

  async function onSubmit(values: TacFormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: "destructive", title: "Firebase não inicializado." });
      setLoading(false);
      return;
    }

    const { file: _file, ...persistableValues } = values;

    const dataToSave = {
      ...persistableValues,
      issueDate: values.issueDate.toISOString(),
      publicationDate: values.publicationDate?.toISOString() || "",
      expirationDate: values.expirationDate?.toISOString() || "",
      fileUrl: uploadedFileUrl || currentTac?.fileUrl || "",
    };

    if (currentTac) {
      const tacRef = doc(firestore, "tacs", currentTac.id);
      updateDoc(tacRef, dataToSave)
        .then(() => {
          toast({
            title: "TAC atualizado!",
            description: "As informações do TAC foram salvas com sucesso.",
          });
          onSuccess?.();
        })
        .catch((error) => {
          handleFirestoreFormError(error, {
            toast,
            title: "Erro ao salvar TAC",
            context: {
              path: tacRef.path,
              operation: "update",
              requestResourceData: dataToSave,
            },
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (user && auth?.currentUser) {
        const gate = await guardPortalPackageAction(auth, "create_module:tacs");
        if (!gate.ok) {
          toast({
            variant: "destructive",
            title: "Limite do plano",
            description: gate.message,
          });
          setLoading(false);
          return;
        }
      }

      const tacsCollectionRef = collection(firestore, "tacs");
      addDoc(tacsCollectionRef, dataToSave)
        .then(async (ref) => {
          try {
            await notifyProjectPortalUsers(
              firestore,
              values.projectId,
              {
                title: "Novo TAC cadastrado",
                description: `TAC ${values.processNumber} disponível em Documentos Ambientais.`,
                link: NOTIFICATION_LINKS.tacs,
                sourceType: NOTIFICATION_SOURCE.tac,
                sourceId: ref.id,
                actorRole: user?.role,
              },
              { excludeUserId: user?.uid },
            );
          } catch (e) {
            console.warn("[TAC] notificação:", e);
          }
          toast({
            title: "TAC criado!",
            description: `O TAC ${values.processNumber} foi adicionado com sucesso.`,
          });
          form.reset();
          onSuccess?.();
        })
        .catch((error) => {
          handleFirestoreFormError(error, {
            toast,
            title: "Erro ao salvar TAC",
            context: {
              path: tacsCollectionRef.path,
              operation: "create",
              requestResourceData: dataToSave,
            },
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  return (
    <>
      {!hideHeader && (
        <DialogHeader>
          <DialogTitle>
            {currentTac ? "Editar TAC" : "Adicionar Novo TAC"}
          </DialogTitle>
          <DialogDescription>
            {currentTac
              ? "Atualize os detalhes do Termo de Ajustamento de Conduta."
              : "Preencha os dados do TAC conforme GTAC/EcoSistemas MG."}
          </DialogDescription>
        </DialogHeader>
      )}
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                      {empreendedoresForSelect.map((emp) => (
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
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empreendimento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={!selectedEmpreendedorId || isLoadingProjects}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !selectedEmpreendedorId
                              ? "Selecione um empreendedor primeiro"
                              : "Selecione o empreendimento"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectsForSelect.map((proj) => (
                        <SelectItem key={proj.id} value={proj.id}>
                          {proj.propertyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gtacId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID do TAC (GTAC)</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="protocolNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Protocolo do Pedido</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="processNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº do Processo SEI</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 12345.000001/2024-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tacNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº / Identificador do TAC</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
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
                  <FormLabel>Unidade Administrativa / Órgão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: FEAM, SEMAD, SUPRAM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Assinatura</FormLabel>
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
                name="publicationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Publicação</FormLabel>
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
                  <FormLabel>Situação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a situação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tacStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
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
              name="licensingProcessBeforeTac"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processo de Licenciamento Anterior ao TAC</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Referência informativa (texto livre, sem vínculo com licença)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="licensingProcessAfterTac"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processo Formalizado Após Assinatura do TAC</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Referência informativa (texto livre)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição / Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Objeto do TAC e demais informações relevantes."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormLabel className="cursor-help">
                          Anexar Documento do TAC
                        </FormLabel>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Carregar PDF ou imagem</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <FormControl>
                    <Input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </FormControl>
                  <FormDescription>
                    Anexe o TAC assinado (PDF, JPG, PNG). Máx 10MB.
                  </FormDescription>
                  {(currentTac?.fileUrl || uploadedFileUrl) && (
                    <div className="mt-3">
                      <AttachmentPreviewSection
                        fileUrl={uploadedFileUrl || currentTac?.fileUrl || null}
                        sectionLabel={
                          uploadedFileUrl
                            ? "Pré-visualização do novo anexo"
                            : "Anexo atual"
                        }
                        zoomTitle="Anexo do TAC"
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
                </>
              ) : (
                "Salvar TAC"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
      <UploadPreparationDialog {...dialogProps} />
    </>
  );
}
