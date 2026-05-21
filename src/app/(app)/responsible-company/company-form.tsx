
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EnvironmentalCompany } from '@/lib/types';
import { useFirebase, errorEmitter, useAuth } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc, getDoc } from 'firebase/firestore';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ibgeData } from '@/lib/ibge-data';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { isAdminRole } from '@/lib/role-guards';
import {
  getActivePlatformCompanyId,
  syncActivePlatformCompanyDocs,
} from '@/lib/platform-company';

const formSchema = z.object({
  name: z.string().min(2, 'A razão social é obrigatória.'),
  fantasyName: z.string().optional(),
  cnpj: z.string().min(14, 'O CNPJ é obrigatório (14 dígitos).').max(18, 'CNPJ inválido.'),
  address: z.string().optional(),
  numero: z.string().optional(),
  caixaPostal: z.string().optional(),
  municipio: z.string().optional(),
  district: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
  ddd: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().email('Por favor, insira um e-mail válido.').optional().or(z.literal('')),
  bankName: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountType: z.enum(['corrente', 'poupanca']).optional(),
  pixKey: z.string().optional(),
  pixCopyPaste: z.string().optional(),
  setAsPlatformCompany: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanyFormProps {
  currentItem?: EnvironmentalCompany | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CompanyForm({ currentItem, onSuccess, onCancel }: CompanyFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentItem?.name || '',
      fantasyName: currentItem?.fantasyName || '',
      cnpj: currentItem?.cnpj || '',
      address: currentItem?.address || '',
      numero: currentItem?.numero || '',
      caixaPostal: currentItem?.caixaPostal || '',
      municipio: currentItem?.municipio || '',
      district: currentItem?.district || '',
      uf: currentItem?.uf || '',
      cep: currentItem?.cep || '',
      ddd: currentItem?.ddd || '',
      phone: currentItem?.phone || '',
      fax: currentItem?.fax || '',
      email: currentItem?.email || '',
      bankName: currentItem?.bankName || '',
      bankAgency: currentItem?.bankAgency || '',
      bankAccount: currentItem?.bankAccount || '',
      bankAccountType: currentItem?.bankAccountType,
      pixKey: currentItem?.pixKey || '',
      pixCopyPaste: currentItem?.pixCopyPaste || '',
      setAsPlatformCompany: false,
    },
  });

  React.useEffect(() => {
    if (!firestore || !currentItem?.id || !isAdmin) return;
    let cancelled = false;
    (async () => {
      const activeId = await getActivePlatformCompanyId(firestore);
      if (!cancelled && activeId === currentItem.id) {
        form.setValue('setAsPlatformCompany', true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firestore, currentItem?.id, isAdmin, form]);
  
  const selectedUf = form.watch('uf');
  const citiesForSelectedUf = React.useMemo(() => {
    return ibgeData.statesWithCities.find(state => state.sigla === selectedUf)?.cidades || [];
  }, [selectedUf]);
  
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    form.setValue('cnpj', value);
  };
  
  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }

    const { setAsPlatformCompany, ...companyFields } = values;
    const payload = {
      ...companyFields,
      bankAccountType: companyFields.bankAccountType || undefined,
    };

    const maybeSyncPlatform = async (companyId: string) => {
      const company: EnvironmentalCompany = { id: companyId, ...payload };
      const isActive = (await getActivePlatformCompanyId(firestore)) === companyId;
      const shouldSync = isAdmin && (setAsPlatformCompany || isActive);
      if (shouldSync) {
        await syncActivePlatformCompanyDocs(firestore, company);
      }
      return shouldSync;
    };

    if (currentItem) {
      const docRef = doc(firestore, 'environmentalCompanies', currentItem.id);
      updateDoc(docRef, payload)
        .then(async () => {
          const synced = await maybeSyncPlatform(currentItem.id);
          toast({
            title: synced ? 'Empresa da plataforma atualizada' : 'Empresa atualizada!',
            description: synced
              ? 'Contrato de cadastro e pagamento usam esta empresa.'
              : 'Os dados da empresa foram salvos com sucesso.',
          });
          onSuccess?.();
        })
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: payload,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'environmentalCompanies');
      addDoc(collectionRef, payload)
        .then(async (ref) => {
          if (isAdmin && setAsPlatformCompany) {
            const snap = await getDoc(ref);
            const company = { id: ref.id, ...snap.data() } as EnvironmentalCompany;
            await syncActivePlatformCompanyDocs(firestore, company);
            toast({
              title: 'Empresa criada e definida para a plataforma',
              description: `${values.name} será usada no contrato de cadastro e no pagamento.`,
            });
          } else {
            toast({ title: 'Empresa criada!', description: `A empresa ${values.name} foi adicionada com sucesso.` });
          }
          form.reset();
          onSuccess?.();
        })
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: payload,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{currentItem ? 'Editar Empresa' : 'Adicionar Nova Empresa'}</DialogTitle>
        <DialogDescription>
          Dados jurídicos, conta corrente e PIX para contrato de assinatura e pagamento do software.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-4 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Razão Social</FormLabel><FormControl><Input placeholder="Nome completo da empresa" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="fantasyName" render={({ field }) => (<FormItem><FormLabel>Nome Fantasia</FormLabel><FormControl><Input placeholder="Nome comercial" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><MaskedInput mask="cnpj" placeholder="00.000.000/0000-00" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua, Av, etc." {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="numero" render={({ field }) => (<FormItem><FormLabel>Nº</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="caixaPostal" render={({ field }) => (<FormItem><FormLabel>Caixa Postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField control={form.control} name="uf" render={({ field }) => (
                      <FormItem><FormLabel>UF</FormLabel>
                          <Select onValueChange={(value) => { field.onChange(value); form.setValue('municipio', ''); }} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                              <SelectContent>{ibgeData.statesWithCities.map(s => <SelectItem key={s.sigla} value={s.sigla}>{s.sigla}</SelectItem>)}</SelectContent>
                          </Select>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="municipio" render={({ field }) => (
                      <FormItem className="md:col-span-2"><FormLabel>Município</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedUf}>
                                  <FormControl><SelectTrigger><SelectValue placeholder={!selectedUf ? "Selecione um estado" : "Selecione um município"} /></SelectTrigger></FormControl>
                                  <SelectContent>{citiesForSelectedUf.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                              </Select>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="cep" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><MaskedInput mask="cep" placeholder="00000-000" maxLength={9} {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="ddd" render={({ field }) => (<FormItem><FormLabel>DDD</FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Fone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="fax" render={({ field }) => (<FormItem><FormLabel>Fax</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="contato@empresa.com" {...field} /></FormControl><FormMessage /></FormItem>)} />

              <Separator />
              <div>
                <h4 className="text-sm font-semibold">Conta corrente e PIX</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Usados no cadastro público para pagamento anual do software (PIX, débito ou crédito).
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="bankName" render={({ field }) => (
                  <FormItem><FormLabel>Banco</FormLabel><FormControl><Input placeholder="Ex.: Banco do Brasil" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bankAccountType" render={({ field }) => (
                  <FormItem><FormLabel>Tipo de conta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="corrente">Corrente</SelectItem>
                        <SelectItem value="poupanca">Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bankAgency" render={({ field }) => (
                  <FormItem><FormLabel>Agência</FormLabel><FormControl><Input placeholder="0000-0" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bankAccount" render={({ field }) => (
                  <FormItem><FormLabel>Conta</FormLabel><FormControl><Input placeholder="00000-0" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pixKey" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Chave PIX</FormLabel><FormControl><Input placeholder="CNPJ, e-mail, telefone ou chave aleatória" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pixCopyPaste" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>PIX copia e cola</FormLabel>
                    <FormControl><Textarea rows={3} placeholder="Cole o código BR Code completo" className="font-mono text-xs" {...field} /></FormControl>
                    <FormDescription>Exibido no passo de pagamento do cadastro quando o cliente escolhe PIX.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {isAdmin ? (
                <>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="setAsPlatformCompany"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-primary/25 bg-primary/5 p-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(c) => field.onChange(c === true)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer font-medium">
                            Usar esta empresa no contrato de assinatura e no pagamento da plataforma
                          </FormLabel>
                          <FormDescription>
                            Apenas administradores podem alterar qual empresa aparece para novos cadastros.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
