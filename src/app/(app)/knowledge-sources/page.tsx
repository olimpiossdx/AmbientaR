'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Eye, FileText, CheckCircle, Archive } from 'lucide-react';
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número / Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Órgão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inclusão</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.numero || s.titulo || s.id.slice(0, 8)}</TableCell>
                    <TableCell>{KNOWLEDGE_SOURCE_TIPO_LABEL[s.tipo] ?? s.tipo}</TableCell>
                    <TableCell>{s.orgao ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={s.aprovado ? 'default' : 'secondary'}>
                        {s.aprovado ? 'Aprovado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.modoInclusao === 'robo_sugeriu' ? 'Robô' : 'Manual'}
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      {s.modoInclusao === 'robo_sugeriu' && !s.aprovado && !s.arquivado && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleAprovar(s.id)} title="Aprovar (disponível para a IA)">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleArquivar(s.id)} title="Arquivar sugestão">
                            <Archive className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/knowledge-sources/${s.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Nenhuma fonte cadastrada. Adicione manualmente ou aguarde sugestões do pipeline.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
