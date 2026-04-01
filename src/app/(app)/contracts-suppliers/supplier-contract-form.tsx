"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, doc, addDoc, updateDoc, getDocs } from "firebase/firestore";
import { useCollection, useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import type { SupplierContract, Fornecedor, EnvironmentalCompany } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

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
    servicos: z.string().min(1, "Descreva os serviços contratados."),
    observacoes: z.string().optional(),
  }),
  pagamento: z.object({
    valorTotal: z.coerce.number().positive("Informe um valor maior que zero."),
    forma: z.string().min(1, "Selecione a forma de pagamento."),
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

export function SupplierContractForm({
  currentItem,
  onSuccess,
}: SupplierContractFormProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const suppliersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "fornecedores") : null),
    [firestore],
  );
  const { data: suppliers, isLoading: isLoadingSuppliers } =
    useCollection<Fornecedor>(suppliersQuery);

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
          objeto: currentItem.objeto,
          pagamento: currentItem.pagamento,
          foro: currentItem.foro,
          dataContrato: currentItem.dataContrato.split("T")[0] || currentItem.dataContrato,
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
            servicos: "",
            observacoes: "",
          },
          pagamento: {
            valorTotal: 0,
            forma: "",
          },
          foro: {
            comarca: "Unaí",
            uf: "MG",
          },
          dataContrato: new Date().toISOString().split("T")[0],
          status: "Rascunho",
        },
  });

  const selectedSupplierId = form.watch("prestador.supplierId");

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
  }, [selectedSupplierId, suppliers, form]);

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
        objeto: values.objeto,
        pagamento: values.pagamento,
        foro: values.foro,
        dataContrato: new Date(values.dataContrato).toISOString(),
      };

      if (currentItem) {
        await updateDoc(doc(firestore, "supplierContracts", currentItem.id), payload);
        toast({ title: "Contrato de fornecedor atualizado com sucesso." });
      } else {
        await addDoc(collection(firestore, "supplierContracts"), payload);
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
          A contratante é preenchida automaticamente pela tela de Informações da
          Empresa e o prestador vem do cadastro de fornecedores.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">Contratante (fixo)</p>
            <p className="text-muted-foreground">
              {isLoadingCompanyProfile
                ? "Carregando..."
                : companyProfile?.name || "Empresa não configurada"}
            </p>
            <p className="text-muted-foreground">
              {companyProfile?.cnpj || "Sem CNPJ"}
            </p>
          </div>

          <FormField
            control={form.control}
            name="prestador.supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prestador de serviço (Fornecedores)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
                  <FormLabel>Nome do prestador</FormLabel>
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
                  <FormLabel>CPF/CNPJ do prestador</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="objeto.servicos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serviços contratados</FormLabel>
                <FormControl>
                  <Textarea className="min-h-28" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="pagamento.valorTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor total (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pagamento.forma"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de pagamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormField
              control={form.control}
              name="dataContrato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do contrato</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentItem ? "Salvar alterações" : "Criar contrato"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

