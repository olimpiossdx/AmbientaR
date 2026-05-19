
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
  numeroAutorizacao: z.string().min(1, "O número da autorização é obrigatório."),
  responsaveisTecnicosRelatorio: z.string().min(1, "A equipe é obrigatória."),
  caracterizacaoEmpreendimento: z.string().min(1, "A caracterização é obrigatória."),
  areaDiretamenteAfetada: z.string().min(1, "A caracterização da área é obrigatória."),
  objetivosMonitoramento: z.string().min(1, "Os objetivos são obrigatórios."),
  perguntasHipoteses: z.string().min(1, "Perguntas e hipóteses são obrigatórias."),
  resultados: z.object({
    caracterizacaoAmbientalPrimaria: z.string().min(1, "A caracterização ambiental é obrigatória."),
    listaEspeciesPrimaria: z.string().min(1, "A lista de espécies é obrigatória."),
    impactosAmbientais: z.string().min(1, "A análise de impactos é obrigatória."),
  }),
  discussao: z.string().min(1, "A discussão é obrigatória."),
  recomendacoes: z.string().min(1, "As recomendações são obrigatórias."),
  referencias: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RelatorioMonitoramentoFormProps {
  documentId?: string | null;
  seedStudy?: FaunaStudy | null;
  onSave: (data: FormValues & { id?: string }, status: "draft" | "completed") => Promise<void>;
}

export function RelatorioMonitoramentoForm({
  documentId,
  seedStudy,
  onSave,
}: RelatorioMonitoramentoFormProps) {
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
        objetivosMonitoramento: source.objetivosMonitoramento || "",
        perguntasHipoteses: source.perguntasHipoteses || "",
        resultados: {
          caracterizacaoAmbientalPrimaria:
            source.resultados?.caracterizacaoAmbientalPrimaria || "",
          listaEspeciesPrimaria:
            source.resultados?.listaEspeciesPrimaria || "",
          impactosAmbientais: source.resultados?.impactosAmbientais || "",
        },
        discussao: source.discussao || "",
        recomendacoes: source.recomendacoes || "",
        referencias: source.referencias || "",
      });
    }
  }, [source, form]);

  const submit = async (status: "draft" | "completed") => {
    if (status === "completed") {
      const valid = await form.trigger();
      if (!valid) return;
    }
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
            <Accordion type="multiple" defaultValue={['item-1', 'item-4', 'item-7']} className="w-full">
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
                <AccordionTrigger>4. & 5. & 6. Objetivos, Hipóteses e Metodologia</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                    <FormField name="objetivosMonitoramento" control={form.control} render={({ field }) => (<FormItem><FormLabel>4. Objetivos</FormLabel><FormControl><Textarea placeholder="Objetivos gerais e específicos..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="perguntasHipoteses" control={form.control} render={({ field }) => (<FormItem><FormLabel>5. Perguntas e hipóteses</FormLabel><FormControl><Textarea placeholder="Perguntas de pesquisa e hipóteses de trabalho..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <p className="text-sm text-muted-foreground"><b>6. Metodologia:</b> Apresentação da área de estudo, do desenho amostral e dos métodos empregados.</p>
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
                <AccordionTrigger>7. Resultados</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                <FormField name="resultados.caracterizacaoAmbientalPrimaria" control={form.control} render={({ field }) => (<FormItem><FormLabel>7.1. Caracterização ambiental</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Identificação de bens ambientais relevantes..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="resultados.listaEspeciesPrimaria" control={form.control} render={({ field }) => (<FormItem><FormLabel>7.2. Lista de espécies</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Apresentar quadro com a lista das espécies..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="resultados.impactosAmbientais" control={form.control} render={({ field }) => (<FormItem><FormLabel>7.3. Impactos ambientais</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Identificar vetores de impacto e analisar interações..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
                <AccordionTrigger>8. & 9. & 10. Discussão, Recomendações e Referências</AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                    <FormField name="discussao" control={form.control} render={({ field }) => (<FormItem><FormLabel>8. Discussão</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Discussão e interpretação dos resultados..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="recomendacoes" control={form.control} render={({ field }) => (<FormItem><FormLabel>9. Recomendações</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Apresentar recomendações com base nos resultados..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="referencias" control={form.control} render={({ field }) => (<FormItem><FormLabel>10. Referências Bibliográficas</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Listar, conforme diretrizes da ABNT..." {...field} /></FormControl><FormMessage /></FormItem>)} />
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
