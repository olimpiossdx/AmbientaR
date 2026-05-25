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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { BrDateFormControl } from "@/components/form/br-date-input";
import { useToast } from "@/hooks/use-toast";
import type {
  License,
  PermitType,
  PermitStatus,
  Empreendedor,
  Project,
} from "@/lib/types";
import {
  useFirebase,
  errorEmitter,
  useCollection,
  useMemoFirebase,
  useDoc,
} from "@/firebase";
import type { AppUser } from "@/lib/types";
import { guardPortalPackageAction } from "@/lib/package-portal-guard";
import { assertFileAllowedForPackage } from "@/lib/storage-upload";
import { FirestorePermissionError } from "@/firebase/errors";
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
import { Label } from "@/components/ui/label";
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
    permitType: z.enum(["LP", "LI", "LO", "LAS", "AAF", "Outra"], {
      required_error: "Selecione o tipo de licença.",
    }),
    processNumber: z.string().min(1, "O número do processo é obrigatório."),
    permitNumber: z.string().min(1, "O número da licença é obrigatório."),
    issuingBody: z.string().min(1, "O órgão emissor é obrigatório."),
    issueDate: z.date({ required_error: "A data de emissão é obrigatória." }),
    expirationDate: z.date({
      required_error: "A data de vencimento é obrigatória.",
    }),
    status: z.enum(
      [
        "Válida",
        "Vencida",
        "Em Renovação",
        "Suspensa",
        "Cancelada",
        "Em Andamento",
      ],
      { required_error: "Selecione o status." },
    ),
    description: z.string().optional(),
    file: z
      .any()
      .optional()
      .refine(
        (files) =>
          !files || files.length === 0 || files?.[0]?.size <= UPLOAD_RAW_FILE_SAFETY_MAX,
        "Arquivo excede o limite de processamento no navegador.",
      ),
  })
  .refine((data) => data.expirationDate > data.issueDate, {
    message: "A data de vencimento deve ser posterior à data de emissão.",
    path: ["expirationDate"],
  });

type LicenseFormValues = z.infer<typeof formSchema>;

interface LicenseFormProps {
  currentLicense?: License | null;
  onSuccess?: () => void;
  /** Quando true, esconde o cabeçalho interno (para uso em páginas já com título/card). */
  hideHeader?: boolean;
}

const permitTypes: { value: PermitType; label: string }[] = [
  { value: "LP", label: "LP - Licença Prévia" },
  { value: "LI", label: "LI - Licença de Instalação" },
  { value: "LO", label: "LO - Licença de Operação" },
  { value: "LAS", label: "LAS - Licença Ambiental Simplificada" },
  { value: "AAF", label: "AAF - Autorização Ambiental de Funcionamento" },
  { value: "Outra", label: "Outra" },
];

const permitStatuses: { value: PermitStatus; label: string }[] = [
  { value: "Válida", label: "Válida" },
  { value: "Vencida", label: "Vencida" },
  { value: "Em Renovação", label: "Em Renovação" },
  { value: "Suspensa", label: "Suspensa" },
  { value: "Cancelada", label: "Cancelada" },
  { value: "Em Andamento", label: "Em Andamento" },
];

export function LicenseForm({
  currentLicense,
  onSuccess,
  hideHeader,
}: LicenseFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(
    currentLicense?.fileUrl || null,
  );

  const { toast } = useToast();
  const { uploadFile, dialogProps, limitLabel } = useStorageFileUpload({
    storageFolder: "licenses",
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

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const isHydratingFormRef = React.useRef(false);

  React.useEffect(() => {
    if (!currentLicense) return;
    isHydratingFormRef.current = true;
    const defaultValues: Partial<LicenseFormValues> = {
      empreendedorId: normalizeEntityId(currentLicense.empreendedorId),
      projectId: normalizeEntityId(currentLicense.projectId),
      permitType: currentLicense.permitType,
      processNumber: currentLicense.processNumber || "",
      permitNumber: currentLicense.permitNumber || "",
      issuingBody: currentLicense.issuingBody || "",
      issueDate: currentLicense.issueDate
        ? new Date(currentLicense.issueDate)
        : undefined,
      expirationDate: currentLicense.expirationDate
        ? new Date(currentLicense.expirationDate)
        : undefined,
      status: currentLicense.status,
      description: currentLicense.description || "",
    };
    form.reset(defaultValues);
    setUploadedFileUrl(currentLicense.fileUrl || null);
    queueMicrotask(() => {
      isHydratingFormRef.current = false;
    });
  }, [currentLicense, form]);

  const selectedEmpreendedorId = form.watch("empreendedorId");
  const selectedProjectId = form.watch("projectId");

  const linkedEmpreendedorRef = useMemoFirebase(
    () =>
      firestore && currentLicense?.empreendedorId
        ? doc(
            firestore,
            "empreendedores",
            normalizeEntityId(currentLicense.empreendedorId),
          )
        : null,
    [firestore, currentLicense?.empreendedorId],
  );
  const { data: linkedEmpreendedor } = useDoc<Empreendedor>(linkedEmpreendedorRef);

  const linkedProjectRef = useMemoFirebase(
    () =>
      firestore && currentLicense?.projectId
        ? doc(firestore, "projects", normalizeEntityId(currentLicense.projectId))
        : null,
    [firestore, currentLicense?.projectId],
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
    // Capture o input e o arquivo agora; evitar depender de `event` após `await`.
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;

    // Permite selecionar o mesmo arquivo novamente.
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

  async function onSubmit(values: LicenseFormValues) {
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
      expirationDate: values.expirationDate.toISOString(),
      fileUrl: uploadedFileUrl || currentLicense?.fileUrl || "",
    };

    if (currentLicense) {
      const licenseRef = doc(firestore, "licenses", currentLicense.id);
      updateDoc(licenseRef, dataToSave)
        .then(() => {
          toast({
            title: "Licença atualizada!",
            description: "As informações da licença foram salvas com sucesso.",
          });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: licenseRef.path,
            operation: "update",
            requestResourceData: dataToSave,
          });
          errorEmitter.emit("permission-error", permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (user && auth?.currentUser) {
        const gate = await guardPortalPackageAction(
          auth,
          "create_module:licenses",
        );
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

      const licensesCollectionRef = collection(firestore, "licenses");
      addDoc(licensesCollectionRef, dataToSave)
        .then(async (ref) => {
          try {
            await notifyProjectPortalUsers(
              firestore,
              values.projectId,
              {
                title: "Nova licença ambiental",
                description: `Licença ${values.permitNumber} disponível em Documentos Ambientais.`,
                link: NOTIFICATION_LINKS.licenses,
                sourceType: NOTIFICATION_SOURCE.licenca,
                sourceId: ref.id,
                actorRole: user?.role,
              },
              { excludeUserId: user?.uid },
            );
          } catch (e) {
            console.warn("[Licença] notificação:", e);
          }
          toast({
            title: "Licença criada!",
            description: `A licença ${values.permitNumber} foi adicionada com sucesso.`,
          });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: licensesCollectionRef.path,
            operation: "create",
            requestResourceData: dataToSave,
          });
          errorEmitter.emit("permission-error", permissionError);
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
            {currentLicense ? "Editar Licença" : "Adicionar Nova Licença"}
          </DialogTitle>
          <DialogDescription>
            {currentLicense
              ? "Atualize os detalhes da licença abaixo."
              : "Preencha os detalhes para criar uma nova licença."}
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
            <FormField
              control={form.control}
              name="permitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Licença</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo (LP, LI, LO...)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {permitTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
                    <Input
                      placeholder="Ex: SEMAD, SUPRAM Sul de Minas"
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status atual" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {permitStatuses.map((status) => (
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição / Objeto da Licença</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o objeto da licença e outras informações relevantes."
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
              render={({ field }) => (
                <FormItem>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormLabel className="cursor-help">
                          Anexar Documento da Licença
                        </FormLabel>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Carregar</p>
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
                    Anexe a licença ou documento relacionado (PDF, JPG, PNG).
                    Máx 10MB.
                  </FormDescription>
                  {(currentLicense?.fileUrl || uploadedFileUrl) && (
                    <div className="mt-3">
                      <AttachmentPreviewSection
                        fileUrl={uploadedFileUrl || currentLicense?.fileUrl || null}
                        sectionLabel={
                          uploadedFileUrl
                            ? "Pré-visualização do novo anexo"
                            : "Anexo atual"
                        }
                        zoomTitle="Anexo da licença"
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Carregando...
                </>
              ) : (
                "Salvar Licença"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
      <UploadPreparationDialog {...dialogProps} />
    </>
  );
}
