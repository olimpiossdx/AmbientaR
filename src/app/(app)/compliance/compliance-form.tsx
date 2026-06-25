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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { BrDateFormControl } from "@/components/form/br-date-input";
import { useToast } from "@/hooks/use-toast";
import type {
  Condicionante,
  PermitStatus,
  Project,
  WaterPermit,
  EnvironmentalIntervention,
  License,
  Tac,
  Empreendedor} from "@/lib/types";
import {
  useFirebase,
  useCollection,
  useMemoFirebase} from "@/firebase";

import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { collection, doc, addDoc, updateDoc, limit, query } from "firebase/firestore";
import {
  getRecipientUserIdsFromCondicionanteReference,
  notifyPortalUsers} from "@/lib/notifications";
import { guardPortalPackageAction } from "@/lib/package-portal-guard";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription} from "@/components/ui/dialog";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  buildEmpreendedorSelectOptions,
  normalizeEntityId,
} from "@/lib/empreendedor-project-select";

const formSchema = z.object({
  referenceId: z.string().min(1, "Selecione um documento de referência."),
  referenceType: z.enum(["licenca", "outorga", "intervencao", "tac"]),
  description: z.string().min(1, "A descrição da condicionante é obrigatória."),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
  status: z.enum(
    ["Pendente", "Em execução", "Cumprida", "Atrasada", "Não Aplicável"],
    { required_error: "Selecione o status." },
  ),
  recurrence: z.enum(["Única", "Mensal", "Trimestral", "Semestral", "Anual"], {
    required_error: "Selecione a recorrência."})});
type FormValues = z.infer<typeof formSchema>;

interface ComplianceFormProps {
  currentItem?: Condicionante | null;
  referenceType: "licenca" | "outorga" | "intervencao" | "tac";
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
  onSuccess}: ComplianceFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = React.useState<string | null>(
    currentItem?.fileUrl || null,
  );
  const [filterEmpreendedorId, setFilterEmpreendedorId] = React.useState("");
  const { toast } = useToast();
  const { firestore, user: currentUser, auth } = useFirebase();
  const { uploadFile, dialogProps, limitLabel } = useStorageFileUpload({
    storageFolder: "condicionantes"});

  const empreendedoresQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, "empreendedores"), limit(200))
        : null,
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(
    () =>
      firestore && (referenceType === "licenca" || referenceType === "tac")
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

  const tacsQuery = useMemoFirebase(
    () =>
      firestore && referenceType === "tac"
        ? collection(firestore, "tacs")
        : null,
    [firestore, referenceType],
  );
  const { data: tacs, isLoading: isLoadingTacs } =
    useCollection<Tac>(tacsQuery);

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
      recurrence: currentItem?.recurrence || undefined}});

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
        recurrence: currentItem.recurrence});
      setUploadedFileUrl(currentItem.fileUrl || null);
    }
  }, [currentItem, referenceType, form]);

  React.useEffect(() => {
    if (!currentItem?.referenceId || filterEmpreendedorId) return;
    const refId = currentItem.referenceId;
    if (referenceType === "licenca") {
      const lic = licenses?.find((l) => l.id === refId);
      if (lic?.empreendedorId) {
        setFilterEmpreendedorId(normalizeEntityId(lic.empreendedorId));
      }
    } else if (referenceType === "tac") {
      const tac = tacs?.find((t) => t.id === refId);
      if (tac?.empreendedorId) {
        setFilterEmpreendedorId(normalizeEntityId(tac.empreendedorId));
      }
    } else if (referenceType === "outorga") {
      const out = outorgas?.find((o) => o.id === refId);
      if (out?.empreendedorId) {
        setFilterEmpreendedorId(normalizeEntityId(out.empreendedorId));
      }
    } else if (referenceType === "intervencao") {
      const intv = intervencoes?.find((i) => i.id === refId);
      if (intv?.empreendedorId) {
        setFilterEmpreendedorId(normalizeEntityId(intv.empreendedorId));
      }
    }
  }, [
    currentItem,
    referenceType,
    licenses,
    tacs,
    outorgas,
    intervencoes,
    filterEmpreendedorId,
  ]);

  React.useEffect(() => {
    if (!filterEmpreendedorId) return;
    const refId = form.getValues("referenceId");
    if (!refId) return;
    const stillValid = (() => {
      if (referenceType === "licenca") {
        return licenses?.some(
          (l) =>
            l.id === refId &&
            normalizeEntityId(l.empreendedorId) === filterEmpreendedorId,
        );
      }
      if (referenceType === "outorga") {
        return outorgas?.some(
          (o) =>
            o.id === refId &&
            normalizeEntityId(o.empreendedorId) === filterEmpreendedorId,
        );
      }
      if (referenceType === "tac") {
        return tacs?.some(
          (t) =>
            t.id === refId &&
            normalizeEntityId(t.empreendedorId) === filterEmpreendedorId,
        );
      }
      return intervencoes?.some(
        (i) =>
          i.id === refId &&
          normalizeEntityId(i.empreendedorId) === filterEmpreendedorId,
      );
    })();
    if (!stillValid) form.setValue("referenceId", "");
  }, [filterEmpreendedorId, referenceType, licenses, tacs, outorgas, intervencoes, form]);

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
        description: "O arquivo está pronto para ser salvo."});
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no Upload",
        description: "Não foi possível enviar o arquivo."});
    } finally {
      setIsUploading(false);
    }
  };

  const referenceItems = React.useMemo(() => {
    const matchesEmpreendedor = (empreendedorId?: string | null) => {
      if (!filterEmpreendedorId) return true;
      return normalizeEntityId(empreendedorId) === filterEmpreendedorId;
    };

    if (referenceType === "licenca") {
      const projectsMap = new Map(projects?.map((p) => [p.id, p]) ?? []);
      return (
        licenses
          ?.filter((l) => matchesEmpreendedor(l.empreendedorId))
          .map((l) => ({
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
            "Licença"})) ?? []
      );
    }
    if (referenceType === "outorga") {
      return (
        outorgas
          ?.filter((o) => matchesEmpreendedor(o.empreendedorId))
          .map((o) => ({
          id: o.id,
          name:
            [o.permitNumber, o.description].filter(Boolean).join(" - ") ||
            o.permitNumber ||
            o.id ||
            "Outorga"})) ?? []
      );
    }
    if (referenceType === "tac") {
      const projectsMap = new Map(projects?.map((p) => [p.id, p]) ?? []);
      return (
        tacs
          ?.filter((t) => matchesEmpreendedor(t.empreendedorId))
          .map((t) => ({
          id: t.id,
          name:
            [
              t.processNumber,
              t.tacNumber,
              projectsMap.get(t.projectId)?.propertyName,
            ]
              .filter(Boolean)
              .join(" — ") ||
            t.processNumber ||
            t.id ||
            "TAC"})) ?? []
      );
    }
    if (referenceType === "intervencao") {
      return (
        intervencoes
          ?.filter((i) => matchesEmpreendedor(i.empreendedorId))
          .map((i) => ({
          id: i.id,
          name:
            [i.processNumber, i.description].filter(Boolean).join(" - ") ||
            i.description ||
            i.id ||
            "Intervenção"})) ?? []
      );
    }
    return [];
  }, [referenceType, licenses, projects, tacs, outorgas, intervencoes, filterEmpreendedorId]);

  const empreendedoresForSelect = React.useMemo(
    () =>
      buildEmpreendedorSelectOptions({
        list: empreendedores,
        selectedId: filterEmpreendedorId,
      }),
    [empreendedores, filterEmpreendedorId],
  );

  const isLoadingReference =
    isLoadingLicenses ||
    isLoadingProjects ||
    isLoadingTacs ||
    isLoadingOutorgas ||
    isLoadingIntervencoes ||
    isLoadingEmpreendedores;

  const getReferenceLabel = () => {
    switch (referenceType) {
      case "licenca":
        return "Licença de Referência";
      case "tac":
        return "TAC de Referência";
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
      ...(currentItem ? {} : { createdAt: new Date().toISOString() })};

    if (currentItem) {
      const docRef = doc(firestore, "condicionantes", currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(async () => {
          toast({
            title: "Condicionante atualizada!",
            description:
              "As informações da condicionante foram salvas com sucesso."});
          const refType = (values.referenceType || referenceType) as
            | "licenca"
            | "outorga"
            | "intervencao"
            | "tac";
          const recipients = await getRecipientUserIdsFromCondicionanteReference(
            firestore,
            refType,
            values.referenceId,
          );
          await notifyPortalUsers(
            firestore,
            recipients,
            {
              title: "Condicionante atualizada",
              description: `Uma condicionante foi atualizada. Acesse Condicionantes para ver os detalhes.`,
              link: "/compliance",
              sourceType: "condicionante",
              sourceId: currentItem.id,
              actorRole: currentUser?.role},
            { excludeUserId: currentUser?.uid },
          );
          onSuccess?.();
        })
        .catch((error) => {
          handleFirestoreFormError(error, {
            toast,
            title: 'Erro ao salvar conformidade',
            context: {
            path: docRef.path,
            operation: "update",
            requestResourceData: dataToSave}});
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (currentUser && auth?.currentUser) {
        const gate = await guardPortalPackageAction(
          auth,
          "create_module:condicionantes",
        );
        if (!gate.ok) {
          toast({
            variant: "destructive",
            title: "Limite do plano",
            description: gate.message});
          setLoading(false);
          return;
        }
      }
      const collectionRef = collection(firestore, "condicionantes");
      addDoc(collectionRef, dataToSave)
        .then(async (ref) => {
          toast({
            title: "Condicionante criada!",
            description: `A condicionante foi adicionada com sucesso.`});
          const refType = (values.referenceType || referenceType) as
            | "licenca"
            | "outorga"
            | "intervencao"
            | "tac";
          const recipients = await getRecipientUserIdsFromCondicionanteReference(
            firestore,
            refType,
            values.referenceId,
          );
          await notifyPortalUsers(
            firestore,
            recipients,
            {
              title: "Nova condicionante lançada",
              description: `Uma nova condicionante foi cadastrada. Acesse Condicionantes para acompanhar.`,
              link: "/compliance",
              sourceType: "condicionante",
              sourceId: ref.id,
              actorRole: currentUser?.role},
            { excludeUserId: currentUser?.uid },
          );
          form.reset();
          onSuccess?.();
        })
        .catch((error) => {
          handleFirestoreFormError(error, {
            toast,
            title: 'Erro ao salvar conformidade',
            context: {
            path: collectionRef.path,
            operation: "create",
            requestResourceData: dataToSave}});
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
          <div className="form-scroll-body space-y-4">
            <FormItem>
              <FormLabel>Empreendedor</FormLabel>
              <Select
                value={filterEmpreendedorId || undefined}
                onValueChange={(value) => {
                  setFilterEmpreendedorId(value);
                  form.setValue("referenceId", "");
                }}
                disabled={isLoadingEmpreendedores}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingEmpreendedores
                          ? "Carregando..."
                          : "Selecione o empreendedor primeiro"
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
              <FormDescription>
                Somente documentos deste empreendedor aparecerão na lista abaixo.
              </FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="referenceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getReferenceLabel()}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={isLoadingReference || !filterEmpreendedorId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !filterEmpreendedorId
                              ? "Selecione um empreendedor primeiro"
                              : isLoadingReference
                                ? "Carregando..."
                                : referenceItems.length === 0
                                  ? "Nenhum documento para este empreendedor"
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
