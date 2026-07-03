
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Empreendedor as Client, LasRas, Project } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { filterProjectsByEmpreendedorId } from '@/lib/processos-form-order';

const formSchema = z.object({
    empreendedorId: z.string().min(1, 'Selecione um empreendedor.'),
    projectId: z.string().min(1, 'Selecione um empreendimento.'),
    caracterizacaoEmpreendimento: z.string().min(1, 'A caracterização é obrigatória.'),
    caracterizacaoArea: z.string().min(1, 'A caracterização da área é obrigatória.'),
    diagnosticoAmbiental: z.string().min(1, 'O diagnóstico ambiental é obrigatório.'),
    impactosAmbientais: z.string().min(1, 'A descrição dos impactos é obrigatória.'),
    medidasControle: z.string().min(1, 'As medidas de controle são obrigatórias.'),
});

type FormValues = z.infer<typeof formSchema>;

type LasRasFormProps = {
  currentItem?: LasRas | null;
  onSuccess?: () => void;
};

function lasRasToFormValues(item: LasRas): FormValues {
  const ras = item.ras ?? {};
  return {
    empreendedorId: item.requerente?.clientId ?? '',
    projectId: item.empreendimento?.projectId ?? '',
    caracterizacaoEmpreendimento:
      ras.caracterizacaoEmpreendimento ??
      (item as Record<string, string>).caracterizacaoEmpreendimento ??
      '',
    caracterizacaoArea:
      ras.caracterizacaoArea ?? (item as Record<string, string>).caracterizacaoArea ?? '',
    diagnosticoAmbiental:
      ras.diagnosticoAmbiental ?? (item as Record<string, string>).diagnosticoAmbiental ?? '',
    impactosAmbientais:
      ras.impactosAmbientais ?? (item as Record<string, string>).impactosAmbientais ?? '',
    medidasControle:
      ras.medidasControle ?? (item as Record<string, string>).medidasControle ?? '',
  };
}

export function LasRasForm({ currentItem = null, onSuccess }: LasRasFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { firestore } = useFirebase();

  const clientsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem
      ? lasRasToFormValues(currentItem)
      : {
          empreendedorId: '',
          projectId: '',
          caracterizacaoEmpreendimento: '',
          caracterizacaoArea: '',
          diagnosticoAmbiental: '',
          impactosAmbientais: '',
          medidasControle: '',
        },
  });

  const selectedClientId = form.watch('empreendedorId');
  
  const filteredProjects = React.useMemo(
    () => filterProjectsByEmpreendedorId(projects, selectedClientId),
    [projects, selectedClientId],
  );

  async function onSubmit(values: FormValues) {
    if (!firestore) return;
    setLoading(true);
    try {
      const client = clients?.find((c) => c.id === values.empreendedorId);
      const project = projects?.find((p) => p.id === values.projectId);
      const payload: Omit<LasRas, 'id'> = {
        status: currentItem?.status ?? 'Rascunho',
        formSource: 'static',
        requerente: {
          clientId: values.empreendedorId,
          nome: client?.name ?? '',
        },
        empreendimento: {
          projectId: values.projectId,
          nome: (project?.fantasyName || project?.propertyName) ?? '',
          activity: project?.activity ?? '',
        },
        ras: {
          caracterizacaoEmpreendimento: values.caracterizacaoEmpreendimento,
          caracterizacaoArea: values.caracterizacaoArea,
          diagnosticoAmbiental: values.diagnosticoAmbiental,
          impactosAmbientais: values.impactosAmbientais,
          medidasControle: values.medidasControle,
        },
        updatedAt: new Date().toISOString(),
      };

      if (currentItem?.id) {
        await updateDoc(doc(firestore, 'lasRas', currentItem.id), payload);
        toast({ title: 'LAS/RAS atualizado', description: 'Alterações salvas com sucesso.' });
      } else {
        await addDoc(collection(firestore, 'lasRas'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        toast({
          title: 'LAS/RAS salvo',
          description: 'Relatório Ambiental Simplificado registrado.',
        });
      }
      onSuccess?.();
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível gravar o LAS/RAS.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="empreendedorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empreendedor</FormLabel>
                <Select onValueChange={(value) => { field.onChange(value); form.resetField('projectId'); }} value={field.value} disabled={isLoadingClients}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione o empreendedor"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empreendimento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedClientId || isLoadingProjects}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedClientId ? "Selecione um empreendedor primeiro" : "Selecione o empreendimento"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.propertyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="caracterizacaoEmpreendimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>1. Caracterização do Empreendimento</FormLabel>
              <FormControl>
                <Textarea className="min-h-24" placeholder="Descrição do empreendimento, atividade, porte, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="caracterizacaoArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>2. Caracterização da Área de Implantação</FormLabel>
              <FormControl>
                <Textarea className="min-h-24" placeholder="Localização, uso do solo no entorno, características físicas da área..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="diagnosticoAmbiental"
          render={({ field }) => (
            <FormItem>
              <FormLabel>3. Diagnóstico Ambiental Simplificado</FormLabel>
              <FormControl>
                <Textarea className="min-h-24" placeholder="Descrição dos meios físico, biótico e socioeconômico." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="impactosAmbientais"
          render={({ field }) => (
            <FormItem>
              <FormLabel>4. Análise dos Impactos Ambientais</FormLabel>
              <FormControl>
                <Textarea className="min-h-24" placeholder="Identificação e avaliação dos principais impactos positivos e negativos." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="medidasControle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>5. Medidas de Controle Ambiental</FormLabel>
              <FormControl>
                <Textarea className="min-h-24" placeholder="Proposição das medidas mitigadoras, de controle e compensatórias." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : (currentItem ? 'Salvar alterações' : 'Salvar RAS')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
