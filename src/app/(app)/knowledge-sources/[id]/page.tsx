'use client';

import * as React from 'react';
import { useMemo, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDoc, useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import type { KnowledgeSource } from '@/lib/types';
import type { RagIndexEntry } from '@/lib/types';
import { KNOWLEDGE_SOURCE_TIPO_LABEL } from '@/lib/knowledge-sources';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Loader2 } from 'lucide-react';

export default function KnowledgeSourceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [addChunksOpen, setAddChunksOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sourceRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'knowledge_sources', id) : null),
    [firestore, id]
  );
  const { data: source, isLoading } = useDoc<KnowledgeSource>(sourceRef);

  const chunksQuery = useMemoFirebase(
    () => firestore && id
      ? query(collection(firestore, 'rag_index'), where('sourceId', '==', id))
      : null,
    [firestore, id]
  );
  const { data: chunks } = useCollection<RagIndexEntry>(chunksQuery);

  const addChunksManual = useCallback(async () => {
    if (!firestore || !source) return;
    const paragraphs = pastedText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 50);
    if (paragraphs.length === 0) {
      toast({ title: 'Nenhum trecho', description: 'Cole texto e separe os trechos por linhas em branco (mín. ~50 caracteres por trecho).', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      for (let i = 0; i < paragraphs.length; i++) {
        await addDoc(collection(firestore, 'rag_index'), {
          sourceId: source.id,
          tipoDocumento: source.tipo,
          uf: source.uf,
          orgao: source.orgao,
          numero: source.numero,
          titulo: source.titulo,
          chunkText: paragraphs[i],
          chunkIndex: i,
          referencias: {},
        });
      }
      toast({ title: 'Trechos adicionados', description: `${paragraphs.length} trecho(s) incluído(s) no índice RAG.` });
      setPastedText('');
      setAddChunksOpen(false);
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [firestore, source, pastedText, toast]);

  if (isLoading || !source) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Fonte" />
        <main className="flex-1 p-4"><Skeleton className="h-64 w-full" /></main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={source.numero || source.titulo || 'Fonte'}>
        <Button variant="outline" size="sm" asChild>
          <Link href="/knowledge-sources">Voltar</Link>
        </Button>
        <Button size="sm" className="gap-1" onClick={() => setAddChunksOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          Adicionar trechos (manual)
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{source.numero || source.titulo || id}</CardTitle>
            <CardDescription>
              {KNOWLEDGE_SOURCE_TIPO_LABEL[source.tipo]} {source.orgao && `· ${source.orgao}`} {source.uf && `· ${source.uf}`}
              {source.aprovado ? ' · Aprovado' : ' · Pendente'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {source.assunto && <p><strong>Assunto:</strong> {source.assunto}</p>}
            {source.dataPublicacao && <p><strong>Data publicação:</strong> {source.dataPublicacao}</p>}
            {source.status && <p><strong>Status:</strong> {source.status}</p>}
            {source.urlOficial && (
              <p>
                <a href={source.urlOficial} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Link oficial
                </a>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trechos no índice RAG ({chunks?.length ?? 0})</CardTitle>
            <CardDescription>
              Trechos usados pela IA para fundamentar respostas. Inserção manual aqui ou via pipeline (futuro).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!chunks?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum trecho ainda. Clique em &quot;Adicionar trechos (manual)&quot; e cole o texto (separe parágrafos por linha em branco).</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {chunks.map((c, i) => (
                  <li key={c.id} className="border-l-2 pl-3 text-muted-foreground">
                    <span className="text-xs font-medium">#{i + 1}</span>
                    <p className="mt-1 line-clamp-2">{c.chunkText.slice(0, 200)}{c.chunkText.length > 200 ? '…' : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={addChunksOpen} onOpenChange={setAddChunksOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Adicionar trechos manualmente</DialogTitle>
            <DialogDescription>
              Cole o texto do documento abaixo. Cada bloco separado por linha(s) em branco vira um trecho no índice RAG (mín. ~50 caracteres por trecho).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Cole aqui o texto da norma, TR ou laudo...&#10;&#10;Parágrafos separados por linha em branco serão salvos como trechos distintos."
            className="min-h-[200px] font-mono text-sm flex-1"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddChunksOpen(false)}>Cancelar</Button>
            <Button onClick={addChunksManual} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Inserir trechos no RAG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
