
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Project, Empreendedor } from '@/lib/types';
import { useFirebase, errorEmitter, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { assertCanCreateEmpreendimentoAction } from '@/app/(app)/projects/package-actions';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormDefault } from './form-default';
import { FormListagemA } from './form-listagem-a';
import { FormListagemB } from './form-listagem-b';
import { FormListagemC } from './form-listagem-c';
import { FormListagemD } from './form-listagem-d';
import { FormListagemE } from './form-listagem-e';
import { FormListagemF } from './form-listagem-f';
import { FormListagemG } from './form-listagem-g';
import { FormListagemH } from './form-listagem-h';
import { onListagemTabSelect } from './listagem-form-registry-index';
import { cleanEmptyValues } from '@/lib/utils';
import _ from 'lodash';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { isClienteAutonomo, isClientePortalRole } from '@/lib/role-guards';
import { resolvePortalAuthUid } from '@/lib/auth-user-id';
import { usePortalEmpreendedorIds } from '@/hooks/use-portal-empreendedor-ids';
import { Alert, AlertDescription } from '@/components/ui/alert';


const formSchema = z.object({
  empreendedorId: z.string().min(1, 'Selecione um empreendedor responsável.'),
  userId: z.string().optional(),
  activity: z.string().min(1, 'A atividade principal é obrigatória.'),
  subActivity: z.string().optional(),
  propertyName: z.string().min(1, "O nome da propriedade é obrigatório."),
  fantasyName: z.string().optional(),
  status: z.enum(['Válida', 'Vencida', 'Em Renovação', 'Suspensa', 'Cancelada', 'Em Andamento']).optional(),
  matricula: z.string().optional(),
  comarca: z.string().optional(),
  address: z.string().optional(),
  numero: z.string().optional(),
  uf: z.string().optional(),
  municipio: z.string().optional(),
  cep: z.string().optional(),
  district: z.string().optional(),
  ownerCondition: z.array(z.string()).optional(),
  geographicLocation: z.object({
    datum: z.enum(['SAD-69', 'WGS-84', 'Córrego Alegre'], { required_error: 'O datum é obrigatório.'}),
    format: z.enum(['Lat/Long', 'UTM'], { required_error: 'O formato da coordenada é obrigatório.'}),
    latLong: z.object({
      lat: z.object({ grau: z.string().optional(), min: z.string().optional(), seg: z.string().optional() }),
      long: z.object({ grau: z.string().optional(), min: z.string().optional(), seg: z.string().optional() }),
    }).optional(),
    utm: z.object({
      x: z.string().optional(),
      y: z.string().optional(),
      fuso: z.enum(['22', '23', '24'], { required_error: 'O fuso é obrigatório.'}),
    }).optional(),
  }).optional(),
}).passthrough();

type FormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  currentItem?: Project | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const getInitialValues = (currentItem?: Project | null): FormValues => {
    const defaults = {
        empreendedorId: '',
        userId: '',
        activity: 'Dados Gerais',
        subActivity: '',
        propertyName: '',
        fantasyName: '',
        status: 'Em Andamento',
        matricula: '',
        comarca: '',
        address: '',
        numero: '',
        uf: '',
        municipio: '',
        cep: '',
        district: '',
        ownerCondition: [],
        geographicLocation: {
            datum: 'WGS-84',
            format: 'UTM',
            latLong: { lat: { grau: '', min: '', seg: '' }, long: { grau: '', min: '', seg: '' } },
            utm: { x: '', y: '', fuso: '23' },
            local: '',
            additionalLocationInfo: '',
            hydrographicBasin: '',
            hydrographicSubBasin: '',
            upgrh: '',
            nearestWaterCourse: '',
        },
        locationalRestrictions: {
            inKarstArea: false,
            inFluvialLacustrineArea: false,
        },
        criteriosDN130: {
            compromissos: [],
            praticasDesenvolvidas: [],
        },
        jobCreation: {},
        projectArea: {},
        atividadesAgricolas: {},
        atividadesFlorestais: {},
    };

    if (currentItem) {
        // Use lodash merge for deep merging, which is generally safe, but ensure defaults are solid
        return _.merge({}, defaults, currentItem);
    }

    return defaults as FormValues;
};


export function ProjectForm({ currentItem, onSuccess, onCancel }: ProjectFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();
  const { user } = useAuth();

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Empreendedor>(empreendedoresQuery);

  const portalEmpreendedorIds = usePortalEmpreendedorIds();
  const isAutonomo = isClienteAutonomo(user?.role);
  /** Admin, gestor, supervisor, etc.: vínculo centralizado no topo; autônomo: preenchimento automático. */
  const usesCentralEmpreendedorResponsavel =
    Boolean(user) && (!isClientePortalRole(user?.role) || isAutonomo);

  const empreendedoresSorted = React.useMemo(
    () => [...(clients || [])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [clients],
  );

  const empreendedoresMap = React.useMemo(
    () => new Map(empreendedoresSorted.map((e) => [e.id, e])),
    [empreendedoresSorted],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(currentItem),
  });

  const applyEmpreendedorLink = React.useCallback(
    (empreendedorId: string) => {
      form.setValue('empreendedorId', empreendedorId, { shouldValidate: true });
      const emp = empreendedoresMap.get(empreendedorId);
      form.setValue('userId', emp?.userId?.trim() || '', { shouldValidate: false });
    },
    [form, empreendedoresMap],
  );

  React.useEffect(() => {
    if (!isAutonomo || !user || portalEmpreendedorIds === undefined) return;
    if (currentItem?.empreendedorId) return;

    const authUid = resolvePortalAuthUid(user);
    if (authUid) {
      form.setValue('userId', authUid, { shouldValidate: false });
    }

    const validIds = portalEmpreendedorIds.filter(
      (id) => id && !id.startsWith('invalid-placeholder'),
    );
    if (validIds.length === 1) {
      applyEmpreendedorLink(validIds[0]);
    } else if (validIds.length > 1) {
      const preferred =
        empreendedoresSorted.find((e) => validIds.includes(e.id))?.id ?? validIds[0];
      applyEmpreendedorLink(preferred);
    }
  }, [
    isAutonomo,
    user,
    portalEmpreendedorIds,
    currentItem?.empreendedorId,
    form,
    applyEmpreendedorLink,
    empreendedoresSorted,
  ]);

  async function onSubmit(values: FormValues) {
    if (isAutonomo && !values.empreendedorId?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empreendedor não vinculado',
        description:
          'Cadastre seu empreendedor em Cadastro → Empreendedores antes de salvar o empreendimento.',
      });
      return;
    }

    setLoading(true);

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = cleanEmptyValues(values);


    if (currentItem) {
      const docRef = doc(firestore, 'projects', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({
            title: 'Projeto atualizado!',
            description: 'As informações foram salvas com sucesso.',
          });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      if (user && auth?.currentUser) {
        try {
          const idToken = await auth.currentUser.getIdToken();
          const gate = await assertCanCreateEmpreendimentoAction(idToken);
          if (!gate.ok) {
            toast({
              variant: 'destructive',
              title: 'Limite do plano',
              description: gate.message,
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          toast({
            variant: 'destructive',
            title: 'Não foi possível validar o plano',
            description:
              e instanceof Error ? e.message : 'Tente novamente em instantes.',
          });
          setLoading(false);
          return;
        }
      }

      const collectionRef = collection(firestore, 'projects');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({
            title: 'Projeto criado!',
            description: `O projeto ${values.propertyName} foi adicionado com sucesso.`,
          });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: dataToSave,
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }
  
  const selectedEmpreendedorId = form.watch('empreendedorId');
  const autonomoEmpreendedor = selectedEmpreendedorId
    ? empreendedoresMap.get(selectedEmpreendedorId)
    : undefined;
  const autonomoMissingEmpreendedor =
    isAutonomo &&
    portalEmpreendedorIds !== undefined &&
    (portalEmpreendedorIds.length === 0 ||
      portalEmpreendedorIds.every((id) => id.startsWith('invalid-placeholder')));

  const formProps = {
    form,
    clients: clients || [],
    isLoadingClients,
    hideEmpreendedorSelect: usesCentralEmpreendedorResponsavel,
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
           <Tabs defaultValue="default" className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="h-auto flex-wrap justify-start">
                  <TabsTrigger value="default" onClick={() => form.setValue('activity', 'Dados Gerais')}>Dados Gerais</TabsTrigger>
                  <TabsTrigger value="listagem-a" onClick={() => onListagemTabSelect(form, 'A')}>Listagem A</TabsTrigger>
                  <TabsTrigger value="listagem-b" onClick={() => onListagemTabSelect(form, 'B')}>Listagem B</TabsTrigger>
                  <TabsTrigger value="listagem-c" onClick={() => onListagemTabSelect(form, 'C')}>Listagem C</TabsTrigger>
                  <TabsTrigger value="listagem-d" onClick={() => onListagemTabSelect(form, 'D')}>Listagem D</TabsTrigger>
                  <TabsTrigger value="listagem-e" onClick={() => onListagemTabSelect(form, 'E')}>Listagem E</TabsTrigger>
                  <TabsTrigger value="listagem-f" onClick={() => onListagemTabSelect(form, 'F')}>Listagem F</TabsTrigger>
                  <TabsTrigger value="listagem-g" onClick={() => onListagemTabSelect(form, 'G')}>Listagem G</TabsTrigger>
                  <TabsTrigger value="listagem-h" onClick={() => onListagemTabSelect(form, 'H')}>Listagem H</TabsTrigger>
              </TabsList>
              <div className="form-scroll-body mt-4">
                   {usesCentralEmpreendedorResponsavel ? (
                     <div className="space-y-4 rounded-md border p-4 mb-4">
                       <h3 className="text-lg font-medium">Responsável pelo Projeto</h3>
                       {isAutonomo ? (
                         <>
                           {autonomoMissingEmpreendedor ? (
                             <Alert variant="destructive">
                               <AlertDescription>
                                 Não encontramos seu cadastro de empreendedor. Conclua o cadastro em
                                 Empreendedores antes de lançar um empreendimento.
                               </AlertDescription>
                             </Alert>
                           ) : (
                             <FormItem>
                               <FormLabel>Empreendedor responsável</FormLabel>
                               <FormControl>
                                 <Input
                                   readOnly
                                   disabled
                                   value={
                                     autonomoEmpreendedor?.name ||
                                     user?.name ||
                                     'Carregando...'
                                   }
                                 />
                               </FormControl>
                               <FormDescription>
                                 Vinculado automaticamente ao seu perfil de cliente autônomo.
                               </FormDescription>
                             </FormItem>
                           )}
                           <FormField
                             control={form.control}
                             name="empreendedorId"
                             render={() => <FormMessage />}
                           />
                         </>
                       ) : (
                         <FormField
                           control={form.control}
                           name="empreendedorId"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel>Empreendedor responsável</FormLabel>
                               <Select
                                 onValueChange={applyEmpreendedorLink}
                                 value={field.value || ''}
                                 disabled={isLoadingClients}
                               >
                                 <FormControl>
                                   <SelectTrigger>
                                     <SelectValue
                                       placeholder={
                                         isLoadingClients
                                           ? 'Carregando...'
                                           : 'Selecione um empreendedor'
                                       }
                                     />
                                   </SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                   {empreendedoresSorted.map((emp) => (
                                     <SelectItem key={emp.id} value={emp.id}>
                                       {emp.name}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                               <FormDescription>
                                 Associe este empreendimento ao empreendedor cadastrado. As
                                 notificações serão enviadas à conta vinculada a ele, quando existir.
                               </FormDescription>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                       )}
                     </div>
                   ) : null}
                   <TabsContent value="default" className="mt-4">
                       <FormDefault {...formProps} />
                   </TabsContent>
                   <TabsContent value="listagem-a" className="mt-0">
                      <FormListagemA form={form} />
                   </TabsContent>
                   <TabsContent value="listagem-b" className="mt-0">
                      <FormListagemB form={form} />
                   </TabsContent>
                   <TabsContent value="listagem-c" className="mt-0">
                      <FormListagemC form={form} />
                   </TabsContent>
                   <TabsContent value="listagem-d" className="mt-0">
                      <FormListagemD form={form} />
                   </TabsContent>
                   <TabsContent value="listagem-e" className="mt-0">
                      <FormListagemE form={form} />
                   </TabsContent>
                   <TabsContent value="listagem-f" className="mt-0">
                      <FormListagemF form={form} />
                   </TabsContent>
                   <TabsContent value="listagem-g" className="mt-0">
                      <FormListagemG form={form} />
                   </TabsContent>
                   <TabsContent value="listagem-h" className="mt-0">
                      <FormListagemH form={form} />
                   </TabsContent>
              </div>
              <div className="flex justify-end space-x-2 pt-4 mt-auto border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      onCancel?.();
                    }}
                    disabled={loading}
                  >
                      Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || (isAutonomo && autonomoMissingEmpreendedor)}
                  >
                      {loading ? (
                      <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                      </>
                      ) : (
                      'Salvar'
                      )}
                  </Button>
              </div>
          </Tabs>
        </form>
      </Form>
    </>
  );
}
