"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { BrDateFormControl } from "@/components/form/br-date-input";

import { useToast } from "@/hooks/use-toast";
import type {
  WaterPermit,
  PermitStatus,
  Empreendedor,
  Project,
} from "@/lib/types";
import {
  pontoMonitoramentoFormSchema,
  mapPontosFromFirestore,
  formPontosToFirestore,
  emptyMonitoringPontoFormRow,
  parseOptionalNumber,
} from "@/lib/monitoring-pontos-form";
import {
  useFirebase,
  errorEmitter,
  useCollection,
  useMemoFirebase,
  useDoc,
} from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import { UPLOAD_RAW_FILE_SAFETY_MAX } from "@/lib/upload-limits";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyEmpreendedorPortalUsers } from "@/lib/notifications";
import { guardPortalPackageAction } from "@/lib/package-portal-guard";
import {
  buildEmpreendedorSelectOptions,
  buildProjectSelectOptions,
  normalizeEntityId,
} from "@/lib/empreendedor-project-select";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteField,
  type DocumentData,
} from "firebase/firestore";
import {
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const formSchema = z
  .object({
    empreendedorId: z.string().min(1, "Selecione um empreendedor."),
    projectId: z.string().optional(),
    permitNumber: z.string().min(1, "O número da portaria é obrigatório."),
    processNumber: z.string().min(1, "O número do processo é obrigatório."),
    issueDate: z.date({ required_error: "A data de emissão é obrigatória." }),
    expirationDate: z.date({
      required_error: "A data de vencimento é obrigatória.",
    }),
    status: z.enum(
      ["Válida", "Vencida", "Em Renovação", "Suspensa", "Cancelada", "Em Andamento"],
      { required_error: "Selecione o status." },
    ),
    description: z.string().min(1, "A finalidade é obrigatória."),
    monitoringType: z.enum(["manual", "telemetric"]).optional(),
    miraStationId: z.string().optional(),
    condicionanteFlowLimitM3sStr: z.string().optional(),
    pontosDeMonitoramento: z
      .array(pontoMonitoramentoFormSchema)
      .default([]),
    file: z.any().optional(),
  })
  .refine((data) => data.expirationDate > data.issueDate, {
    message: "A data de vencimento deve ser posterior à data de emissão.",
    path: ["expirationDate"],
  });

type FormValues = z.infer<typeof formSchema>;

interface OutorgaFormProps {
  currentItem?: WaterPermit | null;
  onSuccess?: () => void;
}

const permitStatuses: { value: PermitStatus; label: string }[] = [
  { value: "Válida", label: "Válida" },
  { value: "Vencida", label: "Vencida" },
  { value: "Em Renovação", label: "Em Renovação" },
  { value: "Suspensa", label: "Suspensa" },
  { value: "Cancelada", label: "Cancelada" },
  { value: "Em Andamento", label: "Em Andamento" },
];

export function OutorgaForm({ currentItem, onSuccess }: OutorgaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(
    currentItem?.fileUrl || null,
  );

  const { toast } = useToast();
    const { uploadFile, dialogProps, limitLabel } = useStorageFileUpload({
    storageFolder: "outorgas",
  });
  const { firestore, user, auth } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );
  const { data: allProjects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pontosDeMonitoramento: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pontosDeMonitoramento",
  });

  const monitoringTypeWatch = form.watch("monitoringType");
  const isHydratingFormRef = React.useRef(false);
  const previousEmpreendedorIdRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    isHydratingFormRef.current = true;
    const defaultValues: Partial<FormValues> = {
      empreendedorId: normalizeEntityId(currentItem?.empreendedorId),
      projectId: normalizeEntityId(currentItem?.projectId),
      permitNumber: currentItem?.permitNumber || "",
      processNumber: currentItem?.processNumber || "",
      issueDate: currentItem ? new Date(currentItem.issueDate) : undefined,
      expirationDate: currentItem
        ? new Date(currentItem.expirationDate)
        : undefined,
      status: currentItem?.status,
      description: currentItem?.description || "",
      monitoringType: (currentItem?.monitoringType ?? "manual") as
        | "manual"
        | "telemetric",
      miraStationId: currentItem?.miraStationId ?? "",
      condicionanteFlowLimitM3sStr:
        currentItem?.condicionanteFlowLimitM3s != null
          ? String(currentItem.condicionanteFlowLimitM3s)
          : "",
      pontosDeMonitoramento: mapPontosFromFirestore(
        currentItem?.pontosDeMonitoramento,
      ),
      file: undefined,
    };
    form.reset(defaultValues);
    setUploadedFileUrl(currentItem?.fileUrl || null);
    previousEmpreendedorIdRef.current = defaultValues.empreendedorId || "";
    queueMicrotask(() => {
      isHydratingFormRef.current = false;
    });
  }, [currentItem, form]);

  const selectedEmpreendedorId = form.watch("empreendedorId");
  const selectedProjectId = form.watch("projectId");

  const linkedEmpreendedorRef = useMemoFirebase(
    () =>
      firestore && currentItem?.empreendedorId
        ? doc(
            firestore,
            "empreendedores",
            normalizeEntityId(currentItem.empreendedorId),
          )
        : null,
    [firestore, currentItem?.empreendedorId],
  );
  const { data: linkedEmpreendedor } = useDoc<Empreendedor>(linkedEmpreendedorRef);

  const linkedProjectRef = useMemoFirebase(
    () =>
      firestore && currentItem?.projectId
        ? doc(firestore, "projects", normalizeEntityId(currentItem.projectId))
        : null,
    [firestore, currentItem?.projectId],
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
    const previous = previousEmpreendedorIdRef.current;
    previousEmpreendedorIdRef.current = selectedEmpreendedorId;
    if (isHydratingFormRef.current) return;
    if (previous && selectedEmpreendedorId && previous !== selectedEmpreendedorId) {
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

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: "destructive", title: "Firebase não inicializado." });
      setLoading(false);
      return;
    }

    const { file: _file, pontosDeMonitoramento, ...restBase } = values;
    const limite = parseOptionalNumber(restBase.condicionanteFlowLimitM3sStr);
    const miraId = restBase.miraStationId?.trim() ?? "";

    const dataToSave: Record<string, unknown> = {
      empreendedorId: restBase.empreendedorId,
      projectId: restBase.projectId || "",
      permitNumber: restBase.permitNumber,
      processNumber: restBase.processNumber,
      issueDate: values.issueDate.toISOString(),
      expirationDate: values.expirationDate.toISOString(),
      status: restBase.status,
      description: restBase.description,
      fileUrl: uploadedFileUrl || currentItem?.fileUrl || "",
      monitoringType: values.monitoringType ?? "manual",
      pontosDeMonitoramento: formPontosToFirestore(pontosDeMonitoramento),
    };

    if (limite !== undefined) {
      dataToSave.condicionanteFlowLimitM3s = limite;
    } else if (currentItem) {
      dataToSave.condicionanteFlowLimitM3s = deleteField();
    }

    if (miraId) {
      dataToSave.miraStationId = miraId;
    } else if (currentItem) {
      dataToSave.miraStationId = deleteField();
    }

    if (currentItem) {
      const docRef = doc(firestore, "outorgas", currentItem.id);
      updateDoc(docRef, dataToSave as DocumentData)
        .then(() => {
          toast({
            title: "Outorga atualizada!",
            description: "As informações da outorga foram salvas com sucesso.",
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
      if (user && auth?.currentUser) {
        const gate = await guardPortalPackageAction(
          auth,
          "create_module:outorgas",
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
      const collectionRef = collection(firestore, "outorgas");
      addDoc(collectionRef, dataToSave as DocumentData)
        .then(async (ref) => {
          try {
            await notifyEmpreendedorPortalUsers(
              firestore,
              values.empreendedorId,
              {
                title: "Nova outorga cadastrada",
                description: `Outorga ${values.permitNumber} em Documentos Ambientais.`,
                link: NOTIFICATION_LINKS.outorgas,
                sourceType: NOTIFICATION_SOURCE.outorga,
                sourceId: ref.id,
                actorRole: user?.role,
              },
              { excludeUserId: user?.uid },
            );
          } catch (e) {
            console.warn("[Outorga] notificação:", e);
          }
          toast({
            title: "Outorga criada!",
            description: `A outorga ${values.permitNumber} foi adicionada com sucesso.`,
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
                  <FormLabel>Empreendimento (Opcional)</FormLabel>
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
              name="permitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Portaria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Portaria IGAM nº 123" {...field} />
                  </FormControl>
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
                    defaultValue={field.value}
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
                  <FormLabel>Finalidade</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a finalidade da outorga (e.g., Captação de água subterrânea, lançamento de efluentes...)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monitoringType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de leitura</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? "manual"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Manual ou Telemétrica" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">
                        Manual — lançamento no Manual-Lançamento
                      </SelectItem>
                      <SelectItem value="telemetric">
                        Telemétrica — leitura no Telemetrico-Leitura
                        (equipamentos/satélite)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define onde esta outorga será monitorada: lançamento manual
                    diário ou leitura telemétrica.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {monitoringTypeWatch === "telemetric" && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">
                    Telemetria / MIRA (IGAM-MG)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Identificadores para exportação MIRA-ready e conferência com
                    condicionantes. Ajuste colunas do CSV quando o manual oficial
                    for publicado.
                  </p>
                  <FormField
                    control={form.control}
                    name="miraStationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID estação MIRA (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Código fornecido pelo IGAM / sistema MIRA"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="condicionanteFlowLimitM3sStr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Limite de vazão condicionado (m³/s, opcional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex.: 0,012 (use ponto ou vírgula)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Referência para alertas e coluna do export; conforme
                          portaria.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <Separator />
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold">
                  Pontos de monitoramento
                </h4>
                <p className="text-xs text-muted-foreground">
                  Necessários para mapa em Telemétrico-Leitura e lançamentos no
                  monitoramento manual.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(emptyMonitoringPontoFormRow())}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar ponto
              </Button>
              {fields.length === 0 ? (
                <p className="text-xs text-muted-foreground border border-dashed rounded-md p-3">
                  Nenhum ponto cadastrado. Adicione ao menos um ponto (bomba ou
                  jusante) para usar o mapa e os relatórios.
                </p>
              ) : null}
              {fields.map((pontoField, index) => (
                <div
                  key={pontoField.id}
                  className="rounded-lg border p-3 space-y-3 bg-muted/20"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Ponto {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive shrink-0"
                      onClick={() => remove(index)}
                      aria-label={`Remover ponto ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`pontosDeMonitoramento.${index}.nome`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do ponto</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Bomba 1, Régua jusante" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`pontosDeMonitoramento.${index}.tipo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={(v) =>
                            field.onChange(
                              v === "__none__" ? undefined : v,
                            )
                          }
                          value={field.value ?? "__none__"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Bomba ou jusante" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">
                              Não informado
                            </SelectItem>
                            <SelectItem value="bomba">
                              Bomba / captação
                            </SelectItem>
                            <SelectItem value="jusante">
                              Monitoramento a jusante
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`pontosDeMonitoramento.${index}.latStr`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input placeholder="-19.9167" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`pontosDeMonitoramento.${index}.lngStr`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input placeholder="-43.9345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {monitoringTypeWatch === "telemetric" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-dashed">
                      <FormField
                        control={form.control}
                        name={`pontosDeMonitoramento.${index}.rtdbDeviceId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Device / estação (RTDB)</FormLabel>
                            <FormControl>
                              <Input placeholder="ID no gateway / Firebase" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`pontosDeMonitoramento.${index}.pulsesPerLiterStr`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pulsos por litro (calibração)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex.: 450 (YF-S201)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`pontosDeMonitoramento.${index}.internalDiameterMStr`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diâmetro interno tubo (m)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex.: 0,026" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`pontosDeMonitoramento.${index}.miraPointCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código ponto MIRA</FormLabel>
                            <FormControl>
                              <Input placeholder="Se aplicável" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormLabel className="cursor-help">
                          Anexar Documento da Outorga
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
                    Anexe a outorga ou documento relacionado (PDF, JPG, PNG).
                    Máx 10MB.
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
                        zoomTitle="Anexo da outorga"
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
                "Salvar Outorga"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
      <UploadPreparationDialog {...dialogProps} />
    </>
  );
}
