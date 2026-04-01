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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useToast } from "@/hooks/use-toast";
import type {
  InsignificantWaterUse,
  InsignificantWaterUseType,
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
} from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
      ["Válida", "Vencida", "Em Renovação", "Suspensa", "Cancelada"],
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type FormValues = z.infer<typeof formSchema>;

interface UsoInsignificanteFormProps {
  /** Obrigatório ao criar (vem do menu Adicionar Uso). Na edição vem de currentItem. */
  usoType?: InsignificantWaterUseType;
  currentItem?: InsignificantWaterUse | null;
  onSuccess?: () => void;
}

const permitStatuses: { value: PermitStatus; label: string }[] = [
  { value: "Válida", label: "Válida" },
  { value: "Vencida", label: "Vencida" },
  { value: "Em Renovação", label: "Em Renovação" },
  { value: "Suspensa", label: "Suspensa" },
  { value: "Cancelada", label: "Cancelada" },
];

export function UsoInsignificanteForm({
  usoType,
  currentItem,
  onSuccess,
}: UsoInsignificanteFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(
    currentItem?.fileUrl || null,
  );

  const { toast } = useToast();
  const { firestore } = useFirebase();

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
    defaultValues: { pontosDeMonitoramento: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pontosDeMonitoramento",
  });

  const monitoringTypeWatch = form.watch("monitoringType");

  React.useEffect(() => {
    const defaultValues: FormValues = {
      empreendedorId: currentItem?.empreendedorId || "",
      projectId: currentItem?.projectId || "",
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
  }, [currentItem, form]);

  const selectedEmpreendedorId = form.watch("empreendedorId");

  const filteredProjects = React.useMemo(() => {
    if (!selectedEmpreendedorId || !allProjects) return [];
    return allProjects.filter(
      (p) => p.empreendedorId === selectedEmpreendedorId,
    );
  }, [selectedEmpreendedorId, allProjects]);

  React.useEffect(() => {
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
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: `O arquivo não pode exceder ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
      });
      return;
    }
    // Permite selecionar o mesmo arquivo novamente.
    inputEl.value = "";

    setIsUploading(true);
    setUploadedFileUrl(null);
    try {
      // Option B (local API) apenas em desenvolvimento para evitar travas de Storage.
      if (process.env.NODE_ENV === "development") {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/uploads/usos-insignificantes", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || "Falha ao salvar arquivo.");
        }

        setUploadedFileUrl(data.url as string);
        toast({
          title: "Anexo carregado",
          description: "O arquivo está pronto para ser salvo.",
        });
      } else {
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `usos-insignificantes/${Date.now()}-${file.name}`,
        );
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        setUploadedFileUrl(downloadURL);
        toast({
          title: "Anexo carregado",
          description: "O arquivo está pronto para ser salvo.",
        });
      }
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

    if (!currentItem && !usoType) {
      toast({
        variant: "destructive",
        title: "Tipo de uso obrigatório",
        description: "Selecione novamente o tipo de uso no menu Adicionar Uso.",
      });
      setLoading(false);
      return;
    }

    const { file: _file, pontosDeMonitoramento, ...restBase } = values;
    const usoTypeResolved = currentItem?.usoType ?? usoType!;
    const limite = parseOptionalNumber(restBase.condicionanteFlowLimitM3sStr);
    const miraId = restBase.miraStationId?.trim() ?? "";

    const dataToSave: Record<string, unknown> = {
      empreendedorId: restBase.empreendedorId,
      projectId: restBase.projectId || "",
      permitNumber: restBase.permitNumber,
      processNumber: restBase.processNumber,
      usoType: usoTypeResolved,
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
      const docRef = doc(firestore, "usosInsignificantes", currentItem.id);
      updateDoc(docRef, dataToSave as DocumentData)
        .then(() => {
          toast({
            title: "Uso atualizado!",
            description: "Os dados do uso insignificante foram salvos.",
          });
          onSuccess?.();
        })
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: "update",
            requestResourceData: dataToSave,
          });
          errorEmitter.emit("permission-error", permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, "usosInsignificantes");
      addDoc(collectionRef, dataToSave as DocumentData)
        .then(() => {
          toast({
            title: "Uso cadastrado!",
            description: `Registro ${values.permitNumber} salvo com sucesso.`,
          });
          form.reset();
          onSuccess?.();
        })
        .catch(async () => {
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

  const DateInput = ({
    field,
    label,
    disabledFuture,
    disabledPast,
  }: {
    field: any;
    label: string;
    disabledFuture?: boolean;
    disabledPast?: boolean;
  }) => {
    const [inputValue, setInputValue] = React.useState(
      field.value ? format(field.value, "dd/MM/yyyy") : "",
    );

    React.useEffect(() => {
      if (
        field.value &&
        field.value instanceof Date &&
        !isNaN(field.value.getTime())
      ) {
        setInputValue(format(field.value, "dd/MM/yyyy"));
      } else if (!field.value) {
        setInputValue("");
      }
    }, [field.value]);

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
      if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5)}`;
      if (value.length > 10) value = value.slice(0, 10);
      setInputValue(value);

      if (value.length === 10) {
        const parsedDate = parse(value, "dd/MM/yyyy", new Date());
        if (!isNaN(parsedDate.getTime())) {
          field.onChange(parsedDate);
        } else {
          form.setError(field.name, {
            type: "manual",
            message: "Data inválida",
          });
        }
      }
    };

    const handleDateSelect = (date: Date | undefined) => {
      field.onChange(date);
      if (date) {
        setInputValue(format(date, "dd/MM/yyyy"));
      }
    };

    return (
      <FormItem className="flex flex-col">
        <FormLabel>{label}</FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <div className="relative">
              <FormControl>
                <Input
                  placeholder="DD/MM/AAAA"
                  value={inputValue}
                  onChange={handleDateInputChange}
                />
              </FormControl>
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={handleDateSelect}
              disabled={(date) =>
                (disabledFuture && date > new Date()) ||
                (disabledPast && date < new Date("1900-01-01")) ||
                false
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {currentItem
            ? "Editar uso insignificante"
            : usoType
              ? `Novo uso: ${usoType}`
              : "Novo uso insignificante"}
        </DialogTitle>
        <DialogDescription>
          {currentItem
            ? "Atualize os dados abaixo (mesmo padrão do cadastro de outorgas)."
            : "Preencha os dados do uso insignificante. O tipo foi definido pelo menu Adicionar Uso."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 -ml-1 space-y-4">
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
                      {filteredProjects?.map((proj) => (
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
                  <FormLabel>Nº portaria / documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Declaração / portaria nº 123" {...field} />
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
                  <DateInput
                    field={field}
                    label="Data de Emissão"
                    disabledFuture
                  />
                )}
              />
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <DateInput field={field} label="Data de Vencimento" />
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
                      placeholder="Descreva a finalidade do uso insignificante (volume, uso, local...)"
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
                    Opcional: onde este uso será acompanhado (manual ou
                    telemétrica), no mesmo espírito do cadastro de outorgas.
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
                    Mesmo padrão de outorgas: export MIRA-ready e condicionantes.
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
                  Para mapa em Telemétrico-Leitura e acompanhamento (análogo à
                  outorga).
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
                  Nenhum ponto cadastrado.
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
                          <Input placeholder="Ex.: Medição, bomba" {...field} />
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
                            field.onChange(v === "__none__" ? undefined : v)
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
                              <Input
                                placeholder="ID no gateway / Firebase"
                                {...field}
                              />
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
                            <FormLabel>Pulsos por litro</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex.: 450" {...field} />
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
                          Anexar documento
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
                    Anexe o documento do uso insignificante (PDF, JPG, PNG).
                    Máx 10MB.
                    {currentItem?.fileUrl && !uploadedFileUrl && (
                      <span className="block mt-2 text-xs">
                        Arquivo atual:{" "}
                        <a
                          href={currentItem.fileUrl}
                          target="_blank"
                          className="underline"
                          rel="noreferrer"
                        >
                          ver anexo
                        </a>
                      </span>
                    )}
                    {uploadedFileUrl && (
                      <span className="block mt-2 text-xs text-green-600">
                        Novo arquivo carregado:{" "}
                        <a
                          href={uploadedFileUrl}
                          target="_blank"
                          className="underline"
                          rel="noreferrer"
                        >
                          ver anexo
                        </a>
                      </span>
                    )}
                  </FormDescription>
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
                "Salvar uso"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
