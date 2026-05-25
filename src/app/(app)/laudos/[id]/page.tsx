'use client';

import * as React from 'react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDoc, useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import type { Laudo, Empreendedor, Project } from '@/lib/types';
import { getAmbientalContextByEmpreendimentoId } from '@/lib/ambiental-context';
import type { AmbientalContext } from '@/lib/types';
import type { DocxTemplatesState } from '@/lib/docx-template-slugs';
import { tipoEstudoToTemplateSlug } from '@/lib/docx-template-slugs';
import { getBearerApiHeaders } from '@/lib/api-client-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FileText, Database, Loader2, FileDown, Send } from 'lucide-react';
import { GeoAnalysisRcaImport } from '@/components/geospatial/geo-analysis-rca-import';
import {
  loadGeoAnalysisBundle,
  type GeoAnalysisBundle,
} from '@/lib/geospatial/load-geo-analysis-bundle';
import type { LaudoStatus } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LAUDO_STATUS_LABEL: Record<Laudo['status'], string> = {
  rascunho: 'Rascunho',
  coletando_dados: 'Coletando dados',
  gerando: 'Gerando',
  pronto: 'Pronto',
  enviado: 'Enviado',
  cancelado: 'Cancelado',
};

const TIPO_ESTUDO_LABEL: Record<string, string> = {
  RCA: 'RCA', PIA: 'PIA', PCA: 'PCA', PRADA: 'PRADA',
  InventarioFlorestal: 'Inventário Florestal', Fauna: 'Fauna', Outorgas: 'Outorgas',
  EducacaoAmbiental: 'Educação Ambiental', RelatorioDiverso: 'Relatório Diverso', Outro: 'Outro',
};

function formatDate(timestamp: any): string {
  if (!timestamp) return '—';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('pt-BR');
}

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="grid gap-1">
    <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
    <div className="text-sm">{value ?? '—'}</div>
  </div>
);

export default function LaudoDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { firestore, auth, user } = useFirebase();
  const laudoDocRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'laudos', id) : null),
    [firestore, id]
  );
  const { data: laudo, isLoading } = useDoc<Laudo>(laudoDocRef);

  const docxTemplatesRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'companySettings', 'docxTemplates') : null),
    [firestore],
  );
  const { data: docxTemplates } = useDoc<DocxTemplatesState>(docxTemplatesRef);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore]
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore]
  );
  const { data: projects } = useCollection<Project>(projectsQuery);

  const empreendedorName = useMemo(() => {
    if (!laudo || !empreendedores) return '—';
    const e = empreendedores.find((x) => x.id === laudo.empreendedorId);
    return e?.name ?? '—';
  }, [laudo, empreendedores]);

  const empreendimentoName = useMemo(() => {
    if (!laudo?.empreendimentoId || !projects) return '—';
    const p = projects.find((x) => x.id === laudo.empreendimentoId);
    return p?.propertyName ?? '—';
  }, [laudo, projects]);

  const { toast } = useToast();
  const [ambientalContext, setAmbientalContext] = useState<AmbientalContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [notificarLoading, setNotificarLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [pdfUrlInput, setPdfUrlInput] = useState('');
  const [pdfUrlSaving, setPdfUrlSaving] = useState(false);
  const [geoBundle, setGeoBundle] = useState<GeoAnalysisBundle | null>(null);

  const handleGeoBundleChange = useCallback((b: GeoAnalysisBundle | null) => {
    setGeoBundle(b);
  }, []);

  useEffect(() => {
    if (!firestore || !user?.uid || !laudo?.geoAnalysisId) return;
    void loadGeoAnalysisBundle(firestore, laudo.geoAnalysisId, user.uid).then(setGeoBundle);
  }, [firestore, user?.uid, laudo?.geoAnalysisId]);

  const empreendedor = useMemo(() => {
    if (!laudo || !empreendedores) return null;
    return empreendedores.find((x) => x.id === laudo.empreendedorId) ?? null;
  }, [laudo, empreendedores]);

  const setStatus = useCallback(async (newStatus: LaudoStatus) => {
    if (!firestore || !id) return;
    setStatusUpdating(true);
    try {
      await updateDoc(doc(firestore, 'laudos', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Status atualizado', description: LAUDO_STATUS_LABEL[newStatus] });
    } catch (e) {
      toast({ title: 'Erro ao atualizar status', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setStatusUpdating(false);
    }
  }, [firestore, id, toast]);

  const notificarWhatsApp = useCallback(async () => {
    if (!laudo) return;
    setNotificarLoading(true);
    try {
      const headers = await getBearerApiHeaders(auth, {
        'Content-Type': 'application/json',
      });
      const res = await fetch('/api/canais/notificar-laudo-pronto', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          laudoId: laudo.id,
          consultaId: laudo.consultaId ?? '',
          empreendimentoNome: empreendimentoName !== '—' ? empreendimentoName : '',
          clienteNome: empreendedor?.name ?? empreendedorName !== '—' ? empreendedorName : '',
          clienteTelefone: empreendedor?.phone ?? '',
          docxUrl: laudo.docxUrl ?? '',
          pdfUrl: laudo.pdfUrl ?? '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Erro ao notificar', description: (data as { error?: string }).error ?? res.statusText, variant: 'destructive' });
        return;
      }
      await updateDoc(doc(firestore!, 'laudos', laudo.id), {
        notificadoWhatsAppAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Notificação enviada', description: 'O webhook foi acionado. Verifique o n8n/WhatsApp.' });
    } catch (e) {
      toast({ title: 'Erro ao notificar', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setNotificarLoading(false);
    }
  }, [auth, laudo, empreendimentoName, empreendedor, empreendedorName, firestore, toast]);

  const loadContext = useCallback(async () => {
    if (!firestore || !laudo?.empreendimentoId) return;
    setContextLoading(true);
    try {
      const ctx = await getAmbientalContextByEmpreendimentoId(firestore, laudo.empreendimentoId);
      setAmbientalContext(ctx);
    } finally {
      setContextLoading(false);
    }
  }, [firestore, laudo?.empreendimentoId]);

  const gerarDocx = useCallback(async () => {
    if (!laudo) return;
    if (!laudo.empreendimentoId) {
      toast({ title: 'Laudo sem empreendimento', description: 'Vincule um empreendimento ao laudo para gerar o DOCX.', variant: 'destructive' });
      return;
    }
    let ctx = ambientalContext;
    if (!ctx) {
      if (!firestore) return;
      setContextLoading(true);
      try {
        ctx = await getAmbientalContextByEmpreendimentoId(firestore, laudo.empreendimentoId);
        setAmbientalContext(ctx);
      } finally {
        setContextLoading(false);
      }
    }
    if (!ctx) return;
    setDocxLoading(true);
    try {
      const headers = await getBearerApiHeaders(auth, {
        'Content-Type': 'application/json',
      });
      const res = await fetch('/api/laudos/gerar-docx', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          laudoId: laudo.id,
          tipoEstudo: laudo.tipoEstudo,
          context: ctx,
          templateUrl: docxTemplates?.[tipoEstudoToTemplateSlug(laudo.tipoEstudo) as keyof DocxTemplatesState]?.url,
          geoAnalysis: geoBundle?.wave,
          geoComplement: geoBundle?.complement ?? null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: 'Erro ao gerar DOCX', description: (err as { error?: string }).error ?? res.statusText, variant: 'destructive' });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo_${laudo.tipoEstudo}_${laudo.id}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'DOCX gerado', description: 'O arquivo foi baixado. Revisar e salvar no Word.' });
    } catch (e) {
      toast({ title: 'Erro ao gerar DOCX', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setDocxLoading(false);
    }
  }, [laudo, ambientalContext, firestore, toast, docxTemplates, auth, geoBundle]);

  const savePdfUrl = useCallback(async () => {
    if (!firestore || !id) return;
    const url = pdfUrlInput.trim();
    setPdfUrlSaving(true);
    try {
      await updateDoc(doc(firestore, 'laudos', id), {
        ...(url ? { pdfUrl: url } : { pdfUrl: deleteField() }),
        updatedAt: serverTimestamp(),
      });
      toast({ title: url ? 'URL do PDF salva' : 'URL do PDF removida' });
      setPdfUrlInput('');
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setPdfUrlSaving(false);
    }
  }, [firestore, id, pdfUrlInput, toast]);

  if (isLoading || !laudo) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Laudo" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={`Laudo — ${TIPO_ESTUDO_LABEL[laudo.tipoEstudo] ?? laudo.tipoEstudo}`} />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do laudo</CardTitle>
            <CardDescription>
              Criado em {formatDate(laudo.createdAt)}. Gere o DOCX a partir do contexto ambiental (card abaixo).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Select
                value={laudo.status}
                onValueChange={(v) => setStatus(v as LaudoStatus)}
                disabled={statusUpdating}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LAUDO_STATUS_LABEL) as LaudoStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{LAUDO_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DetailItem label="Tipo de estudo" value={TIPO_ESTUDO_LABEL[laudo.tipoEstudo] ?? laudo.tipoEstudo} />
            <DetailItem label="Empreendedor" value={empreendedorName} />
            <DetailItem label="Empreendimento" value={empreendimentoName} />
            {laudo.consultaId && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">Consulta</Label>
                <div className="text-sm">
                  <Button variant="link" className="p-0 h-auto" asChild>
                    <Link href={`/consultas/${laudo.consultaId}`}>Ver consulta</Link>
                  </Button>
                </div>
              </div>
            )}
            {laudo.resumoExecutivo && (
              <div className="md:col-span-2">
                <DetailItem label="Resumo executivo" value={laudo.resumoExecutivo} />
              </div>
            )}
            {(laudo.docxUrl || laudo.pdfUrl) && (
              <div className="md:col-span-2 flex flex-wrap gap-2">
                {laudo.docxUrl && (
                  <Button asChild variant="outline" size="sm">
                    <a href={laudo.docxUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-1" />
                      Baixar DOCX
                    </a>
                  </Button>
                )}
                {laudo.pdfUrl && (
                  <Button asChild variant="outline" size="sm">
                    <a href={laudo.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-1" />
                      Baixar PDF
                    </a>
                  </Button>
                )}
              </div>
            )}
            <div className="md:col-span-2 grid gap-1">
              <Label className="text-sm font-medium text-muted-foreground">URL do PDF (para envio/WhatsApp)</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://... (cole o link após converter/upload do DOCX)"
                  value={pdfUrlInput || laudo.pdfUrl || ''}
                  onChange={(e) => setPdfUrlInput(e.target.value)}
                  className="flex-1"
                />
                <Button variant="secondary" size="sm" onClick={savePdfUrl} disabled={pdfUrlSaving}>
                  {pdfUrlSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Salvar URL
                </Button>
              </div>
            </div>
            {(laudo.status === 'pronto' || laudo.status === 'enviado') && !laudo.notificadoWhatsAppAt && (
              <div className="md:col-span-2">
                <Button variant="outline" size="sm" onClick={notificarWhatsApp} disabled={notificarLoading}>
                  {notificarLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Notificar (laudo pronto) – webhook n8n/WhatsApp
                </Button>
                <p className="text-xs text-muted-foreground mt-1">Envia payload para o webhook configurado em N8N_LAUDO_PRONTO_WEBHOOK_URL.</p>
              </div>
            )}
            {laudo.notificadoWhatsAppAt && (
              <div className="md:col-span-2 text-sm text-muted-foreground">
                Notificação enviada em {formatDate(laudo.notificadoWhatsAppAt)}.
              </div>
            )}
          </CardContent>
        </Card>

        {user?.uid && laudo.empreendimentoId && (
          <GeoAnalysisRcaImport
            userId={user.uid}
            laudoId={laudo.id}
            empreendimentoId={laudo.empreendimentoId}
            initialGeoAnalysisId={(laudo as { geoAnalysisId?: string }).geoAnalysisId}
            onBundleChange={handleGeoBundleChange}
          />
        )}

        {laudo.empreendimentoId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Contexto ambiental (MCP)
              </CardTitle>
              <CardDescription>
                Dados do cadastro e da gestão ambiental para este empreendimento (usado na geração do laudo).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!ambientalContext && (
                <Button variant="outline" size="sm" onClick={loadContext} disabled={contextLoading}>
                  {contextLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Carregar contexto ambiental
                </Button>
              )}
              {ambientalContext && (
                <div className="grid gap-2 text-sm">
                  <p><strong>Empreendedor:</strong> {ambientalContext.empreendedor?.name ?? '—'}</p>
                  <p><strong>Empreendimento:</strong> {ambientalContext.empreendimento?.propertyName ?? '—'}</p>
                  <p><strong>Empresa ambiental:</strong> {ambientalContext.empresaAmbiental?.name ?? '—'}</p>
                  <p className="text-muted-foreground">
                    Licenças: {ambientalContext.licencas.length} · Outorgas: {ambientalContext.outorgas.length} ·
                    Intervenções: {ambientalContext.intervencoes.length} · Fauna: {ambientalContext.faunaStudies.length} ·
                    Monitoramentos: {ambientalContext.manualMonitoringLogs.length} ·
                    Outros projetos: {ambientalContext.outrosProjetos.length}
                  </p>
                  <Button size="sm" className="mt-2 gap-1" onClick={gerarDocx} disabled={docxLoading}>
                    {docxLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                    Gerar DOCX{geoBundle ? ' (com SIG)' : ''}
                  </Button>
                  {!geoBundle && (
                    <p className="text-xs text-muted-foreground">
                      Vincule uma análise geoespacial acima para preencher GEO_* e blocos técnicos.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
