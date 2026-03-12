
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
import { doc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch, addDoc } from 'firebase/firestore';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { logUserAction } from '@/lib/audit-log';
import { cn } from '@/lib/utils';
import { parse } from 'date-fns';

const baseSchema = z.object({
  name: z.string().min(2, 'O nome é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  role: z.enum(['admin', 'client', 'representative', 'technical', 'sales', 'financial', 'gestor', 'supervisor', 'diretor_fauna']),
  status: z.enum(['active', 'inactive']),
  userCpf: z.string().optional(),
  cpf: z.string().optional(),
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
      if (data.role !== 'client' && data.role !== 'representative') return true;
      return !!data.cpf || (data.cnpjs && data.cnpjs.length > 0);
    },
    {
      message:
        'Para os perfis "Cliente" e "Representante", é obrigatório informar o CPF do interessado ou pelo menos um CNPJ para acesso aos dados.',
      path: ['cpf'],
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
      if (data.role !== 'client' && data.role !== 'representative') return true;
      return !!data.cpf || (data.cnpjs && data.cnpjs.length > 0);
    },
    {
      message:
        'Para os perfis "Cliente" e "Representante", é obrigatório informar o CPF do interessado ou pelo menos um CNPJ para acesso aos dados.',
      path: ['cpf'],
    },
  );


type UserFormValues = z.infer<typeof createFormSchema>;

interface UserFormProps {
  currentUser?: AppUser | null;
  onSuccess?: () => void;
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
];

export function UserForm({ currentUser, onSuccess }: UserFormProps) {
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
      userCpf: currentUser?.userCpf || '',
      cpf: currentUser?.cpf || '',
      cnpjs: currentUser?.cnpjs?.map(c => ({ value: c })) || [],
      dataNascimento: currentUser?.dataNascimento ? new Date(currentUser.dataNascimento) : undefined,
      photoURL: currentUser?.photoURL || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "cnpjs",
  });
  
  const selectedRole = form.watch('role');


  const handleCpfChange = (value: string) => {
    form.setValue('cpf', value, { shouldValidate: true });
  };

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
    
    const cnpjsArray = values.cnpjs?.map(c => c.value) || [];

    if (currentUser) {
      // --- Update existing user logic ---
      const userRef = doc(firestore, 'users', currentUser.id);
      const updateData: Partial<AppUser> = {
        name: values.name,
        email: values.email,
        role: values.role,
        status: values.status,
        userCpf: values.userCpf || '',
        cpf: values.cpf || '',
        cnpjs: cnpjsArray,
        photoURL: values.photoURL || '',
        dataNascimento: values.dataNascimento?.toISOString() || '',
      };

      updateDoc(userRef, updateData)
        .then(() => {
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
                cpf: values.cpf || '',
                cnpjs: cnpjsArray,
                photoURL: values.photoURL || '',
                dataNascimento: values.dataNascimento?.toISOString() || '',
                isOnline: false,
            };

            await setDoc(doc(firestore, 'users', newUserId), userDocData);
            logUserAction(firestore, auth, 'create_user', { newUserId: newUserId, newUserName: values.name });

            // Só criar Cliente + Empreendedor automaticamente quando for o titular (perfil Cliente e próprio CPF).
            if (values.role === 'client') {
                const cpfPessoal = (values.userCpf || '').trim();
                const cpfPessoalDigits = cpfPessoal.replace(/\D/g, '');
                const cpfInteressadoDigits = (values.cpf || '').replace(/\D/g, '');
                const ehTitular = cpfPessoalDigits.length >= 11 && (!values.cpf || cpfInteressadoDigits.length < 11 || cpfInteressadoDigits === cpfPessoalDigits);
                if (ehTitular) {
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

            // Se perfil Cliente ou Representante e CPF do interessado diferente do CPF pessoal, criar pedido de acesso para o titular aprovar
            const cpfDigits = (v: string) => (v || '').replace(/\D/g, '');
            if ((values.role === 'client' || values.role === 'representative') && values.cpf && cpfDigits(values.cpf).length >= 11) {
                const userCpfDigits = cpfDigits(values.userCpf || '');
                if (userCpfDigits.length < 11 || userCpfDigits !== cpfDigits(values.cpf)) {
                    const accessRequestsRef = collection(firestore, 'access_requests');
                    await addDoc(accessRequestsRef, {
                        requestedByUserId: newUserId,
                        requestedByEmail: values.email,
                        requestedByName: values.name,
                        cpfOfInterested: values.cpf.trim(),
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                    } as Omit<AccessRequest, 'id'>);
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
                        <p className="text-xs text-muted-foreground">A primeira informação do cadastro de usuário é o CPF. Informe o CPF pessoal do usuário e, se for perfil Cliente, o CPF do interessado cujos dados ele poderá acessar.</p>
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
                        <h3 className="text-sm font-medium">Documentos de Vinculação (Cliente)</h3>
                        <p className='text-sm text-muted-foreground'>CPF ou CNPJ do interessado cujos dados este usuário poderá acessar. Quando o CPF do interessado for <strong>igual</strong> ao CPF pessoal (titular), serão criados automaticamente registros em Clientes e Empreendedores. Quando for <strong>diferente</strong> (consultor/representante), o usuário terá apenas cadastro aqui em Usuários para acessar um ou mais clientes, mediante aprovação do titular.</p>
                        <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>CPF do interessado (acesso aos dados)</FormLabel>
                            <FormControl>
                                <MaskedInput mask="cpf" placeholder="000.000.000-00" {...field} onChange={handleCpfChange} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div>
                        <Label>CNPJs</Label>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2 mt-2">
                            <FormField
                                control={form.control}
                                name={`cnpjs.${index}.value`}
                                render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                    <Input placeholder="00.000.000/0000-00" {...field} onChange={(e) => handleCnpjChange(e, index)} maxLength={18} />
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
