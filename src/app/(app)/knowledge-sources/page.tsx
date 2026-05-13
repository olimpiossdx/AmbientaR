'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Eye, CheckCircle, Archive } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { KnowledgeSource } from '@/lib/types';
import { KNOWLEDGE_SOURCE_TIPO_LABEL, formatKnowledgeSourceSummary } from '@/lib/knowledge-sources';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

export default function KnowledgeSourcesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [aprovadoFilter, setAprovadoFilter] = useState<string>('all');

  const { firestore } = useFirebase();
  const sourcesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'knowledge_sources') : null),
    [firestore]
  );
  const { data: sources, isLoading } = useCollection<KnowledgeSource>(sourcesQuery);

  const filtered = useMemo(() => {
    if (!sources) return [];
    const notArquivados = sources.filter((s) => !s.arquivado);
    if (aprovadoFilter === 'all') return notArquivados;
    if (aprovadoFilter === 'true') return notArquivados.filter((s) => s.aprovado === true);
    if (aprovadoFilter === 'archived') return sources.filter((s) => s.arquivado === true);
    return notArquivados.filter((s) => s.aprovado !== true);
  }, [sources, aprovadoFilter]);

  const handleAprovar = async (sourceId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'knowledge_sources', sourceId), {
        aprovado: true,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Fonte aprovada', description: 'Disponível para a IA.' });
    } catch (e) {
      toast({ title: 'Erro ao aprovar', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleArquivar = async (sourceId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'knowledge_sources', sourceId), {
        arquivado: true,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Fonte arquivada' });
    } catch (e) {
      toast({ title: 'Erro ao arquivar', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Base Jurídica / Fontes de Conhecimento">
        <Button size="sm" className="gap-1" onClick={() => router.push('/knowledge-sources/new')}>
          <PlusCircle className="h-4 w-4" />
          Nova fonte (manual)
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Fontes de conhecimento</CardTitle>
            <CardDescription>
              Leis, deliberações, portarias, TR, laudos antigos e notas internas. Inserção manual aqui; o pipeline (robô) poderá sugerir novas fontes depois.
            </CardDescription>
            <div className="flex items-center gap-2 pt-2">
              <Label className="text-sm text-muted-foreground">Aprovado:</Label>
              <Select value={aprovadoFilter} onValueChange={setAprovadoFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Aprovados</SelectItem>
                  <SelectItem value="false">Pendentes</SelectItem>
                  <SelectItem value="archived">Arquivados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="space-y-4">
                {isLoading && (
                  <Skeleton className="h-28 w-full rounded-lg" />
                )}
                {!isLoading &&
                  filtered.map((s) => (
                    <Card
                      key={s.id}
                      className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4">
                          <div className="min-w-0 space-y-2">
                            <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                              {s.numero || s.titulo || s.id.slice(0, 8)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {(KNOWLEDGE_SOURCE_TIPO_LABEL[s.tipo] ?? s.tipo) +
                                (s.orgao ? ` · ${s.orgao}` : '')}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={s.aprovado ? 'default' : 'secondary'}>
                                {s.aprovado ? 'Aprovado' : 'Pendente'}
                              </Badge>
                              {s.arquivado ? (
                                <Badge variant="outline">Arquivado</Badge>
                              ) : null}
                              <span className="text-xs text-muted-foreground">
                                {s.modoInclusao === 'robo_sugeriu' ? 'Inclusão: Robô' : 'Inclusão: Manual'}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                              {formatKnowledgeSourceSummary(s)}
                            </p>
                          </div>
                          <Separator className="bg-border/60" />
                          <div className="flex flex-wrap items-center gap-1">
                            {s.modoInclusao === 'robo_sugeriu' && !s.aprovado && !s.arquivado && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() => handleAprovar(s.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <span className="sr-only">Aprovar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Aprovar (disponível para a IA)</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() => handleArquivar(s.id)}
                                    >
                                      <Archive className="h-4 w-4" />
                                      <span className="sr-only">Arquivar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Arquivar sugestão</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 shrink-0"
                                  type="button"
                                  onClick={() => router.push(`/knowledge-sources/${s.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Ver detalhes</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver detalhes</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {!isLoading && filtered.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                    Nenhuma fonte cadastrada. Adicione manualmente ou aguarde sugestões do pipeline.
                  </div>
                )}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
