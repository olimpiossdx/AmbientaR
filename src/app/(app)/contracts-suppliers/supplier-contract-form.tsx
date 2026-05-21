"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, doc, addDoc, updateDoc, getDocs } from "firebase/firestore";
import { useCollection, useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import type {
  SupplierContract,
  Fornecedor,
  EnvironmentalCompany,
  Service,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, List, PlusCircle, Trash2 } from "lucide-react";
import { numberToWordsBRL } from "@/lib/utils";
import {
  fillEmptyContractPaymentBank,
  toContractPaymentBankFromSupplier,
} from "@/lib/company-bank-payment";

const formSchema = z.object({
  prestador: z.object({
    supplierId: z.string().min(1, "Selecione um fornecedor."),
    nome: z.string().min(1, "Nome do prestador é obrigatório."),
    cpfCnpj: z.string().min(1, "CPF/CNPJ do prestador é obrigatório."),
    serviceType: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    endereco: z.string().optional(),
  }),
  objeto: z.object({
    empreendimento: z.string().optional(),
    municipio: z.string().optional(),
    uf: z.string().optional(),
    servicos: z.string().min(1, "A descrição geral dos serviços é obrigatória."),
    observacoes: z.string().optional(),
    itens: z
      .array(
        z.object({
          descricao: z.string().min(1, "Informe a descrição do item."),
          valor: z.coerce.number().min(0, "Valor inválido."),
        }),
      )
      .min(1, "Adicione ao menos um serviço."),
  }),
  pagamento: z.object({
    valorTotal: z.coerce.number().positive("Informe um valor maior que zero."),
    valorExtenso: z.string().min(1, "Valor por extenso é obrigatório."),
    forma: z.string().min(1, "Selecione a forma de pagamento."),
    banco: z.string().optional(),
    agencia: z.string().optional(),
    conta: z.string().optional(),
    pix: z.string().optional(),
  }),
  foro: z.object({
    comarca: z.string().min(1, "Informe a comarca."),
    uf: z.string().min(2).max(2),
  }),
  dataContrato: z.string().min(1, "Informe a data do contrato."),
  status: z.enum(["Rascunho", "Aprovado"]),
});

type FormValues = z.infer<typeof formSchema>;

interface SupplierContractFormProps {
  currentItem?: SupplierContract | null;
  onSuccess?: () => void;
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
  if (Number.isNaN(value)) value = 0;
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
CurrencyInput.displayName = "SupplierCurrencyInput";

async function getNextSupplierContractNumber(
  firestore: NonNullable<ReturnType<typeof useFirebase>["firestore"]>,
): Promise<string> {
  const currentYear = new Date().getFullYear();
  const snapshot = await getDocs(collection(firestore, "supplierContracts"));
  let max = 0;
  snapshot.docs.forEach((d) => {
    const value = String((d.data() as { contractNumber?: string }).contractNumber || "");
    const match = value.match(/^CFS-(\d{4})\/(\d{4})$/);
    if (!match) return;
    const seq = Number(match[1]);
    const year = Number(match[2]);
    if (year === currentYear && Number.isFinite(seq) && seq > max) max = seq;
  });
  return `CFS-${String(max + 1).padStart(4, "0")}/${currentYear}`;
}

function defaultItensFromContract(item: SupplierContract | null | undefined) {
  if (item?.objeto?.itens && item.objeto.itens.length > 0) {
    return item.objeto.itens.map((i) => ({
      descricao: i.descricao,
      valor: Number(i.valor) || 0,
    }));
  }
  const legacy = item?.objeto?.servicos?.trim();
  if (legacy) {
    return [
      {
        descricao: legacy,
        valor: Number(item?.pagamento?.valorTotal) || 0,
      },
    ];
  }
  return [{ descricao: "", valor: 0 }];
}

export function SupplierContractForm({
  currentItem,
  onSuccess,
}: SupplierContractFormProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);

  const suppliersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "fornecedores") : null),
    [firestore],
  );
  const { data: suppliers, isLoading: isLoadingSuppliers } =
    useCollection<Fornecedor>(suppliersQuery);

  const servicesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "services") : null),
    [firestore],
  );
  const { data: services, isLoading: isLoadingServices } =
    useCollection<Service>(servicesQuery);

  const companyProfileDocRef = useMemoFirebase(
    () =>
      firestore ? doc(firestore, "companySettings", "companyProfile") : null,
    [firestore],
  );
  const { data: companyProfile, isLoading: isLoadingCompanyProfile } =
    useDoc<Omit<EnvironmentalCompany, "id">>(companyProfileDocRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem
      ? {
          prestador: currentItem.prestador,
          objeto: {
            empreendimento: currentItem.objeto?.empreendimento || "",
            municipio: currentItem.objeto?.municipio || "",
            uf: currentItem.objeto?.uf || "",
            servicos: currentItem.objeto?.servicos || "",
            observacoes: currentItem.objeto?.observacoes || "",
            itens: defaultItensFromContract(currentItem),
          },
          pagamento: {
            valorTotal: Number(currentItem.pagamento?.valorTotal) || 0,
            valorExtenso:
              currentItem.pagamento?.valorExtenso ||
              numberToWordsBRL(Number(currentItem.pagamento?.valorTotal) || 0),
            forma: currentItem.pagamento?.forma || "",
            banco: currentItem.pagamento?.banco || "",
            agencia: currentItem.pagamento?.agencia || "",
            conta: currentItem.pagamento?.conta || "",
            pix: currentItem.pagamento?.pix || "",
          },
          foro: currentItem.foro,
          dataContrato:
            currentItem.dataContrato.split("T")[0] || currentItem.dataContrato,
          status: currentItem.status,
        }
      : {
          prestador: {
            supplierId: "",
            nome: "",
            cpfCnpj: "",
            serviceType: "",
            email: "",
            phone: "",
            endereco: "",
          },
          objeto: {
            empreendimento: "",
            municipio: "",
            uf: "",
            servicos: "",
            observacoes: "",
            itens: [{ descricao: "", valor: 0 }],
          },
          pagamento: {
            valorTotal: 0,
            valorExtenso: "",
            forma: "",
            banco: "",
            agencia: "",
            conta: "",
            pix: "",
          },
          foro: { comarca: "Unaí", uf: "MG" },
          dataContrato: new Date().toISOString().split("T")[0],
          status: "Rascunho",
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "objeto.itens",
  });

  const watchedItems = useWatch({ control: form.control, name: "objeto.itens" });
  const selectedSupplierId = form.watch("prestador.supplierId");

  const totalAmount = React.useMemo(
    () =>
      watchedItems?.reduce((acc, item) => acc + (Number(item.valor) || 0), 0) ||
      0,
    [watchedItems],
  );

  React.useEffect(() => {
    form.setValue("pagamento.valorTotal", totalAmount);
    form.setValue("pagamento.valorExtenso", numberToWordsBRL(totalAmount));
  }, [totalAmount, form]);

  React.useEffect(() => {
    if (!selectedSupplierId || !suppliers) return;
    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;
    form.setValue("prestador.nome", supplier.name || "");
    form.setValue("prestador.cpfCnpj", supplier.cpfCnpj || "");
    form.setValue("prestador.serviceType", supplier.serviceType || "");
    form.setValue("prestador.email", supplier.email || "");
    form.setValue("prestador.phone", supplier.phone || "");
    form.setValue(
      "prestador.endereco",
      [supplier.logradouro, supplier.bairro, supplier.municipio, supplier.uf]
        .filter(Boolean)
        .join(", "),
    );

    fillEmptyContractPaymentBank(
      form.setValue,
      form.getValues,
      "pagamento",
      toContractPaymentBankFromSupplier(supplier.bankDetails),
    );
  }, [selectedSupplierId, suppliers, form]);

  const handleAddServiceFromTable = (service: Service) => {
    const desc =
      service.name + (service.description ? `\n${service.description}` : "");
    append({ descricao: desc, valor: service.price });
    setIsServiceModalOpen(false);
    toast({
      title: "Serviço adicionado",
      description: `"${service.name}" incluído no contrato.`,
    });
  };

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

  async function onSubmit(values: FormValues) {
    if (!firestore) return;
    if (!companyProfile?.name || !companyProfile?.cnpj) {
      toast({
        variant: "destructive",
        title: "Informações da empresa incompletas",
        description:
          "Preencha Configurações > Informações da Empresa antes de criar o contrato.",
      });
      return;
    }

    setLoading(true);
    try {
      const contractNumber =
        currentItem?.contractNumber ||
        (await getNextSupplierContractNumber(firestore));

      const payload: Omit<SupplierContract, "id"> = {
        contractNumber,
        status: values.status,
        contratante: {
          nome: companyProfile.name,
          cnpj: companyProfile.cnpj,
          endereco: companyProfile.address || "",
          numero: companyProfile.numero || "",
          bairro: companyProfile.district || "",
          municipio: companyProfile.municipio || "",
          uf: companyProfile.uf || "",
          cep: companyProfile.cep || "",
        },
        prestador: values.prestador,
        objeto: {
          empreendimento: values.objeto.empreendimento,
          municipio: values.objeto.municipio,
          uf: values.objeto.uf,
          servicos: values.objeto.servicos,
          observacoes: values.objeto.observacoes,
          itens: values.objeto.itens,
        },
        pagamento: values.pagamento,
        foro: values.foro,
        dataContrato: new Date(values.dataContrato).toISOString(),
      };

      const cleaned = pruneUndefined(payload) as Omit<SupplierContract, "id">;

      if (currentItem) {
        await updateDoc(
          doc(firestore, "supplierContracts", currentItem.id),
          cleaned,
        );
        toast({ title: "Contrato de fornecedor atualizado com sucesso." });
      } else {
        await addDoc(collection(firestore, "supplierContracts"), cleaned);
        toast({ title: "Contrato de fornecedor criado com sucesso." });
      }
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar contrato",
        description: "Não foi possível concluir a operação.",
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
            ? "Editar Contrato-Fornecedores"
            : "Novo Contrato-Fornecedores"}
        </DialogTitle>
        <DialogDescription>
          Contrato independente do menu Contratos (clientes). A Pimenta é a
          contratante; o prestador vem do cadastro de fornecedores. Serviços podem
          ser lançados pela Tabela de Serviços ou manualmente, sem proposta
          comercial.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">Contratante (Pimenta — automático)</p>
            <p className="text-muted-foreground">
              {isLoadingCompanyProfile
                ? "Carregando..."
                : companyProfile?.name || "Empresa não configurada"}
            </p>
            <p className="text-muted-foreground">
              CNPJ {companyProfile?.cnpj || "—"}
            </p>
          </div>

          <Accordion type="multiple" defaultValue={["prestador", "objeto", "pagamento"]}>
            <AccordionItem value="prestador">
              <AccordionTrigger>Prestador de serviços</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="prestador.supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingSuppliers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingSuppliers
                                  ? "Carregando..."
                                  : "Selecione um fornecedor"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(suppliers || []).map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="prestador.nome"
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
                    name="prestador.cpfCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="objeto">
              <AccordionTrigger>Objeto e serviços</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="objeto.empreendimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empreendimento (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="objeto.municipio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Município</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="objeto.uf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UF</FormLabel>
                        <FormControl>
                          <Input maxLength={2} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="objeto.servicos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição geral dos serviços</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="min-w-0 space-y-4 rounded-lg border border-border/80 bg-muted/15 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold">Itens contratados</h3>
                    <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => setIsServiceModalOpen(true)}
                      >
                        <List className="mr-2 h-4 w-4" />
                        Adicionar da Tabela
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => append({ descricao: "", valor: 0 })}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Manual
                      </Button>
                    </div>
                  </div>
                  {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum item. Use a Tabela de Serviços ou adicione manualmente.
                    </p>
                  ) : null}
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 gap-3 rounded-md border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_10.5rem_auto] sm:items-end"
                      >
                        <FormField
                          control={form.control}
                          name={`objeto.itens.${index}.descricao`}
                          render={({ field: f }) => (
                            <FormItem className="min-w-0">
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="min-h-[4.5rem] resize-y"
                                  {...f}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`objeto.itens.${index}.valor`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Valor (R$)</FormLabel>
                              <FormControl>
                                <CurrencyInput
                                  className="text-right"
                                  value={f.value}
                                  onChange={f.onChange}
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
                          className="h-10 w-10"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-2 text-base font-semibold">
                    <span className="text-muted-foreground">Valor total:</span>
                    <span>{formatCurrencyBRL(totalAmount)}</span>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="objeto.observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pagamento">
              <AccordionTrigger>Pagamento e foro</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="pagamento.valorTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor total (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" readOnly {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pagamento.valorExtenso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor por extenso</FormLabel>
                        <FormControl>
                          <Input readOnly {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="pagamento.forma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de pagamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="pagamento.banco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco (opcional)</FormLabel>
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
                        <FormLabel>Conta</FormLabel>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="dataContrato"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do contrato</FormLabel>
                        <FormControl>
                          <BrDateFormControl
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="foro.comarca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comarca</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="foro.uf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UF do foro</FormLabel>
                        <FormControl>
                          <Input maxLength={2} {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Rascunho">Rascunho</SelectItem>
                          <SelectItem value="Aprovado">Aprovado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentItem ? "Salvar alterações" : "Criar contrato"}
            </Button>
          </DialogFooter>
        </form>
      </Form>

      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Tabela de Serviços</DialogTitle>
            <DialogDescription>
              Clique em um serviço para adicioná-lo ao contrato com fornecedor.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingServices && (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                )}
                {(services || []).map((service) => (
                  <TableRow
                    key={service.id}
                    className="cursor-pointer"
                    onClick={() => handleAddServiceFromTable(service)}
                  >
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyBRL(service.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsServiceModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
