'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrDateInput } from '@/components/form/br-date-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { KnowledgeSourceTipo, KnowledgeSourceStatus } from '@/lib/types';
import { KNOWLEDGE_SOURCE_TIPO_LABEL } from '@/lib/knowledge-sources';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const TIPO_OPTIONS: { value: KnowledgeSourceTipo; label: string }[] = [
  { value: 'lei', label: KNOWLEDGE_SOURCE_TIPO_LABEL.lei },
  { value: 'deliberacao', label: KNOWLEDGE_SOURCE_TIPO_LABEL.deliberacao },
  { value: 'resolucao', label: KNOWLEDGE_SOURCE_TIPO_LABEL.resolucao },
  { value: 'portaria', label: KNOWLEDGE_SOURCE_TIPO_LABEL.portaria },
  { value: 'termo_referencia', label: KNOWLEDGE_SOURCE_TIPO_LABEL.termo_referencia },
  { value: 'laudo_antigo', label: KNOWLEDGE_SOURCE_TIPO_LABEL.laudo_antigo },
  { value: 'nota_interna', label: KNOWLEDGE_SOURCE_TIPO_LABEL.nota_interna },
  { value: 'outro', label: KNOWLEDGE_SOURCE_TIPO_LABEL.outro },
];

const STATUS_OPTIONS: { value: KnowledgeSourceStatus; label: string }[] = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'revogada', label: 'Revogada' },
  { value: 'alterada', label: 'Alterada' },
];

export default function NewKnowledgeSourcePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [submitting, setSubmitting] = useState(false);
  const [tipo, setTipo] = useState<KnowledgeSourceTipo>('deliberacao');
  const [uf, setUf] = useState('MG');
  const [orgao, setOrgao] = useState('');
  const [numero, setNumero] = useState('');
  const [titulo, setTitulo] = useState('');
  const [dataPublicacao, setDataPublicacao] = useState('');
  const [status, setStatus] = useState<KnowledgeSourceStatus>('vigente');
  const [assunto, setAssunto] = useState('');
  const [urlOficial, setUrlOficial] = useState('');
  const [aprovado, setAprovado] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firestore) return;
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(firestore, 'knowledge_sources'), {
        tipo,
        uf: uf.trim() || undefined,
        orgao: orgao.trim() || undefined,
        numero: numero.trim() || undefined,
        titulo: titulo.trim() || undefined,
        dataPublicacao: dataPublicacao.trim() || undefined,
        status,
        assunto: assunto.trim() || undefined,
        urlOficial: urlOficial.trim() || undefined,
        modoInclusao: 'manual',
        aprovado,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Fonte criada', description: 'Agora você pode adicionar trechos (RAG) na página da fonte.' });
      router.push(`/knowledge-sources/${ref.id}`);
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Nova fonte de conhecimento (manual)" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Dados da fonte</CardTitle>
            <CardDescription>
              Lei, deliberação, portaria, TR ou laudo antigo. Depois você adiciona trechos para o RAG na página da fonte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label>Tipo *</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as KnowledgeSourceTipo)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>UF</Label>
                  <Input value={uf} onChange={(e) => setUf(e.target.value)} placeholder="MG" />
                </div>
                <div className="grid gap-2">
                  <Label>Órgão</Label>
                  <Input value={orgao} onChange={(e) => setOrgao(e.target.value)} placeholder="COPAM, SEMAD, IGAM..." />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Número / Identificação</Label>
                <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex.: DN COPAM 217/2017" />
              </div>
              <div className="grid gap-2">
                <Label>Título</Label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título ou resumo curto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data publicação</Label>
                  <BrDateInput value={dataPublicacao} onChange={setDataPublicacao} />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as KnowledgeSourceStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Assunto</Label>
                <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Ex.: licenciamento ambiental" />
              </div>
              <div className="grid gap-2">
                <Label>URL oficial</Label>
                <Input type="url" value={urlOficial} onChange={(e) => setUrlOficial(e.target.value)} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="aprovado" checked={aprovado} onChange={(e) => setAprovado(e.target.checked)} title="Aprovado para uso na IA" aria-label="Aprovado para uso na IA" />
                <Label htmlFor="aprovado">Aprovado (disponível para a IA)</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar fonte
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/knowledge-sources')}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
