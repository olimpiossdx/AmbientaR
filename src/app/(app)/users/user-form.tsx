
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
import { BrDateFormControl } from '@/components/form/br-date-input';
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
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { createAccessRequestsForDelegate } from '@/lib/delegate-access-requests';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { logUserAction } from '@/lib/audit-log';
import { formatCpfCnpjDisplay, maskCnpj } from '@/lib/masks';
import { lookupClientAndEmpreendedorByDocument, normalizeDocumentDigits } from '@/lib/document-lookup';
import { resolveEntityType } from '@/lib/cpf-cnpj';
import { linkClientGestaoToExistingRecords } from '@/lib/link-client-gestao-records';

const baseSchema = z.object({
  name: z.string().min(2, 'O nome é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  role: z.enum(['admin', 'client', 'cliente_autonomo', 'representative', 'consultor_representante', 'technical', 'sales', 'financial', 'gestor', 'supervisor', 'diretor_fauna', 'advogado']),
  status: z.enum(['active', 'inactive', 'pending_invite']),
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
      if (data.role !== 'representative' && data.role !== 'consultor_representante') return true;
      const hasCpfs = data.cpfs && data.cpfs.some((c: { value: string }) => (c.value || '').replace(/\D/g, '').length >= 11);
      const hasCnpjs = data.cnpjs && data.cnpjs.some((c: { value: string }) => (c.value || '').replace(/\D/g, '').length >= 14);
      return !!hasCpfs || !!hasCnpjs;
    },
    {
      message:
        'Informe ao menos um CPF ou CNPJ do titular ao qual solicita acesso.',
      path: ['cpfs'],
    },
  )
  .refine(
    (data) => {
      if (data.role !== 'cliente_autonomo') return true;
      const digits = normalizeDocumentDigits(data.userCpf);
      return digits.length === 11;
    },
    {
      message: 'Informe o CPF do usuário para vincular automaticamente ao empreendedor.',
      path: ['userCpf'],
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
      if (data.role !== 'representative' && data.role !== 'consultor_representante') return true;
      const hasCpfs = data.cpfs && data.cpfs.some((c: { value: string }) => (c.value || '').replace(/\D/g, '').length >= 11);
      const hasCnpjs = data.cnpjs && data.cnpjs.some((c: { value: string }) => (c.value || '').replace(/\D/g, '').length >= 14);
      return !!hasCpfs || !!hasCnpjs;
    },
    {
      message:
        'Informe ao menos um CPF ou CNPJ do titular ao qual solicita acesso.',
      path: ['cpfs'],
    },
  )
  .refine(
    (data) => {
      if (data.role !== 'cliente_autonomo') return true;
      const digits = normalizeDocumentDigits(data.userCpf);
      return digits.length === 11;
    },
    {
      message: 'Informe o CPF do usuário para vincular automaticamente ao empreendedor.',
      path: ['userCpf'],
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
  { value: 'client', label: 'Cliente Gestão' },
  { value: 'cliente_autonomo', label: 'Cliente Autônomo' },
  { value: 'representative', label: 'Representante' },
  { value: 'consultor_representante', label: 'Consultor-Representante' },
  { value: 'technical', label: 'Técnico' },
  { value: 'sales', label: 'Vendas' },
  { value: 'financial', label: 'Financeiro' },
  { value: 'gestor', label: 'Gestor Ambiental' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'diretor_fauna', label: 'Diretor de Fauna' },
  { value: 'advogado', label: 'Advogado' },
];

const isTitularRole = (role: UserRole | undefined) =>
  role === 'client' || role === 'cliente_autonomo';

const isClienteAutonomoRole = (role: UserRole | undefined) =>
  role === 'cliente_autonomo';

/** Documento usado no portal: autônomo usa CPF pessoal; gestão usa o mesmo para casar com cadastro existente. */
const resolvePortalDocument = (
  role: UserRole,
  cpf: string | undefined,
  userCpf: string | undefined,
): string => {
  const fromCpf = normalizeDocumentDigits(cpf);
  if (fromCpf.length === 11 || fromCpf.length === 14) return fromCpf;
  if (role === 'client' || role === 'cliente_autonomo') {
    const fromUser = normalizeDocumentDigits(userCpf);
    if (fromUser.length === 11 || fromUser.length === 14) return fromUser;
  }
  return '';
};

export function UserForm({ currentUser, onSuccess, representativeRequestedCpf, representativesForThisClient, representativeRequestedCpfsCnpjs }: UserFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [linkedClientId, setLinkedClientId] = React.useState<string | null>(currentUser?.linkedClientId ?? null);
  const [linkedEmpreendedorId, setLinkedEmpreendedorId] = React.useState<string | null>(currentUser?.linkedEmpreendedorId ?? null);
  const { toast } = useToast();
  const { auth, firestore, user: sessionProfile } = useFirebase();

  const isEditingSelf = Boolean(
    currentUser && auth?.currentUser?.uid === currentUser.id,
  );
  const isPrivilegedEditor =
    sessionProfile?.role === 'admin' || sessionProfile?.role === 'supervisor';

  const currentSchema = currentUser ? editFormSchema : createFormSchema;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(currentSchema) as any,
    defaultValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      role: currentUser?.role || 'client',
      status: currentUser?.status || 'active',
      password: '',
      confirmPassword: '',
      userCpf: currentUser?.userCpf || currentUser?.cpf || '',
      cpf: currentUser?.cpf || '',
      cpfs: (currentUser?.role === 'representative' || currentUser?.role === 'consultor_representante') && representativeRequestedCpfsCnpjs?.length
        ? representativeRequestedCpfsCnpjs.filter(v => (v || '').replace(/\D/g, '').length === 11).map(v => ({ value: v || '' }))
        : [],
      cnpjs: currentUser?.cnpjs?.length ? currentUser.cnpjs.map(c => ({ value: c })) : ((currentUser?.role === 'representative' || currentUser?.role === 'consultor_representante') && representativeRequestedCpfsCnpjs?.length ? representativeRequestedCpfsCnpjs.filter(v => (v || '').replace(/\D/g, '').length === 14).map(v => ({ value: v || '' })) : []),
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

  const handleUserCpfBlur = async () => {
    if (!firestore || (selectedRole !== 'client' && !isClienteAutonomoRole(selectedRole))) return;
    const portalDoc = resolvePortalDocument(
      selectedRole,
      form.getValues('cpf'),
      form.getValues('userCpf'),
    );
    if (portalDoc.length !== 11 && portalDoc.length !== 14) return;

    try {
      const { client, empreendedor } = await lookupClientAndEmpreendedorByDocument(
        firestore,
        portalDoc,
      );
      if (!client && !empreendedor) return;

      if (client?.id) setLinkedClientId(client.id);
      if (empreendedor?.id) setLinkedEmpreendedorId(empreendedor.id);

      if (client?.name) form.setValue('name', client.name, { shouldValidate: true });
      if (client?.email) form.setValue('email', client.email, { shouldValidate: true });

      toast({
        title: 'Cadastro existente encontrado',
        description:
          selectedRole === 'client'
            ? 'Cliente/Empreendedor já cadastrado pela consultoria. Ao salvar, a conta será vinculada pelo CPF informado.'
            : 'Os dados foram preenchidos a partir do cadastro existente. Ao salvar, sua conta será vinculada automaticamente.',
      });
    } catch (e) {
      console.warn('Busca por CPF no perfil:', e);
    }
  };
  
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    form.setValue(`cnpjs.${index}.value`, maskCnpj(e.target.value), { shouldValidate: true });
  };

  const handleCpfListItemChange = (value: string, index: number) => {
    form.setValue(`cpfs.${index}.value`, value, { shouldValidate: true });
  };

  async function onSubmit(values: UserFormValues) {
    setLoading(true);

    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const cnpjsArray = values.cnpjs?.map(c => normalizeDocumentDigits(c.value)).filter(v => v.length === 14) || [];
    const cpfsArray = (values.cpfs || []).map(c => normalizeDocumentDigits(c.value)).filter(v => v.length === 11);
    const portalDocument = resolvePortalDocument(values.role, values.cpf, values.userCpf);
    const storedCpf =
      values.role === 'representative'
        ? cpfsArray[0] || ''
        : portalDocument;

    if (currentUser) {
      // --- Update existing user logic ---
      const userRef = doc(firestore, 'users', currentUser.id);
      const updateData: Partial<AppUser> = {
        name: values.name,
        email: values.email,
        userCpf: normalizeDocumentDigits(values.userCpf),
        cpf: storedCpf,
        cnpjs: values.role === 'representative'
          ? cnpjsArray
          : storedCpf.length === 14
            ? [storedCpf]
            : cnpjsArray,
        photoURL: values.photoURL || '',
        dataNascimento: values.dataNascimento?.toISOString() || '',
        ...(isEditingSelf ? { cadastroIncompleto: false } : {}),
        ...(linkedClientId ? { linkedClientId } : {}),
        ...(linkedEmpreendedorId ? { linkedEmpreendedorId } : {}),
      };

      if (isPrivilegedEditor) {
        updateData.role = values.role;
        updateData.status = values.status;
      }

      updateDoc(userRef, updateData)
        .then(async () => {
          if (values.role === 'client' && currentUser.id) {
            await linkClientGestaoToExistingRecords(
              firestore,
              currentUser.id,
              portalDocument,
              { name: values.name, email: values.email },
              linkedClientId,
              linkedEmpreendedorId,
            );
          } else if (
            isClienteAutonomoRole(values.role) &&
            currentUser.id &&
            (portalDocument.length === 11 || portalDocument.length === 14)
          ) {
            const entityType = resolveEntityType(portalDocument);
            const clientDocId = linkedClientId || currentUser.linkedClientId || currentUser.id;
            const empreendedorDocId = linkedEmpreendedorId || currentUser.linkedEmpreendedorId || currentUser.id;
            const linkedData = {
              name: values.name,
              email: values.email,
              cpfCnpj: portalDocument,
              entityType,
              userId: currentUser.id,
            };
            const linkedEmpreendedorData = {
              name: values.name,
              email: values.email,
              cpfCnpj: portalDocument,
              entityType: [entityType],
              userId: currentUser.id,
            };
            await setDoc(doc(firestore, 'clients', clientDocId), linkedData, { merge: true });
            await setDoc(doc(firestore, 'empreendedores', empreendedorDocId), linkedEmpreendedorData, { merge: true });
            const existingClients = await getDocs(query(collection(firestore, 'clients'), where('userId', '==', currentUser.id)));
            const existingEmpreendedores = await getDocs(query(collection(firestore, 'empreendedores'), where('userId', '==', currentUser.id)));
            for (const snap of existingClients.docs) {
              await updateDoc(doc(firestore, 'clients', snap.id), linkedData);
            }
            for (const snap of existingEmpreendedores.docs) {
              await updateDoc(doc(firestore, 'empreendedores', snap.id), linkedEmpreendedorData);
            }
          }

          if (
            (values.role === 'representative' || values.role === 'consultor_representante') &&
            currentUser.id
          ) {
            const existingSet = new Set(
              (representativeRequestedCpfsCnpjs || []).map((v) =>
                normalizeDocumentDigits(v),
              ),
            );
            await createAccessRequestsForDelegate(firestore, {
              requesterUserId: currentUser.id,
              email: values.email,
              name: values.name,
              role: values.role,
              documents: [...cpfsArray, ...cnpjsArray],
              existingDigits: existingSet,
            });
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
                userCpf: normalizeDocumentDigits(values.userCpf),
                cpf: storedCpf,
                cnpjs: values.role === 'representative'
                  ? cnpjsArray
                  : storedCpf.length === 14
                    ? [storedCpf]
                    : cnpjsArray,
                photoURL: values.photoURL || '',
                dataNascimento: values.dataNascimento?.toISOString() || '',
                isOnline: false,
            };

            await setDoc(doc(firestore, 'users', newUserId), userDocData);
            logUserAction(firestore, auth, 'create_user', { newUserId: newUserId, newUserName: values.name });

            if (values.role === 'client') {
              try {
                const linked = await linkClientGestaoToExistingRecords(
                  firestore,
                  newUserId,
                  portalDocument,
                  { name: values.name, email: values.email },
                  null,
                  null,
                );
                if (linked.linkedClientId || linked.linkedEmpreendedorId) {
                  await updateDoc(doc(firestore, 'users', newUserId), {
                    ...(linked.linkedClientId ? { linkedClientId: linked.linkedClientId } : {}),
                    ...(linked.linkedEmpreendedorId
                      ? { linkedEmpreendedorId: linked.linkedEmpreendedorId }
                      : {}),
                  });
                }
              } catch (e) {
                console.error('Erro ao vincular Cliente Gestão a cadastros existentes:', e);
              }
            } else if (
              isClienteAutonomoRole(values.role) &&
              (portalDocument.length === 11 || portalDocument.length === 14)
            ) {
              try {
                const { client, empreendedor } = await lookupClientAndEmpreendedorByDocument(
                  firestore,
                  portalDocument,
                );
                const entityType = resolveEntityType(portalDocument);
                const linkedData = {
                  name: values.name,
                  cpfCnpj: portalDocument,
                  entityType,
                  email: values.email,
                  userId: newUserId,
                };
                const linkedEmpreendedorData = {
                  name: values.name,
                  email: values.email,
                  phone: '',
                  address: '',
                  cpfCnpj: portalDocument,
                  entityType: [entityType],
                  userId: newUserId,
                };

                if (client?.id || empreendedor?.id) {
                  const linked = await linkClientGestaoToExistingRecords(
                    firestore,
                    newUserId,
                    portalDocument,
                    { name: values.name, email: values.email },
                    client?.id ?? null,
                    empreendedor?.id ?? null,
                  );
                  await updateDoc(doc(firestore, 'users', newUserId), {
                    ...(linked.linkedClientId ? { linkedClientId: linked.linkedClientId } : {}),
                    ...(linked.linkedEmpreendedorId
                      ? { linkedEmpreendedorId: linked.linkedEmpreendedorId }
                      : {}),
                  });
                } else {
                  await setDoc(doc(firestore, 'clients', newUserId), linkedData, { merge: true });
                  await setDoc(doc(firestore, 'empreendedores', newUserId), linkedEmpreendedorData, {
                    merge: true,
                  });
                }
              } catch (e) {
                console.error('Erro ao criar cliente/empreendedor automático:', e);
              }
            }

            if (values.role === 'representative' || values.role === 'consultor_representante') {
              await createAccessRequestsForDelegate(firestore, {
                requesterUserId: newUserId,
                email: values.email,
                name: values.name,
                role: values.role,
                documents: [...cpfsArray, ...cnpjsArray],
              });
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
                ? 'Este e-mail ainda existe no login (Firebase Auth), mesmo que o perfil tenha sido apagado. Um administrador pode usar "Liberar e-mail bloqueado" em Usuários ou apagar a conta em Firebase Console → Authentication.'
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
                <div className="form-scroll-body space-y-4">
                    <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                        <h3 className="text-sm font-medium">Checagem inicial — CPF</h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedRole === 'representative'
                            ? 'Informe o CPF pessoal do representante. Os CPFs/CNPJs dos titulares são informados mais abaixo.'
                            : selectedRole === 'cliente_autonomo'
                              ? 'O CPF pessoal vincula automaticamente a conta ao cadastro de empreendedor com o mesmo documento.'
                              : selectedRole === 'client'
                                ? 'O CPF pessoal identifica o usuário e casa com empreendedores já cadastrados pela consultoria (sem campo extra de vínculo).'
                                : 'Informe o CPF pessoal do usuário (documento de identificação).'}
                        </p>
                    <FormField
                    control={form.control}
                    name="userCpf"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CPF do Usuário (pessoal)</FormLabel>
                        <FormControl>
                            <MaskedInput
                              mask="cpf"
                              placeholder="000.000.000-00"
                              {...field}
                              onChange={handleUserCpfChange}
                              onBlur={() => {
                                field.onBlur();
                                void handleUserCpfBlur();
                              }}
                            />
                        </FormControl>
                        <FormDescription>
                          {selectedRole === 'representative'
                            ? 'Documento do próprio usuário. O vínculo a titulares é feito na seção de CPFs/CNPJs abaixo.'
                            : selectedRole === 'cliente_autonomo'
                              ? 'Usado para criar ou ligar Cliente e Empreendedor ao salvar.'
                              : selectedRole === 'client'
                                ? 'Deve coincidir com o CPF/CNPJ do empreendedor já cadastrado na consultoria.'
                                : 'Documento de identificação do usuário.'}
                        </FormDescription>
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
                    
                    {(!isEditingSelf || isPrivilegedEditor) && (
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
                    )}
                    {selectedRole !== 'admin' && (
                    <FormField
                        control={form.control}
                        name="dataNascimento"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                                <FormLabel>Data de Nascimento (Opcional)</FormLabel>
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
                    )}
                    {isTitularRole(selectedRole) && (
                    <div className='space-y-4 rounded-md border p-4'>
                        <h3 className="text-sm font-medium">Acesso aos seus dados (Cliente titular)</h3>
                        <p className='text-sm text-muted-foreground'>Como titular, você aprova ou rejeita pedidos de representantes que informarem o mesmo CPF/CNPJ vinculado ao seu cadastro.</p>
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
                            <p className="text-xs text-muted-foreground">Aprove ou rejeite em Configurações → Usuários (Meu Perfil) → consentimento de acesso.</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Nenhum representante solicitou acesso no momento. Quando alguém solicitar, aparecerá aqui e em Meu Perfil.</p>
                        )}
                    </div>
                    )}
                    {(form.watch('role') === 'representative' ||
                      form.watch('role') === 'consultor_representante') && (
                    <div className='space-y-4 rounded-md border p-4'>
                        <h3 className="text-sm font-medium">CPFs/CNPJs ao qual solicito acesso</h3>
                        <p className='text-sm text-muted-foreground'>
                          Informe o CPF ou CNPJ de cada titular ou empreendedor cujos dados você deseja acessar.
                          O titular aprovará (ou não) em Configurações → Usuários → consentimento de acesso.
                        </p>
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
                    {(!isEditingSelf || isPrivilegedEditor) && (
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
                    )}
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
