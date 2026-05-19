
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { FaunaStudy } from '@/lib/types';

const formSchema = z.object({
  numeroAutorizacao: z.string().optional(),
  responsaveisTecnicosRelatorio: z.string().optional(),
  caracterizacaoEmpreendimento: z.string().optional(),
  areaDiretamenteAfetada: z.string().optional(),
  areasIntervencao: z.string().optional(),
  areasSoltura: z.string().optional(),
  acoesResgate: z.string().optional(),
  discussao: z.string().optional(),
  referencias: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RelatorioResgateFormProps {
  documentId?: string | null;
  seedStudy?: FaunaStudy | null;
  onSave: (data: FormValues & { id?: string }, status: "draft" | "completed") => Promise<void>;
}

export function RelatorioResgateForm({
  documentId,
  seedStudy,
  onSave,
}: RelatorioResgateFormProps) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { firestore } = useFirebase();

  const studyDocRef = useMemoFirebase(
    () =>
      firestore && documentId
        ? doc(firestore, "faunaStudies", documentId)
        : null,
    [firestore, documentId],
  );
  const { data: study, isLoading: isLoadingStudy } = useDoc<FaunaStudy>(studyDocRef);
  const source = study ?? seedStudy;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  React.useEffect(() => {
    if (source) {
      form.reset({
        numeroAutorizacao: source.numeroAutorizacao || "",
        responsaveisTecnicosRelatorio:
          source.responsaveisTecnicosRelatorio || "",
        caracterizacaoEmpreendimento:
          source.caracterizacaoEmpreendimento || "",
        areaDiretamenteAfetada: source.areaDiretamenteAfetada || "",
        areasIntervencao: source.areasIntervencao || "",
        areasSoltura: source.areasSoltura || "",
        acoesResgate: source.acoesResgate || "",
        discussao: source.discussao || "",
        referencias: source.referencias || "",
      });
    }
  }, [source, form]);

  const submit = async (status: "draft" | "completed") => {
    setLoading(true);
    const values = form.getValues();
    const payload = documentId ? { ...values, id: documentId } : values;
    await onSave(payload, status);
    setLoading(false);
  };

  if (isLoadingStudy && documentId) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4 -mr-6">
            <Accordion type="multiple" defaultValue={['item-1', 'item-3']} className="w-full">
            
            <AccordionItem value="item-1">
                <AccordionTrigger>1. & 2. & 3. Identificação e Caracterização</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                <FormField name="numeroAutorizacao" control={form.control} render={({ field }) => (<FormItem><FormLabel>1.1. Número da autorização</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="responsaveisTecnicosRelatorio" control={form.control} render={({ field }) => (<FormItem><FormLabel>1.2. Responsáveis técnicos</FormLabel><FormControl><Textarea placeholder="Nome, formação, registro, ART..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="caracterizacaoEmpreendimento" control={form.control} render={({ field }) => (<FormItem><FormLabel>2. Caracterização do Empreendimento</FormLabel><FormControl><Textarea placeholder="Descrição breve..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="areaDiretamenteAfetada" control={form.control} render={({ field }) => (<FormItem><FormLabel>3. Caracterização da Área</FormLabel><FormControl><Textarea placeholder="ADA, AID, AII..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
                <AccordionTrigger>4. Áreas e Ações</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                <FormField name="areasIntervencao" control={form.control} render={({ field }) => (<FormItem><FormLabel>4.1 Áreas de intervenção</FormLabel><FormControl><Textarea className="min-h-[120px]" placeholder="Apresentar a delimitação das áreas que sofreram supressão..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="areasSoltura" control={form.control} render={({ field }) => (<FormItem><FormLabel>4.2 Áreas de soltura</FormLabel><FormControl><Textarea className="min-h-[120px]" placeholder="Apresentar a delimitação das áreas de soltura para onde foram translocados os animais..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="acoesResgate" control={form.control} render={({ field }) => (<FormItem><FormLabel>4.3 Ações de resgate e destinação</FormLabel><FormControl><Textarea className="min-h-[200px]" placeholder="Relato detalhado das atividades executadas com anexo fotográfico..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
                <AccordionTrigger>5. & 6. Discussão e Referências</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                    <FormField name="discussao" control={form.control} render={({ field }) => (<FormItem><FormLabel>5. Discussão</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Discorrer sobre o sucesso alcançado na execução das atividades..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="referencias" control={form.control} render={({ field }) => (<FormItem><FormLabel>6. Referências Bibliográficas</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Listar, conforme diretrizes da ABNT..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>

            </Accordion>
        </div>
        <div className="flex justify-end gap-2 pt-6 mt-4 p-4 border-t">
          <Button variant="outline" type="button" onClick={() => router.back()}>Voltar</Button>
          <Button variant="secondary" type="button" disabled={loading} onClick={() => submit("draft")}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Rascunho"}
          </Button>
          <Button type="button" disabled={loading} onClick={() => submit("completed")}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Concluindo...</> : "Concluir Relatório"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
