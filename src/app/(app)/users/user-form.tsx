
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
  FormMessage} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BrDateFormControl } from '@/components/form/br-date-input';
import { MaskedInput } from '@/components/ui/masked-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, EyeOff, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppUser, UserRole, AccessRequest } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { stripUndefinedDeep } from '@/lib/firestore-payload';
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs} from 'firebase/firestore';
import {
  collectExistingDelegateRequestDigits,
  createAccessRequestsForDelegate} from '@/lib/delegate-access-requests';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { logUserAction } from '@/lib/audit-log';
import { formatCpfCnpjDisplay } from '@/lib/masks';
import { lookupClientAndEmpreendedorByDocument, normalizeDocumentDigits } from '@/lib/document-lookup';
import { isValidCpfCnpj, resolveEntityType } from '@/lib/cpf-cnpj';
import { linkClientGestaoToExistingRecords } from '@/lib/link-client-gestao-records';
import {
  buildTitularProfileDocumentFields,
  isTitularPortalRole,
  isValidTitularLinkDocument,
  resolveTitularDocumentFromProfile,
  splitAccessDocuments} from '@/lib/titular-profile-document';

const baseSchema = z.object({
  name: z.string().min(2, 'O nome é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  role: z.enum(['admin', 'client', 'cliente_autonomo', 'representative', 'consultor_representante', 'technical', 'sales', 'financial', 'gestor', 'supervisor', 'diretor_fauna', 'advogado']),
  status: z.enum(['active', 'inactive', 'pending_invite']),
  userCpf: z.string().optional(),
  titularDocument: z.string().optional(),
  accessDocuments: z.array(z.object({ value: z.string() })).optional(),
  dataNascimento: z.date().optional(),
  photoURL: z.string().optional()});

const createFormSchema = baseSchema
  .extend({
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z
      .string()
      .min(6, 'A confirmação de senha deve ter pelo menos 6 caracteres.')})
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword']})
  .refine(
    (data) => {
      if (data.role !== 'representative' && data.role !== 'consultor_representante') return true;
      const docs =
        data.accessDocuments
          ?.map((entry) => normalizeDocumentDigits(entry.value))
          .filter((digits) => isValidCpfCnpj(digits)) ?? [];
      return docs.length > 0;
    },
    {
      message:
        'Informe ao menos um CPF ou CNPJ do titular ao qual solicita acesso.',
      path: ['accessDocuments']},
  )
  .refine(
    (data) => {
      if (!isTitularPortalRole(data.role)) return true;
      return isValidTitularLinkDocument(data.titularDocument);
    },
    {
      message: 'Informe um CPF ou CNPJ válido do empreendedor/titular.',
      path: ['titularDocument']},
  );

const editFormSchema = baseSchema
  .extend({
    password: z
      .string()
      .optional()
      .refine((val) => val === '' || !val || val.length >= 6, {
        message: 'A senha deve ter pelo menos 6 caracteres se for alterada.',
        path: ['password']}),
    confirmPassword: z.string().optional()})
  .refine(
    (data) => {
      if (!data.password && !data.confirmPassword) return true;
      return data.password === data.confirmPassword;
    },
    {
      message: 'As senhas não coincidem.',
      path: ['confirmPassword']},
  )
  .refine(
    (data) => {
      if (data.role !== 'representative' && data.role !== 'consultor_representante') return true;
      const docs =
        data.accessDocuments
          ?.map((entry) => normalizeDocumentDigits(entry.value))
          .filter((digits) => isValidCpfCnpj(digits)) ?? [];
      return docs.length > 0;
    },
    {
      message:
        'Informe ao menos um CPF ou CNPJ do titular ao qual solicita acesso.',
      path: ['accessDocuments']},
  )
  .refine(
    (data) => {
      if (!isTitularPortalRole(data.role)) return true;
      return isValidTitularLinkDocument(data.titularDocument);
    },
    {
      message: 'Informe um CPF ou CNPJ válido do empreendedor/titular.',
      path: ['titularDocument']},
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

const isClienteAutonomoRole = (role: UserRole | undefined) =>
  role === 'cliente_autonomo';

const isDelegateRole = (role: UserRole | undefined) =>
  role === 'representative' || role === 'consultor_representante';

const resolvePortalDocument = (titularDocument: string | undefined): string => {
  const digits = normalizeDocumentDigits(titularDocument);
  if (digits.length === 11 || digits.length === 14) return digits;
  return '';
};

function buildDefaultAccessDocuments(
  currentUser: AppUser | null | undefined,
  representativeRequestedCpfsCnpjs?: string[],
): { value: string }[] {
  if (representativeRequestedCpfsCnpjs?.length) {
    return representativeRequestedCpfsCnpjs.map((value) => ({ value: value || '' }));
  }
  if (!currentUser || !isDelegateRole(currentUser.role)) return [];

  const docs: string[] = [];
  if (currentUser.cpf) docs.push(currentUser.cpf);
  currentUser.cnpjs?.forEach((cnpj) => {
    if (cnpj) docs.push(cnpj);
  });
  return docs.map((value) => ({ value }));
}

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
      userCpf: currentUser?.userCpf || '',
      titularDocument: resolveTitularDocumentFromProfile(currentUser),
      accessDocuments: buildDefaultAccessDocuments(currentUser, representativeRequestedCpfsCnpjs),
      dataNascimento: currentUser?.dataNascimento ? new Date(currentUser.dataNascimento) : undefined,
      photoURL: currentUser?.photoURL || ''}});

  const {
    fields: accessDocumentFields,
    append: accessDocumentAppend,
    remove: accessDocumentRemove} = useFieldArray({
    control: form.control,
    name: 'accessDocuments'});
  
  const selectedRole = form.watch('role');

  const handleUserCpfChange = (value: string) => {
    form.setValue('userCpf', value, { shouldValidate: true });
  };

  const handleTitularDocumentBlur = async () => {
    if (!firestore || !isTitularPortalRole(selectedRole)) return;
    const portalDoc = resolvePortalDocument(form.getValues('titularDocument'));
    if (!isValidTitularLinkDocument(portalDoc)) return;

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
            ? 'Cliente/Empreendedor já cadastrado pela consultoria. Ao salvar, a conta será vinculada pelo documento informado.'
            : 'Os dados foram preenchidos a partir do cadastro existente. Ao salvar, a conta será vinculada automaticamente.'});
    } catch (e) {
      console.warn('Busca por documento no perfil:', e);
    }
  };

  const handleAccessDocumentChange = (value: string, index: number) => {
    form.setValue(`accessDocuments.${index}.value`, value, { shouldValidate: true });
  };

  async function onSubmit(values: UserFormValues) {
    setLoading(true);

    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const accessDocumentValues =
      values.accessDocuments?.map((entry) => entry.value).filter(Boolean) ?? [];
    const { cpfs: cpfsArray, cnpjs: cnpjsArray } = splitAccessDocuments(accessDocumentValues);
    const portalDocument = resolvePortalDocument(values.titularDocument);
    const titularProfileFields = isTitularPortalRole(values.role)
      ? buildTitularProfileDocumentFields(values.titularDocument)
      : null;
    const personalCpf = normalizeDocumentDigits(values.userCpf);
    const storedCpf = isDelegateRole(values.role)
      ? cpfsArray[0] || personalCpf
      : titularProfileFields?.cpf ?? portalDocument;

    if (currentUser) {
      // --- Update existing user logic ---
      const userRef = doc(firestore, 'users', currentUser.id);
      const updateData = stripUndefinedDeep({
        name: values.name,
        email: values.email,
        userCpf: personalCpf,
        cpf: titularProfileFields?.cpf ?? storedCpf,
        cnpjs: titularProfileFields?.cnpjs ?? (isDelegateRole(values.role) ? cnpjsArray : []),
        ...(titularProfileFields
          ? {
              titularDocument: titularProfileFields.titularDocument,
              titularType: titularProfileFields.titularType ?? undefined}
          : {}),
        photoURL: values.photoURL || '',
        dataNascimento: values.dataNascimento?.toISOString() || '',
        ...(isEditingSelf ? { cadastroIncompleto: false } : {}),
        ...(linkedClientId ? { linkedClientId } : {}),
        ...(linkedEmpreendedorId ? { linkedEmpreendedorId } : {})}) as Partial<AppUser>;

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
              userId: currentUser.id};
            const linkedEmpreendedorData = {
              name: values.name,
              email: values.email,
              cpfCnpj: portalDocument,
              entityType: [entityType],
              userId: currentUser.id};
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
            const requesterUserId = currentUser.uid || currentUser.id;
            const existingSet = await collectExistingDelegateRequestDigits(
              firestore,
              requesterUserId,
              {
                extraDigits: representativeRequestedCpfsCnpjs,
                profile: currentUser},
            );
            await createAccessRequestsForDelegate(firestore, {
              requesterUserId,
              email: values.email,
              name: values.name,
              role: values.role,
              documents: [...cpfsArray, ...cnpjsArray],
              existingDigits: existingSet});
          }
          toast({
            title: 'Usuário atualizado!',
            description: 'As informações do usuário foram salvas com sucesso.'});
          logUserAction(firestore, auth, 'update_user', { userId: currentUser.id, userName: values.name });
          onSuccess?.();
        })
        .catch((error) => {
          handleFirestoreFormError(error, {
            toast,
            title: 'Erro ao salvar usuário',
            context: {
              path: userRef.path,
              operation: 'update',
              requestResourceData: updateData}});
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
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
              throw new Error('Sessão inválida. Faça login novamente.');
            }

            const normalizedEmail = values.email.trim().toLowerCase();

            const res = await fetch('/api/admin/create-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                email: normalizedEmail,
                password: values.password,
                name: values.name,
                role: values.role,
                status: values.status,
                userCpf: personalCpf,
                cpf: titularProfileFields?.cpf ?? storedCpf,
                cnpjs:
                  titularProfileFields?.cnpjs ??
                  (isDelegateRole(values.role) ? cnpjsArray : []),
                titularDocument: titularProfileFields?.titularDocument,
                titularType: titularProfileFields?.titularType,
                photoURL: values.photoURL || '',
                dataNascimento: values.dataNascimento?.toISOString() || '',
              }),
            });

            const data = (await res.json()) as {
              success?: boolean;
              error?: string;
              result?: { userId: string; repairedAuth?: boolean };
            };

            if (!res.ok || !data.success || !data.result?.userId) {
              throw new Error(
                data.error || 'Não foi possível criar o usuário no servidor.',
              );
            }

            const newUserId = data.result.userId;
            const repairedAuth = Boolean(data.result.repairedAuth);

            logUserAction(firestore, auth, repairedAuth ? 'repair_user_auth' : 'create_user', {
              newUserId,
              newUserName: values.name,
            });

            if (values.role === 'client') {
              try {
                const linked = await linkClientGestaoToExistingRecords(
                  firestore,
                  newUserId,
                  portalDocument,
                  { name: values.name, email: normalizedEmail },
                  null,
                  null,
                );
                if (linked.linkedClientId || linked.linkedEmpreendedorId) {
                  await updateDoc(doc(firestore, 'users', newUserId), {
                    ...(linked.linkedClientId ? { linkedClientId: linked.linkedClientId } : {}),
                    ...(linked.linkedEmpreendedorId
                      ? { linkedEmpreendedorId: linked.linkedEmpreendedorId }
                      : {})});
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
                  email: normalizedEmail,
                  userId: newUserId};
                const linkedEmpreendedorData = {
                  name: values.name,
                  email: normalizedEmail,
                  phone: '',
                  address: '',
                  cpfCnpj: portalDocument,
                  entityType: [entityType],
                  userId: newUserId};

                if (client?.id || empreendedor?.id) {
                  const linked = await linkClientGestaoToExistingRecords(
                    firestore,
                    newUserId,
                    portalDocument,
                    { name: values.name, email: normalizedEmail },
                    client?.id ?? null,
                    empreendedor?.id ?? null,
                  );
                  await updateDoc(doc(firestore, 'users', newUserId), {
                    ...(linked.linkedClientId ? { linkedClientId: linked.linkedClientId } : {}),
                    ...(linked.linkedEmpreendedorId
                      ? { linkedEmpreendedorId: linked.linkedEmpreendedorId }
                      : {})});
                } else {
                  await setDoc(doc(firestore, 'clients', newUserId), linkedData, { merge: true });
                  await setDoc(doc(firestore, 'empreendedores', newUserId), linkedEmpreendedorData, {
                    merge: true});
                }
              } catch (e) {
                console.error('Erro ao criar cliente/empreendedor automático:', e);
              }
            }

            if (values.role === 'representative' || values.role === 'consultor_representante') {
              const existingSet = await collectExistingDelegateRequestDigits(
                firestore,
                newUserId,
                { profile: { cpf: storedCpf, cnpjs: cnpjsArray } },
              );
              await createAccessRequestsForDelegate(firestore, {
                requesterUserId: newUserId,
                email: normalizedEmail,
                name: values.name,
                role: values.role,
                documents: [...cpfsArray, ...cnpjsArray],
                existingDigits: existingSet});
            }

            toast({
              title: repairedAuth ? 'Login reparado!' : 'Usuário criado!',
              description: repairedAuth
                ? `A conta de ${values.name} já existia no sistema, mas sem login. O acesso foi restaurado com a senha informada.`
                : `As informações de ${values.name} foram salvas com sucesso.`});
            
            form.reset();
            onSuccess?.();

        } catch (error: unknown) {
             toast({
              variant: 'destructive',
              title: 'Oh, não! Algo deu errado.',
              description:
                error instanceof Error
                  ? error.message
                  : 'Não foi possível criar o usuário.'});
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
                        <h3 className="text-sm font-medium">
                          {isTitularPortalRole(selectedRole)
                            ? 'Vínculo com empreendedor'
                            : 'Identificação do usuário'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {isTitularPortalRole(selectedRole)
                            ? 'Informe o CPF ou CNPJ do empreendedor/titular já cadastrado (ou a ser criado). O login da conta é feito pelo e-mail abaixo.'
                            : isDelegateRole(selectedRole)
                              ? 'Informe o CPF pessoal do representante. Os CPFs/CNPJs dos titulares são informados mais abaixo.'
                              : 'Informe o CPF pessoal do usuário (documento de identificação).'}
                        </p>
                    {isTitularPortalRole(selectedRole) ? (
                    <FormField
                    control={form.control}
                    name="titularDocument"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CPF ou CNPJ do empreendedor/titular</FormLabel>
                        <FormControl>
                            <MaskedInput
                              mask="cpfCnpj"
                              placeholder="000.000.000-00 ou 00.000.000/0000-00"
                              {...field}
                              onBlur={() => {
                                field.onBlur();
                                void handleTitularDocumentBlur();
                              }}
                            />
                        </FormControl>
                        <FormDescription>
                          O sistema detecta automaticamente CPF (11 dígitos) ou CNPJ (14 dígitos), como no Cadastre-se.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    ) : (
                    <FormField
                    control={form.control}
                    name="userCpf"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CPF do usuário (pessoal)</FormLabel>
                        <FormControl>
                            <MaskedInput
                              mask="cpf"
                              placeholder="000.000.000-00"
                              {...field}
                              onChange={handleUserCpfChange}
                            />
                        </FormControl>
                        <FormDescription>
                          {isDelegateRole(selectedRole)
                            ? 'Documento do próprio usuário. O vínculo a titulares é feito na seção de documentos abaixo.'
                            : 'Documento de identificação do usuário.'}
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    )}
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
                    {isTitularPortalRole(selectedRole) && (
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
                    {isDelegateRole(form.watch('role')) && (
                    <div className='space-y-4 rounded-md border p-4'>
                        <h3 className="text-sm font-medium">CPFs/CNPJs aos quais solicita acesso</h3>
                        <p className='text-sm text-muted-foreground'>
                          Informe o CPF ou CNPJ de cada titular ou empreendedor cujos dados você deseja acessar.
                          O titular aprovará (ou não) em Configurações → Usuários → consentimento de acesso.
                        </p>
                        <div>
                          <Label>Documentos dos titulares</Label>
                          {accessDocumentFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2 mt-2">
                              <FormField
                                control={form.control}
                                name={`accessDocuments.${index}.value`}
                                render={({ field: f }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <MaskedInput
                                        mask="cpfCnpj"
                                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                        {...f}
                                        onChange={(val) => handleAccessDocumentChange(val, index)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="button" variant="destructive" size="icon" onClick={() => accessDocumentRemove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => accessDocumentAppend({ value: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar documento
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
