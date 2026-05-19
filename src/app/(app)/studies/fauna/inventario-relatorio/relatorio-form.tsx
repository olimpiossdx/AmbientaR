
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
  FormDescription,
} from '@/components/ui/form';
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
  resultados: z.object({
    caracterizacaoAmbientalPrimaria: z.string().optional(),
    listaEspeciesPrimaria: z.string().optional(),
    impactosAmbientais: z.string().optional(),
  }).optional(),
  discussao: z.string().optional(),
  recomendacoes: z.string().optional(),
  referencias: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RelatorioInventarioFormProps {
  documentId: string | null;
  seedStudy?: FaunaStudy | null;
  onSave: (
    data: FormValues & { id?: string },
    status: "draft" | "completed",
  ) => Promise<void>;
}

export function RelatorioInventarioForm({
  documentId,
  seedStudy,
  onSave,
}: RelatorioInventarioFormProps) {
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
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
          
          <AccordionItem value="item-1">
            <AccordionTrigger>1. Identificação</AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
              <FormField control={form.control} name="numeroAutorizacao" render={({ field }) => (<FormItem><FormLabel>1.1. Número da autorização de manejo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="responsaveisTecnicosRelatorio" render={({ field }) => (<FormItem><FormLabel>1.2. Responsáveis técnicos pelo relatório</FormLabel><FormControl><Textarea className="min-h-[100px]" placeholder="Apresentar quadro com nome, formação, registro profissional e ART." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>2. & 3. Caracterização</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-6">
              <FormField name="caracterizacaoEmpreendimento" control={form.control} render={({ field }) => (<FormItem><FormLabel>2. Caracterização do Empreendimento</FormLabel><FormControl><Textarea placeholder="Descrição breve do empreendimento..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="areaDiretamenteAfetada" control={form.control} render={({ field }) => (<FormItem><FormLabel>3. Caracterização da Área (ADA e Áreas de Influência)</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Delimitação e descrição da ADA, AID e AII..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </AccordionContent>
          </AccordionItem>

           <AccordionItem value="item-3">
            <AccordionTrigger>4. Metodologia</AccordionTrigger>
            <AccordionContent className="pt-4">
               <p className="text-sm text-muted-foreground">Apresentação do desenho amostral e dos métodos empregados no estudo de campo.</p>
               {/* Campos podem ser adicionados aqui se necessário */}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>5. Resultados</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-6">
               <FormField name="resultados.caracterizacaoAmbientalPrimaria" control={form.control} render={({ field }) => (<FormItem><FormLabel>5.1. Caracterização ambiental (dados primários)</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Identificação de bens ambientais relevantes com base nos dados de campo..." {...field} /></FormControl><FormMessage /></FormItem>)} />
               <FormField name="resultados.listaEspeciesPrimaria" control={form.control} render={({ field }) => (<FormItem><FormLabel>5.2. Lista de espécies (dados primários)</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Apresentar quadro com a lista das espécies registradas..." {...field} /></FormControl><FormMessage /></FormItem>)} />
               <FormField name="resultados.impactosAmbientais" control={form.control} render={({ field }) => (<FormItem><FormLabel>5.3. Impactos ambientais</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Identificar vetores de impacto e analisar interações..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>6. & 7. Discussão e Recomendações</AccordionTrigger>
            <AccordionContent className="pt-4 space-y-6">
               <FormField name="discussao" control={form.control} render={({ field }) => (<FormItem><FormLabel>6. Discussão</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Discussão e interpretação dos resultados..." {...field} /></FormControl><FormMessage /></FormItem>)} />
               <FormField name="recomendacoes" control={form.control} render={({ field }) => (<FormItem><FormLabel>7. Recomendações</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Apresentar recomendações com base nos resultados..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-6">
            <AccordionTrigger>8. Referências Bibliográficas</AccordionTrigger>
            <AccordionContent className="pt-4">
               <FormField control={form.control} name="referencias" render={({ field }) => (<FormItem><FormLabel>Referências</FormLabel><FormControl><Textarea className="min-h-[150px]" placeholder="Listar, conforme diretrizes da ABNT..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex justify-end gap-2 pt-6">
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
