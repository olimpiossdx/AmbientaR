'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleAskAssistant } from './actions';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';

const TIPOS = ['geral', 'mira', 'financeiro', 'rag', 'mcp'] as const;
type TipoAssistente = (typeof TIPOS)[number];

const formSchema = z.object({
  prompt: z.string().min(10, 'Sua pergunta deve ter pelo menos 10 caracteres.'),
  tipo: z.enum(TIPOS),
});

type FormValues = z.infer<typeof formSchema>;

const LABEL_TIPO: Record<TipoAssistente, string> = {
  geral: 'Legislação e estudos',
  mira: 'Águas / MIRA-IGAM',
  financeiro: 'Custos e contratos',
  rag: 'Síntese de texto',
  mcp: 'Cruzamento de dados',
};

function parseTipoFromSearch(raw: string | null): TipoAssistente {
  if (raw && TIPOS.includes(raw as TipoAssistente)) return raw as TipoAssistente;
  return 'geral';
}

function AssistantPageInner() {
  const searchParams = useSearchParams();
  const initialTipo = parseTipoFromSearch(searchParams.get('tipo'));
  const initialPrompt = searchParams.get('prompt') ?? '';

  const [loading, setLoading] = React.useState(false);
  const [response, setResponse] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: initialPrompt,
      tipo: initialTipo,
    },
  });

  React.useEffect(() => {
    const t = parseTipoFromSearch(searchParams.get('tipo'));
    form.setValue('tipo', t);
    const prefillPrompt = searchParams.get('prompt');
    if (prefillPrompt && !form.getValues('prompt')) {
      form.setValue('prompt', prefillPrompt);
    }
  }, [searchParams, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setResponse(null);

    const result = await handleAskAssistant({
      prompt: values.prompt,
      tipo: values.tipo,
    });

    if (result.success && result.response) {
      setResponse(result.response);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro na geração',
        description: result.error || 'Não foi possível obter uma resposta do assistente.',
      });
    }

    setLoading(false);
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Assistente de IA para estudos ambientais" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Consulta</CardTitle>
              <CardDescription>
                Com <strong className="font-medium text-foreground">DEEPSEEK_API_KEY</strong> no
                servidor, as respostas usam DeepSeek. Caso contrário, usa-se o fluxo Genkit/Google
                anterior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modo (menu AmbientaR IA)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha o modo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIPOS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {LABEL_TIPO[t]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          O menu lateral <strong className="font-medium text-foreground">AmbientaR IA</strong> abre
                          atalhos com o mesmo modo pré-selecionado.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sua pergunta</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex.: Quais documentos costumam integrar um RCA de lavra a céu aberto em MG?"
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A pensar…
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Perguntar ao assistente
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="lg:h-full">
            {(loading || response) && (
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <CardTitle>Resposta</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {loading && (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p>A gerar resposta…</p>
                    </div>
                  )}
                  {response && (
                    <div className="prose dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-sans text-sm">
                        {response}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full max-w-3xl" />
        </div>
      }
    >
      <AssistantPageInner />
    </Suspense>
  );
}
