

'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage} from '@/components/ui/form';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { RCA, Empreendedor as Client, Project } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';

import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { cleanEmptyValues } from '@/lib/utils';
import {
  RCA_LISTAGEM_ACTIVITIES,
  RCA_SUBACTIVITIES} from '@/lib/rca-listagem-catalog';
import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';
import {
  getRcaInitialValues,
  type RcaFormValues} from './lib/rca-form-initial-values';


const formSchema = z.object({
  activity: z.string().min(1, "A seleção da listagem é obrigatória."),
  subActivity: z.string().optional(),
  empreendedor: z.object({}).passthrough(),
  empreendimento: z.object({}).passthrough()}).passthrough();

interface RcaFormLegacyProps {
  currentItem?: RCA | null;
  onSuccess: () => void;
  /** Pré-seleciona listagem B–H na criação (vindo de ?listagem=). */
  initialListagemCode?: string;
}

const activities = RCA_LISTAGEM_ACTIVITIES.filter(
  (a) =>
    a !== LISTAGEM_ACTIVITY_BY_CODE.A &&
    a !== LISTAGEM_ACTIVITY_BY_CODE.B &&
    a !== LISTAGEM_ACTIVITY_BY_CODE.C &&
    a !== LISTAGEM_ACTIVITY_BY_CODE.D &&
    a !== LISTAGEM_ACTIVITY_BY_CODE.E &&
    a !== LISTAGEM_ACTIVITY_BY_CODE.F &&
    a !== LISTAGEM_ACTIVITY_BY_CODE.G &&
    a !== LISTAGEM_ACTIVITY_BY_CODE.H,
);

const subActivities = RCA_SUBACTIVITIES;

export function RcaFormLegacy({
  currentItem,
  onSuccess,
  initialListagemCode}: RcaFormLegacyProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();


  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(empreendedoresQuery);
  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const initialActivity =
    initialListagemCode && !currentItem
      ? LISTAGEM_ACTIVITY_BY_CODE[initialListagemCode.toUpperCase()]
      : undefined;

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...getRcaInitialValues(currentItem),
      ...(initialActivity ? { activity: initialActivity } : {})}});

  const selectedActivity = form.watch('activity');
  const selectedSubActivity = form.watch('subActivity');

  async function handleSave(status: 'Rascunho' | 'Aprovado') {
    setLoading(true);

    const isValid = await form.trigger();
    if (!isValid && status === 'Aprovado') {
        toast({
            variant: 'destructive',
            title: 'Formulário Inválido',
            description: 'Por favor, corrija os erros antes de concluir.'});
        setLoading(false);
        return;
    }
    
    const values = form.getValues() as RcaFormValues;

    if (!firestore) {
      toast({ variant: 'destructive', title: 'Firebase não inicializado.' });
      setLoading(false);
      return;
    }
    
    const termoReferencia = values.termoReferencia as { dataEmissao?: string | Date } | undefined;
    const dataToSave = cleanEmptyValues({
      ...values,
      status: status,
      termoReferencia: {
        ...(termoReferencia || {}),
        dataEmissao: termoReferencia?.dataEmissao ? new Date(termoReferencia.dataEmissao).toISOString() : null}
    });

    try {
        if (currentItem) {
          const docRef = doc(firestore, 'rcas', currentItem.id);
          await updateDoc(docRef, dataToSave);
          toast({ title: 'RCA atualizado!', description: 'O relatório foi salvo com sucesso.' });
        } else {
          const collectionRef = collection(firestore, 'rcas');
          await addDoc(collectionRef, dataToSave);
          toast({ title: 'RCA criado!', description: `O relatório foi criado com sucesso.` });
        }
        onSuccess();
    } catch (error) {
      handleFirestoreFormError(error, {
        toast,
        title: 'Erro ao salvar RCA',
        context: {
            path: currentItem ? `rcas/${currentItem.id}` : 'rcas',
            operation: currentItem ? 'update' : 'create',
            requestResourceData: dataToSave}});
    } finally {
        setLoading(false);
    }
  }
  
  const renderDynamicForm = () => {
    if (!selectedActivity || !selectedSubActivity) {
         return <p className="text-muted-foreground text-center py-8">Selecione uma atividade e sub-atividade para exibir o formulário correspondente.</p>;
    }

    return <p className="text-muted-foreground text-center py-8">Formulário para &quot;{selectedSubActivity}&quot; em construção.</p>;
  }
  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => handleSave((form.getValues('status') as 'Rascunho' | 'Aprovado' | undefined) || 'Rascunho'))} className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 pr-4 space-y-4 overflow-y-auto">
          <div className="p-4 border rounded-md space-y-4">
              <FormField
              control={form.control}
              name="activity"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Listagem/Atividade Principal</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); form.setValue('subActivity', undefined); }} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Selecione a atividade da DN 217" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {activities.map(activity => (
                          <SelectItem key={activity} value={activity}>{activity}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
              />
              {selectedActivity && subActivities[selectedActivity] && (
                  <FormField
                  control={form.control}
                  name="subActivity"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Atividade Específica</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Selecione a atividade específica" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {subActivities[selectedActivity].map(subActivity => (
                              <SelectItem key={subActivity} value={subActivity}>{subActivity}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              )}
          </div>

          {renderDynamicForm()}
        </div>
        
        <div className="flex justify-between items-center pt-6 mt-4 border-t">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleSave('Rascunho')} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Rascunho'}
            </Button>
            <Button onClick={() => handleSave('Aprovado')} disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Concluindo...</> : 'Concluir e Aprovar'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
