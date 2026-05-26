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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Sparkles, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleAskAssistant } from './actions';
import { IA_MENU_LABEL } from '@/lib/navigation-config';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { AiProviderBadge, AiRoutingInfoCard } from '@/components/ai/ai-provider-badge';
import { Label } from '@/components/ui/label';

const TIPOS = ['geral', 'mira', 'outorga', 'financeiro', 'rag', 'mcp'] as const;
type TipoAssistente = (typeof TIPOS)[number];

const formSchema = z.object({
  prompt: z.string().min(10, 'Sua pergunta deve ter pelo menos 10 caracteres.'),
  tipo: z.enum(TIPOS),
  modo: z.enum(['rapido', 'completo']),
});

type FormValues = z.infer<typeof formSchema>;

const LABEL_TIPO: Record<TipoAssistente, string> = {
  geral: 'Legislação e estudos',
  mira: 'Águas / MIRA-IGAM',
  outorga: 'Outorga MG (IGAM / SOUT)',
  financeiro: 'Custos e contratos',
  rag: 'Síntese de texto',
  mcp: 'Cruzamento de dados',
};

function parseTipoFromSearch(raw: string | null | undefined): TipoAssistente {
  if (raw && TIPOS.includes(raw as TipoAssistente)) return raw as TipoAssistente;
  return 'geral';
}

function AssistantPageInner() {
  const searchParams = useSearchParams();
  const initialTipo = parseTipoFromSearch(searchParams?.get('tipo'));
  const initialPrompt = searchParams?.get('prompt') ?? '';

  const [loading, setLoading] = React.useState(false);
  const [response, setResponse] = React.useState<string | null>(null);
  const [lastProvider, setLastProvider] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: initialPrompt,
      tipo: initialTipo,
      modo: 'rapido',
    },
  });

  const modo = form.watch('modo');

  React.useEffect(() => {
    const t = parseTipoFromSearch(searchParams?.get('tipo'));
    form.setValue('tipo', t);
    const prefillPrompt = searchParams?.get('prompt');
    if (prefillPrompt && !form.getValues('prompt')) {
      form.setValue('prompt', prefillPrompt);
    }
  }, [searchParams, form]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setResponse(null);
    setLastProvider(null);

    const result = await handleAskAssistant({
      prompt: values.prompt,
      tipo: values.tipo,
      modo: values.modo,
    });

    if (result.success && result.response) {
      setResponse(result.response);
      setLastProvider(result.provider ?? null);
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
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        <AiRoutingInfoCard />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Consulta</CardTitle>
              <CardDescription>
                <strong className="font-medium text-foreground">Resposta rápida</strong> usa Gemini
                (barato). <strong className="font-medium text-foreground">Relatório completo</strong>{' '}
                usa DeepSeek (textos longos e mais elaborados).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="modo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de resposta</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid gap-3"
                          >
                            <div className="flex items-start space-x-3 rounded-md border p-3">
                              <RadioGroupItem value="rapido" id="modo-rapido" className="mt-1" />
                              <div className="grid gap-1">
                                <Label htmlFor="modo-rapido" className="font-medium cursor-pointer">
                                  <Zap className="inline h-4 w-4 mr-1 text-amber-600" />
                                  Resposta rápida (Gemini)
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Dúvidas, legislação, orientações curtas — menor custo.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3 rounded-md border p-3">
                              <RadioGroupItem value="completo" id="modo-completo" className="mt-1" />
                              <div className="grid gap-1">
                                <Label htmlFor="modo-completo" className="font-medium cursor-pointer">
                                  <Sparkles className="inline h-4 w-4 mr-1 text-violet-600" />
                                  Relatório completo (DeepSeek)
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Textos longos, capítulos e sínteses extensas — conta DeepSeek.
                                </p>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modo (menu {IA_MENU_LABEL})</FormLabel>
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
                          O menu lateral <strong className="font-medium text-foreground">{IA_MENU_LABEL}</strong> abre
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
                    ) : modo === 'completo' ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar com DeepSeek
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Perguntar (Gemini)
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
                <CardHeader className="space-y-2">
                  <CardTitle>Resposta</CardTitle>
                  {lastProvider && !loading ? (
                    <AiProviderBadge provider={lastProvider} showHint />
                  ) : null}
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {loading && (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p>
                        {modo === 'completo'
                          ? 'A gerar com DeepSeek…'
                          : 'A gerar com Gemini…'}
                      </p>
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
