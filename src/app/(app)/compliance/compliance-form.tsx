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
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useToast } from "@/hooks/use-toast";
import type {
  Condicionante,
  PermitStatus,
  Project,
  WaterPermit,
  EnvironmentalIntervention,
  License,
} from "@/lib/types";
import {
  useFirebase,
  errorEmitter,
  useCollection,
  useMemoFirebase,
} from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { collection, doc, addDoc, updateDoc } from "firebase/firestore";
import {
  createNotificationForUser,
  getUserIdFromCondicionanteReference,
} from "@/lib/notifications";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  referenceId: z.string().min(1, "Selecione um documento de referência."),
  referenceType: z.enum(["licenca", "outorga", "intervencao"]),
  description: z.string().min(1, "A descrição da condicionante é obrigatória."),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
  status: z.enum(
    ["Pendente", "Em execução", "Cumprida", "Atrasada", "Não Aplicável"],
    { required_error: "Selecione o status." },
  ),
  recurrence: z.enum(["Única", "Mensal", "Trimestral", "Semestral", "Anual"], {
    required_error: "Selecione a recorrência.",
  }),
});
type FormValues = z.infer<typeof formSchema>;

interface ComplianceFormProps {
  currentItem?: Condicionante | null;
  referenceType: "licenca" | "outorga" | "intervencao";
  onSuccess?: () => void;
}

const statuses: { value: Condicionante["status"]; label: string }[] = [
  { value: "Pendente", label: "Pendente" },
  { value: "Em execução", label: "Em execução" },
  { value: "Cumprida", label: "Cumprida" },
  { value: "Atrasada", label: "Atrasada" },
  { value: "Não Aplicável", label: "Não Aplicável" },
];

const recurrences: { value: Condicionante["recurrence"]; label: string }[] = [
  { value: "Única", label: "Única" },
  { value: "Mensal", label: "Mensal" },
  { value: "Trimestral", label: "Trimestral" },
  { value: "Semestral", label: "Semestral" },
  { value: "Anual", label: "Anual" },
];

export function ComplianceForm({
  currentItem,
  referenceType,
  onSuccess,
}: ComplianceFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(
    currentItem?.fileUrl || null,
  );
  const [isDueDateOpen, setIsDueDateOpen] = React.useState(false);
  const { toast } = useToast();
  const { firestore, user: currentUser } = useFirebase();
  const { uploadFile, dialogProps, limitLabel } = useStorageFileUpload({
    storageFolder: "condicionantes",
  });

  const projectsQuery = useMemoFirebase(
    () =>
      firestore && referenceType === "licenca"
        ? collection(firestore, "projects")
        : null,
    [firestore, referenceType],
  );
  const { data: projects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const licensesQuery = useMemoFirebase(
    () =>
      firestore && referenceType === "licenca"
        ? collection(firestore, "licenses")
        : null,
    [firestore, referenceType],
  );
  const { data: licenses, isLoading: isLoadingLicenses } =
    useCollection<License>(licensesQuery);

  const outorgasQuery = useMemoFirebase(
    () =>
      firestore && referenceType === "outorga"
        ? collection(firestore, "outorgas")
        : null,
    [firestore, referenceType],
  );
  const { data: outorgas, isLoading: isLoadingOutorgas } =
    useCollection<WaterPermit>(outorgasQuery);

  const intervencoesQuery = useMemoFirebase(
    () =>
      firestore && referenceType === "intervencao"
        ? collection(firestore, "intervencoes")
        : null,
    [firestore, referenceType],
  );
  const { data: intervencoes, isLoading: isLoadingIntervencoes } =
    useCollection<EnvironmentalIntervention>(intervencoesQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referenceId: currentItem?.referenceId || "",
      referenceType: currentItem?.referenceType || referenceType,
      description: currentItem?.description || "",
      dueDate: currentItem?.dueDate ? new Date(currentItem.dueDate) : undefined,
      status: currentItem?.status || undefined,
      recurrence: currentItem?.recurrence || undefined,
    },
  });

  // Update referenceType when it changes from props
  React.useEffect(() => {
    form.setValue("referenceType", referenceType);
  }, [referenceType, form]);

  React.useEffect(() => {
    if (currentItem) {
      form.reset({
        referenceId: currentItem.referenceId,
        referenceType: currentItem.referenceType || referenceType,
        description: currentItem.description,
        dueDate: currentItem.dueDate
          ? new Date(currentItem.dueDate)
          : undefined,
        status: currentItem.status,
        recurrence: currentItem.recurrence,
      });
      setUploadedFileUrl(currentItem.fileUrl || null);
    }
  }, [currentItem, referenceType, form]);

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
      const downloadURL = await uploadFile(file);
      if (!downloadURL) return;
      setUploadedFileUrl(downloadURL);
      toast({
        title: "Anexo carregado",
        description: "O arquivo está pronto para ser salvo.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no Upload",
        description: "Não foi possível enviar o arquivo.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const referenceItems = React.useMemo(() => {
    if (referenceType === "licenca") {
      const projectsMap = new Map(projects?.map((p) => [p.id, p]) ?? []);
      return (
        licenses?.map((l) => ({
          id: l.id,
          name:
            [
              l.processNumber,
              l.permitNumber,
              projectsMap.get(l.projectId)?.propertyName,
            ]
              .filter(Boolean)
              .join(" — ") ||
            l.processNumber ||
            l.id ||
            "Licença",
        })) ?? []
      );
    }
    if (referenceType === "outorga") {
      return (
        outorgas?.map((o) => ({
          id: o.id,
          name:
            [o.permitNumber, o.description].filter(Boolean).join(" - ") ||
            o.permitNumber ||
            o.id ||
            "Outorga",
        })) ?? []
      );
    }
    if (referenceType === "intervencao") {
      return (
        intervencoes?.map((i) => ({
          id: i.id,
          name:
            [i.processNumber, i.description].filter(Boolean).join(" - ") ||
            i.description ||
            i.id ||
            "Intervenção",
        })) ?? []
      );
    }
    return [];
  }, [referenceType, licenses, projects, outorgas, intervencoes]);

  const isLoadingReference =
    isLoadingLicenses ||
    isLoadingProjects ||
    isLoadingOutorgas ||
    isLoadingIntervencoes;

  const getReferenceLabel = () => {
    switch (referenceType) {
      case "licenca":
        return "Licença de Referência";
      case "outorga":
        return "Outorga de Referência";
      case "intervencao":
        return "Intervenção de Referência";
      default:
        return "Documento de Referência";
    }
  };

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: "destructive", title: "Firebase não inicializado." });
      setLoading(false);
      return;
    }

    const dataToSave = {
      ...values,
      referenceType: values.referenceType || referenceType,
      referenceId: values.referenceId,
      dueDate: values.dueDate.toISOString(),
      fileUrl: uploadedFileUrl || currentItem?.fileUrl || "",
      ...(currentItem ? {} : { createdAt: new Date().toISOString() }),
    };

    if (currentItem) {
      const docRef = doc(firestore, "condicionantes", currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(async () => {
          toast({
            title: "Condicionante atualizada!",
            description:
              "As informações da condicionante foram salvas com sucesso.",
          });
          const refType = (values.referenceType || referenceType) as
            | "licenca"
            | "outorga"
            | "intervencao";
          const targetUserId = await getUserIdFromCondicionanteReference(
            firestore,
            refType,
            values.referenceId,
          );
          if (targetUserId && targetUserId !== currentUser?.uid) {
            await createNotificationForUser(firestore, targetUserId, {
              title: "Condicionante atualizada",
              description: `Uma condicionante foi atualizada. Acesse Condicionantes para ver os detalhes.`,
              link: "/compliance",
              sourceType: "condicionante",
              sourceId: currentItem.id,
              actorRole: currentUser?.role,
            });
          }
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
        .finally(() => {
          setLoading(false);
        });
    } else {
      const collectionRef = collection(firestore, "condicionantes");
      addDoc(collectionRef, dataToSave)
        .then(async (ref) => {
          toast({
            title: "Condicionante criada!",
            description: `A condicionante foi adicionada com sucesso.`,
          });
          const refType = (values.referenceType || referenceType) as
            | "licenca"
            | "outorga"
            | "intervencao";
          const targetUserId = await getUserIdFromCondicionanteReference(
            firestore,
            refType,
            values.referenceId,
          );
          if (targetUserId && targetUserId !== currentUser?.uid) {
            await createNotificationForUser(firestore, targetUserId, {
              title: "Nova condicionante lançada",
              description: `Uma nova condicionante foi cadastrada. Acesse Condicionantes para acompanhar.`,
              link: "/compliance",
              sourceType: "condicionante",
              sourceId: ref.id,
              actorRole: currentUser?.role,
            });
          }
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
        .finally(() => {
          setLoading(false);
        });
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {currentItem
            ? "Editar Condicionante"
            : "Adicionar Nova Condicionante"}
        </DialogTitle>
        <DialogDescription>
          {currentItem
            ? "Atualize os detalhes da condicionante abaixo."
            : "Preencha os detalhes para criar uma nova condicionante."}
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
              name="referenceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getReferenceLabel()}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={isLoadingReference}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingReference
                              ? "Carregando..."
                              : "Selecione um documento"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {referenceItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
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
                  <FormLabel>Descrição da Condicionante</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a condicionante..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Vencimento</FormLabel>
                  <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          if (date) {
                            setIsDueDateOpen(false);
                          }
                        }}
                        defaultMonth={field.value ?? new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status atual" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((s) => (
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
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recorrência</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a recorrência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recurrences.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FormLabel className="cursor-help">
                      Anexar documento (opcional)
                    </FormLabel>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Carregar / Fazer download</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <FormDescription>
                Anexe comprovante ou documento relacionado à condicionante (PDF,
                JPG, PNG). Limite após otimização: {limitLabel}.
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
                    zoomTitle="Anexo da condicionante"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || isUploading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                "Salvar Condicionante"
              )}
            </Button>
          </DialogFooter>
        </form>
      <UploadPreparationDialog {...dialogProps} />
      </Form>
    </>
  );
}
