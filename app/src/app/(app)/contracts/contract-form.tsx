"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BrDateFormControl } from "@/components/form/br-date-input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  Contract,
  Client,
  EnvironmentalCompany,
  TechnicalResponsible,
  CommercialProposal,
  PlatformContractPublic,
} from "@/lib/types";
import {
  useFirebase,
  errorEmitter,
  useCollection,
  useMemoFirebase,
  useDoc,
} from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import { collection, doc, addDoc, updateDoc } from "firebase/firestore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { numberToWordsBRL } from "@/lib/utils";
import { persistContractPdfForSignature } from "@/lib/persist-contract-pdf";
import { useLocalBranding } from "@/hooks/use-local-branding";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyClientDocPortalUsers } from "@/lib/notifications";
import { PLATFORM_CONTRACT_PUBLIC_SETTING_ID } from "@/lib/platform-company";
import {
  fillEmptyContractPaymentBank,
  hasCompanyBankDetails,
  toContractPaymentBankFromCompany,
} from "@/lib/company-bank-payment";
import {
  buildContratadoFromCompany,
  buildResponsavelFromTechnical,
  formatResponsavelDomicilio,
  formatContratadaContractIntroParagraph,
  getContratadaMissingFields,
  isContratadaReadyForPdf,
  resolveContractActiveCompany,
} from "@/lib/contract-contratada-intro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  contratante: z.object({
    clientId: z.string().min(1, "Selecione um cliente."),
    nome: z.string().min(1, "Nome do contratante é obrigatório."),
    cpfCnpj: z.string().min(1, "CPF/CNPJ do contratante é obrigatório."),
    identidade: z.string().optional(),
    emissor: z.string().optional(),
    nacionalidade: z.string().optional(),
    estadoCivil: z.string().optional(),
    endereco: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cep: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional(),
  }),
  contratado: z.object({
    name: z.string().min(1, "Razão social é obrigatória"),
    address: z.string().optional(),
    cnpj: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional(),
  }),
  responsavelTecnico: z.object({
    responsibleId: z.string().min(1, "Selecione um responsável técnico."),
    name: z.string().min(1, "Nome do responsável é obrigatório."),
    profession: z.string().optional(),
    nacionalidade: z.string().optional(),
    estadoCivil: z.string().optional(),
    cpf: z.string().optional(),
    identidade: z.string().optional(),
    emissor: z.string().optional(),
    address: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional(),
    registrationNumber: z.string().optional(), // Adicionado
    art: z.string().optional(), // Adicionado
  }),
  objeto: z.object({
    empreendimento: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional(),
    servicos: z.string().min(1, "A descrição dos serviços é obrigatória"),
    itens: z
      .array(
        z.object({
          descricao: z.string(),
          valor: z.coerce.number(),
        }),
      )
      .optional(),
  }),
  pagamento: z.object({
    valorTotal: z.coerce.number().positive("O valor total deve ser positivo."),
    valorExtenso: z.string().min(1, "O valor por extenso é obrigatório."),
    forma: z.string().min(1, "A forma de pagamento é obrigatória."),
    banco: z.string().optional(),
    agencia: z.string().optional(),
    conta: z.string().optional(),
    pix: z.string().optional(),
  }),
  foro: z.object({
    comarca: z.string().min(1, "A comarca é obrigatória."),
    uf: z.string().min(2, "UF do foro é obrigatória.").max(2),
  }),
  dataContrato: z.string().transform((str) => new Date(str).toISOString()),
});

type FormValues = z.infer<typeof formSchema>;

interface ContractFormProps {
  currentItem?: Contract | null;
  onSuccess?: () => void;
  sourceProposal?: CommercialProposal | null;
}

const paymentMethods = [
  "Pix",
  "Deposito Bancário",
  "Boleto bancário",
  "Dinheiro",
  "Cheque",
  "Credito",
  "Debito",
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

export function ContractForm({ currentItem, onSuccess, sourceProposal }: ContractFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "clients") : null),
    [firestore],
  );
  const { data: clients, isLoading: isLoadingClients } =
    useCollection<Client>(clientsQuery);

  const companyProfileDocRef = useMemoFirebase(
    () =>
      firestore ? doc(firestore, "companySettings", "companyProfile") : null,
    [firestore],
  );
  const { data: companyProfile, isLoading: isLoadingCompanyProfile } =
    useDoc<Omit<EnvironmentalCompany, "id">>(companyProfileDocRef);

  const platformPublicDocRef = useMemoFirebase(
    () =>
      firestore
        ? doc(firestore, "companySettings", PLATFORM_CONTRACT_PUBLIC_SETTING_ID)
        : null,
    [firestore],
  );
  const { data: platformPublic } = useDoc<PlatformContractPublic>(
    platformPublicDocRef,
  );

  const activeCompanyDocRef = useMemoFirebase(() => {
    const id = platformPublic?.activeCompanyId;
    return id && firestore ? doc(firestore, "environmentalCompanies", id) : null;
  }, [firestore, platformPublic?.activeCompanyId]);
  const { data: activePlatformCompany } = useDoc<EnvironmentalCompany>(
    activeCompanyDocRef,
  );

  const responsiblesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "technicalResponsibles") : null),
    [firestore],
  );
  const { data: responsibles, isLoading: isLoadingResponsibles } =
    useCollection<TechnicalResponsible>(responsiblesQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem
      ? {
          ...currentItem,
          dataContrato: new Date(currentItem.dataContrato)
            .toISOString()
            .split("T")[0],
          contratante: currentItem.contratante,
          responsavelTecnico: currentItem.responsavelTecnico,
          contratado: currentItem.contratado,
        }
      : {
          contratante: { clientId: "" },
          responsavelTecnico: { responsibleId: "" },
          contratado: companyProfile || {},
          objeto: { servicos: "", itens: [{ descricao: "", valor: 0 }] },
          pagamento: { valorTotal: 0, valorExtenso: "", forma: "" },
          foro: { comarca: "Unaí", uf: "MG" },
          dataContrato: new Date().toISOString().split("T")[0],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "objeto.itens",
  });

  /**
   * Firestore não aceita campos com valor `undefined`.
   * Como o Zod marca alguns campos como opcionais, `react-hook-form` pode gerar `undefined`.
   * Antes de persistir, removemos chaves com `undefined` recursivamente.
   */
  const pruneUndefined = React.useCallback((value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(pruneUndefined);
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const cleaned: Record<string, unknown> = {};
      Object.entries(obj).forEach(([k, v]) => {
        if (v === undefined) return;
        cleaned[k] = pruneUndefined(v);
      });
      return cleaned;
    }
    return value;
  }, []);

  const selectedClientId = form.watch("contratante.clientId");
  const selectedResponsibleId = form.watch("responsavelTecnico.responsibleId");

  const watchedItems = useWatch({
    control: form.control,
    name: "objeto.itens",
  });

  const totalAmount = React.useMemo(() => {
    return (
      watchedItems?.reduce((acc, item) => acc + (Number(item.valor) || 0), 0) ||
      0
    );
  }, [watchedItems]);

  React.useEffect(() => {
    form.setValue("pagamento.valorTotal", totalAmount);
    form.setValue("pagamento.valorExtenso", numberToWordsBRL(totalAmount));
  }, [totalAmount, form]);

  React.useEffect(() => {
    if (selectedClientId && clients) {
      const client = clients.find((c) => c.id === selectedClientId);
      if (client) {
        form.setValue("contratante.nome", client.name);
        form.setValue("contratante.cpfCnpj", client.cpfCnpj || "");
        form.setValue("contratante.endereco", client.address || "");
        form.setValue("contratante.numero", client.numero || "");
        form.setValue("contratante.bairro", client.bairro || "");
        form.setValue("contratante.cep", client.cep || "");
        form.setValue("contratante.municipio", client.municipio || "");
        form.setValue("contratante.uf", client.uf || "");
        form.setValue("contratante.identidade", client.identidade || "");
        form.setValue("contratante.emissor", client.emissor || "");
        form.setValue(
          "contratante.nacionalidade",
          client.nacionalidade || "Brasileira",
        );
        form.setValue("contratante.estadoCivil", client.estadoCivil || "");
      }
    }
  }, [selectedClientId, clients, form]);

  const syncContratadaFromCadastro = React.useCallback(
    (opts?: { showToast?: boolean }) => {
      const company = resolveContractActiveCompany(
        activePlatformCompany,
        companyProfile,
        platformPublic,
      );
      const contratado = buildContratadoFromCompany(company);
      form.setValue("contratado.name", contratado.name);
      form.setValue("contratado.cnpj", contratado.cnpj || "");
      form.setValue("contratado.address", contratado.address || "");
      form.setValue("contratado.municipio", contratado.municipio || "");
      form.setValue("contratado.uf", contratado.uf || "");

      if (selectedResponsibleId && responsibles) {
        const rt = responsibles.find((r) => r.id === selectedResponsibleId);
        if (rt) {
          const snap = buildResponsavelFromTechnical(rt, selectedResponsibleId);
          form.setValue("responsavelTecnico.responsibleId", snap.responsibleId);
          form.setValue("responsavelTecnico.name", snap.name);
          form.setValue("responsavelTecnico.profession", snap.profession || "");
          form.setValue("responsavelTecnico.nacionalidade", snap.nacionalidade || "");
          form.setValue("responsavelTecnico.estadoCivil", snap.estadoCivil || "");
          form.setValue("responsavelTecnico.cpf", snap.cpf || "");
          form.setValue("responsavelTecnico.identidade", snap.identidade || "");
          form.setValue("responsavelTecnico.emissor", snap.emissor || "");
          form.setValue("responsavelTecnico.address", snap.address || "");
          form.setValue("responsavelTecnico.municipio", snap.municipio || "");
          form.setValue("responsavelTecnico.uf", snap.uf || "");
          form.setValue(
            "responsavelTecnico.registrationNumber",
            snap.registrationNumber || "",
          );
          form.setValue("responsavelTecnico.art", snap.art || "");
        }
      }

      if (opts?.showToast) {
        const missing = getContratadaMissingFields(
          form.getValues("contratado"),
          form.getValues("responsavelTecnico"),
        );
        if (missing.length === 0) {
          toast({
            title: "Dados da CONTRATADA atualizados",
            description: "Empresa principal e responsável técnico sincronizados com o cadastro.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Cadastro incompleto",
            description: `Complete em ${missing[0]?.where}: ${missing.map((m) => m.label).join(", ")}.`,
          });
        }
      }
    },
    [
      activePlatformCompany,
      companyProfile,
      platformPublic,
      responsibles,
      selectedResponsibleId,
      form,
      toast,
    ],
  );

  React.useEffect(() => {
    if (currentItem) return;
    if (!companyProfile && !platformPublic && !activePlatformCompany) return;
    syncContratadaFromCadastro();
  }, [
    currentItem,
    activePlatformCompany,
    companyProfile,
    platformPublic,
    syncContratadaFromCadastro,
  ]);

  React.useEffect(() => {
    if (!companyProfile && !platformPublic) return;

    const bankSource = hasCompanyBankDetails(companyProfile)
      ? companyProfile
      : hasCompanyBankDetails(activePlatformCompany)
        ? activePlatformCompany
        : hasCompanyBankDetails(platformPublic)
          ? platformPublic
          : null;
    if (!bankSource) return;

    fillEmptyContractPaymentBank(
      form.setValue,
      form.getValues,
      "pagamento",
      toContractPaymentBankFromCompany(bankSource),
    );
  }, [companyProfile, platformPublic, activePlatformCompany, form]);

  React.useEffect(() => {
    if (!selectedResponsibleId || !responsibles) return;
    const resp = responsibles.find((r) => r.id === selectedResponsibleId);
    if (!resp) return;
    const snap = buildResponsavelFromTechnical(resp, selectedResponsibleId);
    form.setValue("responsavelTecnico.name", snap.name);
    form.setValue("responsavelTecnico.cpf", snap.cpf || "");
    form.setValue("responsavelTecnico.profession", snap.profession || "");
    form.setValue("responsavelTecnico.identidade", snap.identidade || "");
    form.setValue("responsavelTecnico.emissor", snap.emissor || "");
    form.setValue("responsavelTecnico.nacionalidade", snap.nacionalidade || "");
    form.setValue("responsavelTecnico.estadoCivil", snap.estadoCivil || "");
    form.setValue("responsavelTecnico.address", snap.address || "");
    form.setValue("responsavelTecnico.municipio", snap.municipio || "");
    form.setValue("responsavelTecnico.uf", snap.uf || "");
    form.setValue(
      "responsavelTecnico.registrationNumber",
      snap.registrationNumber || "",
    );
    form.setValue("responsavelTecnico.art", snap.art || "");
  }, [selectedResponsibleId, responsibles, form]);

  const watchedContratado = useWatch({ control: form.control, name: "contratado" });
  const watchedResponsavel = useWatch({
    control: form.control,
    name: "responsavelTecnico",
  });
  const contratadaPreview = React.useMemo(
    () =>
      formatContratadaContractIntroParagraph(watchedContratado, watchedResponsavel),
    [watchedContratado, watchedResponsavel],
  );
  const contratadaMissing = React.useMemo(
    () => getContratadaMissingFields(watchedContratado, watchedResponsavel),
    [watchedContratado, watchedResponsavel],
  );

  React.useEffect(() => {
    if (!sourceProposal || currentItem) return;
    form.setValue("contratante.clientId", sourceProposal.clientId);
    form.setValue("objeto.empreendimento", sourceProposal.empreendimento || "");
    form.setValue(
      "objeto.servicos",
      sourceProposal.items?.map((i) => i.description).join("\n") ||
        "Serviços originados da proposta comercial aceita.",
    );
    form.setValue(
      "objeto.itens",
      (sourceProposal.items || []).map((i) => ({
        descricao: i.description || "",
        valor: Number(i.value) || 0,
      })),
    );
    form.setValue("pagamento.forma", sourceProposal.paymentTerms || "");
  }, [sourceProposal, currentItem, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    if (!firestore) {
      toast({ variant: "destructive", title: "Firebase não inicializado." });
      setLoading(false);
      return;
    }

    if (!isContratadaReadyForPdf(values.contratado, values.responsavelTecnico)) {
      const missing = getContratadaMissingFields(
        values.contratado,
        values.responsavelTecnico,
      );
      toast({
        variant: "destructive",
        title: "Dados da CONTRATADA incompletos",
        description: `Atualize o cadastro ou use «Atualizar do cadastro». Falta: ${missing.map((m) => m.label).join(", ")}.`,
      });
      setLoading(false);
      return;
    }

    const dataToSave = {
      ...values,
      status: currentItem?.status ?? ("Rascunho" as const),
      // Mantém compatibilidade com leituras legadas por campo raiz.
      clientId: values.contratante.clientId,
      sourceProposalId: currentItem?.sourceProposalId || sourceProposal?.id,
      sourceProposalNumber:
        currentItem?.sourceProposalNumber || sourceProposal?.proposalNumber,
    };

    const safeDataToSave = pruneUndefined(dataToSave) as typeof dataToSave;

    try {
      let contractId = currentItem?.id;
      const contractForPdf: Contract = {
        ...(currentItem ?? ({} as Contract)),
        ...safeDataToSave,
        id: contractId ?? "",
      };

      if (currentItem) {
        const docRef = doc(firestore, "contracts", currentItem.id);
        await updateDoc(docRef, safeDataToSave);
        contractId = currentItem.id;
        contractForPdf.id = currentItem.id;
        toast({ title: "Contrato atualizado!" });
      } else {
        const created = await addDoc(collection(firestore, "contracts"), safeDataToSave);
        contractId = created.id;
        contractForPdf.id = created.id;
        if (sourceProposal?.id) {
          await updateDoc(doc(firestore, "commercialProposals", sourceProposal.id), {
            contractId: created.id,
          });
        }
        try {
          await notifyClientDocPortalUsers(
            firestore,
            values.contratante.clientId,
            {
              title: "Novo contrato disponível",
              description: "Um contrato foi cadastrado no menu Financeiro.",
              link: NOTIFICATION_LINKS.contracts,
              sourceType: NOTIFICATION_SOURCE.contrato,
              sourceId: created.id,
              actorRole: user?.role,
            },
            { excludeUserId: user?.uid },
          );
        } catch (notifyErr) {
          console.warn("[Contrato] notificação:", notifyErr);
        }
        toast({ title: "Contrato criado!" });
      }

      if (contractId) {
        try {
          if (hasBrandingUrls && isPdfImagesLoading) {
            toast({
              title: "Contrato salvo",
              description:
                "A identidade visual ainda está a carregar. Use «Exportar PDF» na lista para gerar o documento com cabeçalho e rodapé.",
            });
          } else {
            await persistContractPdfForSignature(
              firestore,
              contractId,
              contractForPdf,
              brandingData,
              pdfImages,
            );
            toast({
              title: "PDF do contrato gerado",
              description:
                "O documento para assinatura foi atualizado no Storage.",
            });
          }
        } catch (pdfErr) {
          console.error("Erro ao gerar PDF do contrato:", pdfErr);
          toast({
            variant: "destructive",
            title: "Contrato salvo, mas falhou o PDF",
            description:
              "Use «Exportar PDF» na lista de contratos para tentar novamente.",
          });
        }
      }
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erro ao salvar contrato",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {currentItem
            ? "Editar Contrato"
            : "Novo Contrato de Prestação de Serviço"}
        </DialogTitle>
        <DialogDescription>
          {currentItem
            ? "Atualize os detalhes do contrato abaixo."
            : sourceProposal
              ? `Preenchido automaticamente a partir da proposta ${sourceProposal.proposalNumber}.`
              : "Preencha os campos para gerar um novo contrato."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full flex flex-col overflow-hidden"
        >
          <div className="form-scroll-body">
            <Accordion
              type="multiple"
              defaultValue={["item-1", "item-3"]}
              className="w-full"
            >
              <AccordionItem value="item-1">
                <AccordionTrigger>Partes Envolvidas</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  <div className="p-4 border rounded-md space-y-4">
                    <h3 className="font-semibold">Contratante</h3>
                    <FormField
                      control={form.control}
                      name="contratante.clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selecionar Cliente</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isLoadingClients}
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
                              {clients?.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
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
                      name="contratante.nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contratante.cpfCnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF/CNPJ</FormLabel>
                          <FormControl>
                            <MaskedInput mask="cpfCnpj" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="p-4 border rounded-md space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">Contratado (empresa principal)</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={isLoadingCompanyProfile}
                        onClick={() => syncContratadaFromCadastro({ showToast: true })}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Atualizar do cadastro
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dados de Cadastro → Empresas (empresa marcada como principal da
                      plataforma). Ao trocar a empresa principal, use o botão acima para
                      atualizar contratos em edição.
                    </p>
                    <FormField
                      control={form.control}
                      name="contratado.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razão Social</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-muted/40" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contratado.cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ</FormLabel>
                          <FormControl>
                            <MaskedInput mask="cnpj" {...field} readOnly className="bg-muted/40" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contratado.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sede (endereço completo)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              readOnly
                              rows={2}
                              className="bg-muted/40 resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {contratadaMissing.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTitle>Dados faltando no contrato</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-4 text-sm space-y-1 mt-1">
                            {contratadaMissing.map((m) => (
                              <li key={m.id}>
                                <strong>{m.label}</strong> — {m.where}
                              </li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="rounded-md border border-dashed bg-muted/20 p-3 space-y-1">
                      <p className="text-xs font-medium text-foreground">
                        Pré-visualização no PDF
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {contratadaPreview}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-md space-y-4">
                    <h3 className="font-semibold">Responsável Técnico</h3>
                    <p className="text-xs text-muted-foreground">
                      Dados de Configurações → Responsáveis técnicos (endereço,
                      município e UF vêm do cadastro do profissional).
                    </p>
                    <FormField
                      control={form.control}
                      name="responsavelTecnico.responsibleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selecionar Responsável Técnico</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isLoadingResponsibles}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isLoadingResponsibles
                                      ? "Carregando..."
                                      : "Selecione o responsável"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {responsibles?.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
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
                      name="responsavelTecnico.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-muted/40" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="responsavelTecnico.cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <MaskedInput
                                mask="cpf"
                                {...field}
                                readOnly
                                className="bg-muted/40"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="responsavelTecnico.profession"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profissão / conselho</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="bg-muted/40" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormItem>
                      <FormLabel>Domicílio (cidade no contrato)</FormLabel>
                      <FormControl>
                        <Input
                          readOnly
                          className="bg-muted/40"
                          value={
                            formatResponsavelDomicilio(watchedResponsavel) ||
                            "Preencha município/UF ou endereço no cadastro do responsável"
                          }
                        />
                      </FormControl>
                    </FormItem>
                    {watchedResponsavel?.address?.trim() ? (
                      <FormField
                        control={form.control}
                        name="responsavelTecnico.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço completo (cadastro)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                readOnly
                                rows={2}
                                className="bg-muted/40 resize-none"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Objeto e Valor</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="objeto.empreendimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empreendimento</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do empreendimento/propriedade"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="objeto.servicos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição Geral dos Serviços</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-32" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="p-4 border rounded-md space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">
                        Itens de Serviço e Valores
                      </h3>
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => append({ descricao: "", valor: 0 })}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add
                      </Button>
                    </div>
                    {fields.map((item, index) => (
                      <div key={item.id} className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`objeto.itens.${index}.descricao`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`objeto.itens.${index}.valor`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor (R$)</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  placeholder="R$ 0,00"
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
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Pagamento e Condições</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="p-4 border rounded-md space-y-4">
                    <h3 className="font-semibold">Condições de Pagamento</h3>
                    <FormField
                      control={form.control}
                      name="pagamento.valorTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} readOnly />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pagamento.valorExtenso"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor por Extenso</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pagamento.forma"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forma de Pagamento</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a forma de pagamento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="p-4 border rounded-md space-y-4">
                    <h3 className="font-semibold">
                      Dados Bancários para Pagamento
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Preenchidos automaticamente a partir de Cadastro → Empresas
                      (empresa da plataforma), quando os campos estão vazios.
                    </p>
                    <FormField
                      control={form.control}
                      name="pagamento.banco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banco</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pagamento.agencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agência</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pagamento.conta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conta Corrente</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pagamento.pix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIX</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Foro e Data</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="foro.comarca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comarca do Foro</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="foro.uf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF do Foro</FormLabel>
                          <FormControl>
                            <Input maxLength={2} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="dataContrato"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Assinatura do Contrato</FormLabel>
                        <FormControl>
                          <BrDateFormControl
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                "Salvar Contrato"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
