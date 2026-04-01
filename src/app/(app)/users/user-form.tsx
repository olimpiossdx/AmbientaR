
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, EyeOff, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppUser, UserRole, AccessRequest } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { logUserAction } from '@/lib/audit-log';
import { formatCpfCnpjDisplay } from '@/lib/masks';

const baseSchema = z.object({
  name: z.string().min(2, 'O nome é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  role: z.enum(['admin', 'client', 'representative', 'technical', 'sales', 'financial', 'gestor', 'supervisor', 'diretor_fauna', 'advogado']),
  status: z.enum(['active', 'inactive']),
  userCpf: z.string().optional(),
  cpf: z.string().optional(),
  cpfs: z.array(z.object({ value: z.string().min(11, 'CPF deve ter 11 dígitos.') })).optional(),
  cnpjs: z.array(z.object({ value: z.string().min(14, "O CNPJ deve ser válido.") })).optional(),
  dataNascimento: z.date().optional(),
  photoURL: z.string().optional(),
});

const createFormSchema = baseSchema
  .extend({
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z
      .string()
      .min(6, 'A confirmação de senha deve ter pelo menos 6 caracteres.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role !== 'representative') return true;
      const hasCpfs = data.cpfs && data.cpfs.some((c: { value: string }) => (c.value || '').replace(/\D/g, '').length >= 11);
      const hasCnpjs = data.cnpjs && data.cnpjs.some((c: { value: string }) => (c.value || '').replace(/\D/g, '').length >= 14);
      return !!hasCpfs || !!hasCnpjs;
    },
    {
      message:
        'Para o perfil Representante, informe ao menos um CPF ou CNPJ ao qual solicita acesso.',
      path: ['cpfs'],
    },
  );

const editFormSchema = baseSchema
  .extend({
    password: z
      .string()
      .optional()
      .refine((val) => val === '' || !val || val.length >= 6, {
        message: 'A senha deve ter pelo menos 6 caracteres se for alterada.',
        path: ['password'],
      }),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.password && !data.confirmPassword) return true;
      return data.password === data.confirmPassword;
    },
    {
      message: 'As senhas não coincidem.',
      path: ['confirmPassword'],
    },
  )
  .refine(
    (data) => {
      if (data.role !== 'representative') return true;
      const hasCpfs = data.cpfs && data.cpfs.some((c: { value: string }) => (c.value || '').replace(/\D/g, '').length >= 11);
      const hasCnpjs = data.cnpjs && data.cnpjs.some((c: { value: string }) => (c.value || '').replace(/\D/g, '').length >= 14);
      return !!hasCpfs || !!hasCnpjs;
    },
    {
      message:
        'Para o perfil Representante, informe ao menos um CPF ou CNPJ ao qual solicita acesso.',
      path: ['cpfs'],
    },
  );


type UserFormValues = z.infer<typeof createFormSchema>;

/** Item da lista de representantes que solicitam acesso aos dados do cliente (titular). */
export type RepresentativeForClient = {
  id: string;
  requestedByName: string;
  requestedByUserId: string;
  status: string;
  representativeCpf?: string;
};

interface UserFormProps {
  currentUser?: AppUser | null;
  onSuccess?: () => void;
  /** CPF ao qual o representante solicita acesso (vindo de access_requests). Exibido em modo somente leitura quando preenchido. */
  representativeRequestedCpf?: string | null;
  /** Quando o usuário editado é cliente (titular), lista de representantes que solicitam ou têm acesso aos dados dele. */
  representativesForThisClient?: RepresentativeForClient[];
  /** CPFs/CNPJs que o representante já solicitou acesso (para preencher ao editar). */
  representativeRequestedCpfsCnpjs?: string[];
}

const roles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'client', label: 'Cliente (Titular)' },
  { value: 'representative', label: 'Representante' },
  { value: 'technical', label: 'Técnico' },
  { value: 'sales', label: 'Vendas' },
  { value: 'financial', label: 'Financeiro' },
  { value: 'gestor', label: 'Gestor Ambiental' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'diretor_fauna', label: 'Diretor de Fauna' },
  { value: 'advogado', label: 'Advogado' },
];

export function UserForm({ currentUser, onSuccess, representativeRequestedCpf, representativesForThisClient, representativeRequestedCpfsCnpjs }: UserFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();

  const currentSchema = currentUser ? editFormSchema : createFormSchema;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      role: currentUser?.role || 'client',
      status: currentUser?.status || 'active',
      password: '',
      confirmPassword: '',
      userCpf: currentUser?.userCpf || currentUser?.cpf || '',
      cpf: currentUser?.cpf || '',
      cpfs: currentUser?.role === 'representative' && representativeRequestedCpfsCnpjs?.length
        ? representativeRequestedCpfsCnpjs.filter(v => { const d = (v || '').replace(/\D/g, ''); return d.length >= 11 && d.length <= 14; }).map(v => ({ value: v || '' }))
        : [],
      cnpjs: currentUser?.cnpjs?.length ? currentUser.cnpjs.map(c => ({ value: c })) : (currentUser?.role === 'representative' && representativeRequestedCpfsCnpjs?.length ? representativeRequestedCpfsCnpjs.filter(v => (v || '').replace(/\D/g, '').length >= 14).map(v => ({ value: v || '' })) : []),
      dataNascimento: currentUser?.dataNascimento ? new Date(currentUser.dataNascimento) : undefined,
      photoURL: currentUser?.photoURL || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "cnpjs",
  });

  const { fields: cpfsFields, append: cpfsAppend, remove: cpfsRemove } = useFieldArray({
    control: form.control,
    name: "cpfs",
  });
  
  const selectedRole = form.watch('role');

  const handleUserCpfChange = (value: string) => {
    form.setValue('userCpf', value, { shouldValidate: true });
  };
  
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    let value = e.target.value.replace(/\D/g, '');

    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');

    form.setValue(`cnpjs.${index}.value`, value, { shouldValidate: true });
  };

  const handleCpfListItemChange = (value: string, index: number) => {
    form.setValue(`cpfs.${index}.value`, value, { shouldValidate: true });
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      form.setValue('dataNascimento', undefined, { shouldValidate: true });
      return;
    }
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      form.setValue('dataNascimento', parsedDate, { shouldValidate: true });
    } else {
      form.setError('dataNascimento', { type: 'manual', message: 'Data inválida' });
    }
  };

  async function onSubmit(values: UserFormValues) {
    setLoading(true);

    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const cnpjsArray = values.cnpjs?.map(c => c.value).filter(Boolean) || [];
    const cpfsArray = (values.cpfs || []).map(c => (c.value || '').trim()).filter(v => v.replace(/\D/g, '').length >= 11);

    if (currentUser) {
      // --- Update existing user logic ---
      const userRef = doc(firestore, 'users', currentUser.id);
      const isEditingSelf = auth.currentUser?.uid === currentUser.id;
      const updateData: Partial<AppUser> = {
        name: values.name,
        email: values.email,
        role: values.role,
        status: values.status,
        userCpf: values.userCpf || '',
        cpf: values.role === 'representative' ? (cpfsArray[0] || '') : (values.cpf || ''),
        cnpjs: cnpjsArray,
        photoURL: values.photoURL || '',
        dataNascimento: values.dataNascimento?.toISOString() || '',
        ...(isEditingSelf ? { cadastroIncompleto: false } : {}),
      };

      updateDoc(userRef, updateData)
        .then(async () => {
          if (values.role === 'representative' && currentUser.id) {
            const existingSet = new Set((representativeRequestedCpfsCnpjs || []).map(v => (v || '').replace(/\D/g, '')));
            const allCpfCnpj = [...cpfsArray, ...cnpjsArray];
            for (const cpfOuCnpj of allCpfCnpj) {
              const normalized = (cpfOuCnpj || '').trim();
              const digits = normalized.replace(/\D/g, '');
              if (digits.length < 11 || existingSet.has(digits)) continue;
              existingSet.add(digits);
              try {
                await addDoc(collection(firestore, 'access_requests'), {
                  requestedByUserId: currentUser.id,
                  requestedByEmail: values.email,
                  requestedByName: values.name,
                  cpfOfInterested: normalized,
                  status: 'pending',
                  createdAt: new Date().toISOString(),
                } as Omit<AccessRequest, 'id'>);
              } catch (e) {
                console.warn('Erro ao criar pedido de acesso para', normalized, e);
              }
            }
          }
          toast({
            title: 'Usuário atualizado!',
            description: 'As informações do usuário foram salvas com sucesso.',
          });
          logUserAction(firestore, auth, 'update_user', { userId: currentUser.id, userName: values.name });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });

    } else {
        // --- Create new user logic ---
        if (!values.password) {
            toast({ variant: 'destructive', title: 'Senha obrigatória' });
            setLoading(false);
            return;
        }

        try {
            // Check if email already exists in Firestore
            const usersRef = collection(firestore, "users");
            const emailQuery = query(usersRef, where("email", "==", values.email));
            const querySnapshot = await getDocs(emailQuery);

            if (!querySnapshot.empty) {
                toast({
                    variant: 'destructive',
                    title: 'E-mail já em uso',
                    description: 'Este e-mail já está cadastrado. Por favor, utilize um e-mail diferente.',
                });
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const newFirebaseUser = userCredential.user;
            
            const newUserId = newFirebaseUser.uid;
            
            const userDocData: Omit<AppUser, 'id'> = {
                uid: newUserId,
                name: values.name,
                email: values.email,
                role: values.role,
                status: values.status,
                userCpf: values.userCpf || '',
                cpf: values.role === 'representative' ? (cpfsArray[0] || '') : (values.cpf || ''),
                cnpjs: cnpjsArray,
                photoURL: values.photoURL || '',
                dataNascimento: values.dataNascimento?.toISOString() || '',
                isOnline: false,
            };

            await setDoc(doc(firestore, 'users', newUserId), userDocData);
            logUserAction(firestore, auth, 'create_user', { newUserId: newUserId, newUserName: values.name });

            // Cliente (titular): criar Cliente + Empreendedor pelo próprio CPF.
            if (values.role === 'client') {
                const cpfPessoal = (values.userCpf || '').trim().replace(/\D/g, '');
                if (cpfPessoal.length >= 11) {
                    try {
                        const clientData = {
                            name: values.name,
                            cpfCnpj: cpfPessoal,
                            entityType: 'Pessoa Física' as const,
                            email: values.email,
                            userId: newUserId,
                        };
                        const empreendedorData = {
                            name: values.name,
                            email: values.email,
                            phone: '',
                            address: '',
                            cpfCnpj: cpfPessoal,
                            entityType: ['Pessoa Física'] as const,
                            userId: newUserId,
                        };
                        await addDoc(collection(firestore, 'clients'), clientData);
                        await addDoc(collection(firestore, 'empreendedores'), empreendedorData);
                    } catch (e) {
                        console.error('Erro ao criar cliente/empreendedor automático:', e);
                    }
                }
            }

            // Representante: criar um pedido de acesso por CPF/CNPJ informado (titular aprovará em Meu Perfil).
            if (values.role === 'representative') {
                const accessRequestsRef = collection(firestore, 'access_requests');
                const allCpfCnpj = [...cpfsArray, ...cnpjsArray];
                for (const cpfOuCnpj of allCpfCnpj) {
                    const normalized = (cpfOuCnpj || '').trim();
                    if (normalized.replace(/\D/g, '').length < 11) continue;
                    try {
                        await addDoc(accessRequestsRef, {
                            requestedByUserId: newUserId,
                            requestedByEmail: values.email,
                            requestedByName: values.name,
                            cpfOfInterested: normalized,
                            status: 'pending',
                            createdAt: new Date().toISOString(),
                        } as Omit<AccessRequest, 'id'>);
                    } catch (e) {
                        console.warn('Erro ao criar pedido de acesso para', normalized, e);
                    }
                }
            }

            toast({
              title: 'Usuário criado!',
              description: `As informações de ${values.name} foram salvas com sucesso.`,
            });
            
            form.reset();
            onSuccess?.();

        } catch (error: any) {
             toast({
              variant: 'destructive',
              title: 'Oh, não! Algo deu errado.',
              description: error.code === 'auth/email-already-in-use'
                ? 'Este e-mail já está em uso por outra conta. Por favor, utilize um e-mail diferente.'
                : (error.message || 'Não foi possível criar o usuário na autenticação.'),
            });
        } finally {
            setLoading(false);
        }
    }
  }

  return (
    <>
        <Form {...form}>
            <form id="user-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 -ml-1 space-y-4">
                    <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                        <h3 className="text-sm font-medium">Checagem inicial — CPF</h3>
                        <p className="text-xs text-muted-foreground">Informe o CPF pessoal do usuário (documento de identificação). Representantes informam depois os CPFs/CNPJs ao qual solicitam acesso.</p>
                    <FormField
                    control={form.control}
                    name="userCpf"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CPF do Usuário (pessoal)</FormLabel>
                        <FormControl>
                            <MaskedInput mask="cpf" placeholder="000.000.000-00" {...field} onChange={handleUserCpfChange} />
                        </FormControl>
                        <FormDescription>Documento de identificação do próprio usuário. Não é usado para vincular acesso a dados de terceiros.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    {currentUser?.role === 'representative' && representativeRequestedCpf && (
                        <div className="rounded border bg-muted/50 p-3">
                            <p className="text-xs font-medium text-muted-foreground">CPF ao qual solicita acesso</p>
                            <p className="text-sm font-medium mt-1">{formatCpfCnpjDisplay(representativeRequestedCpf)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Informado no cadastro; o titular deve aprovar em Meu Perfil → Aprovar acesso de representantes.</p>
                        </div>
                    )}
                    </div>
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                            <Input placeholder="Nome do usuário" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} disabled={!!currentUser} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                    <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <div className="relative">
                    <FormControl>
                    <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={currentUser ? 'Deixe em branco para não alterar' : '••••••••'}
                                {...field}
                            />
                            </FormControl>
                            <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
                            </Button>
                        </div>
                        <FormDescription>{currentUser ? 'Deixe em branco para não alterar a senha.' : 'A senha deve ter pelo menos 6 caracteres.'}</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                    <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                    <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={currentUser ? 'Repita a nova senha (se for alterar)' : 'Repita a senha'}
                                {...field}
                            />
                            </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nível de Acesso</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um nível" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {roles.map(role => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    {selectedRole !== 'admin' && (
                    <FormField
                        control={form.control}
                        name="dataNascimento"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                                <FormLabel>Data de Nascimento (Opcional)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    value={field.value ? field.value.toISOString().slice(0, 10) : ''}
                                    onChange={handleDateInputChange}
                                  />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    )}
                    {form.watch('role') === 'client' && (
                    <div className='space-y-4 rounded-md border p-4'>
                        <h3 className="text-sm font-medium">Acesso aos seus dados (Cliente titular)</h3>
                        <p className='text-sm text-muted-foreground'>Como titular, você só precisa aprovar ou rejeitar pedidos de representantes que queiram acessar seus dados. Não é necessário informar CPF/CNPJ de interessado aqui.</p>
                        {representativesForThisClient && representativesForThisClient.length > 0 ? (
                          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                            <h4 className="text-sm font-medium">Representantes que solicitam acesso aos seus dados</h4>
                            <ul className="space-y-2">
                              {representativesForThisClient.map((rep) => (
                                <li key={rep.id} className="flex items-center justify-between gap-2 text-sm">
                                  <span><strong>{rep.requestedByName}</strong>{rep.representativeCpf ? ` — CPF ${formatCpfCnpjDisplay(rep.representativeCpf)}` : ''}</span>
                                  <span className="text-muted-foreground capitalize">{rep.status === 'pending' ? 'Pendente de aprovação' : rep.status}</span>
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-muted-foreground">Aprove ou rejeite em Configurações → Usuários (Meu Perfil) → card &quot;Aprovar acesso de representantes&quot;.</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Nenhum representante solicitou acesso no momento. Quando alguém solicitar, aparecerá aqui e em Meu Perfil.</p>
                        )}
                    </div>
                    )}
                    {form.watch('role') === 'representative' && (
                    <div className='space-y-4 rounded-md border p-4'>
                        <h3 className="text-sm font-medium">CPFs/CNPJs ao qual solicito acesso</h3>
                        <p className='text-sm text-muted-foreground'>Informe o CPF ou CNPJ de cada titular cujos dados você deseja acessar. O titular aprovará (ou não) em Meu Perfil.</p>
                        <div>
                          <Label>CPFs</Label>
                          {cpfsFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2 mt-2">
                              <FormField
                                control={form.control}
                                name={`cpfs.${index}.value`}
                                render={({ field: f }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <MaskedInput mask="cpf" placeholder="000.000.000-00" {...f} onChange={(val) => handleCpfListItemChange(val, index)} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="button" variant="destructive" size="icon" onClick={() => cpfsRemove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => cpfsAppend({ value: "" })}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar CPF
                          </Button>
                        </div>
                        <div>
                          <Label>CNPJs</Label>
                          {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2 mt-2">
                              <FormField
                                control={form.control}
                                name={`cnpjs.${index}.value`}
                                render={({ field: f }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input placeholder="00.000.000/0000-00" {...f} onChange={(e) => handleCnpjChange(e, index)} maxLength={18} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar CNPJ
                          </Button>
                        </div>
                    </div>
                    )}
                    <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Status</FormLabel>
                            <FormDescription>
                            Usuários inativos não podem acessar o sistema.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value === 'active'}
                            onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onSuccess}>
                    Cancelar
                    </Button>
                    <Button form="user-form" type="submit" disabled={loading}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 
                      'Salvar'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    </>
  );
}
