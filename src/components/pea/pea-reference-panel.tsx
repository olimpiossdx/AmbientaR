'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BookOpen,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useFirebase } from '@/firebase';
import { fetchApiWithAuth } from '@/lib/api-client-auth';
import { useToast } from '@/hooks/use-toast';
import { FEAM_TR_CATALOG, type FeamTrCatalogItem } from '@/lib/pea/feam-tr-catalog';

type ListedFile = { name: string; relativePath: string };

export function PeaReferencePanel() {
  const { auth } = useFirebase();
  const { toast } = useToast();
  const [files, setFiles] = React.useState<ListedFile[]>([]);
  const [loadingList, setLoadingList] = React.useState(true);
  const [importing, setImporting] = React.useState(false);
  const [indexingRag, setIndexingRag] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>(
    FEAM_TR_CATALOG.filter((i) => i.essencialPea).map((i) => i.id),
  );
  const [customUrl, setCustomUrl] = React.useState('');
  const [customName, setCustomName] = React.useState('');
  const [lastImport, setLastImport] = React.useState<
    { ok: boolean; filename: string; error?: string; manualUrl?: string }[]
  >([]);

  const refreshList = React.useCallback(() => {
    setLoadingList(true);
    fetchApiWithAuth(auth, '/api/termos-referencia/list?study=pea')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.files)) {
          setFiles(data.files);
        } else {
          setFiles([]);
        }
      })
      .catch(() => setFiles([]))
      .finally(() => setLoadingList(false));
  }, [auth]);

  React.useEffect(() => {
    refreshList();
  }, [refreshList]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const runImport = async (payload: Record<string, unknown>) => {
    setImporting(true);
    setLastImport([]);
    try {
      const res = await fetchApiWithAuth(auth, '/api/pea/import-feam-tr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.results) {
        setLastImport(data.results);
      }
      if (data.imported > 0) {
        toast({
          title: 'Importação FEAM',
          description: `${data.imported} de ${data.total} ficheiro(s) guardados em termos de referencia/PEA.`,
        });
        refreshList();
      } else {
        toast({
          variant: 'destructive',
          title: 'Importação automática limitada',
          description:
            data.hint ||
            'O portal FEAM pode bloquear download direto. Use os links para baixar manualmente ou cole uma URL alternativa.',
        });
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro na importação',
        description: (e as Error).message,
      });
    } finally {
      setImporting(false);
    }
  };

  const indexPeaFolderToRag = async () => {
    setIndexingRag(true);
    try {
      const res = await fetchApiWithAuth(auth, '/api/cloud-rag/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 40 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao indexar biblioteca OneDrive.');
      }
      toast({
        title: 'Biblioteca OneDrive indexada',
        description:
          data.message ||
          `${data.indexed ?? 0} ficheiro(s) indexados (lote). Execute sync na Biblioteca IA se necessário.`,
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Indexação RAG (nuvem)',
        description: (e as Error).message,
      });
    } finally {
      setIndexingRag(false);
    }
  };

  return (
    <Card className="border-muted bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          Termos de referência FEAM / PEA
        </CardTitle>
        <CardDescription>
          Importe TR e formulários do repositório{' '}
          <a
            href="https://feam.br/web/feam//outros-estudos-e-projetos-ambientais"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            FEAM
          </a>
          , ajuste a seleção e indexe na Base Jurídica para a IA apoiar a redação.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Documentos do catálogo FEAM</Label>
          <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
            {FEAM_TR_CATALOG.map((item: FeamTrCatalogItem) => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded border p-2 bg-background text-sm"
              >
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={() => toggleId(item.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight">{item.titulo}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.descricao}</p>
                  <a
                    href={item.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline"
                  >
                    Abrir no site FEAM
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={importing || selectedIds.length === 0}
              onClick={() => void runImport({ ids: selectedIds })}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              Importar selecionados
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={importing}
              onClick={() => void runImport({ essenciaisOnly: true })}
            >
              Só essenciais (TR + Dispensa)
            </Button>
          </div>
        </div>

        <div className="grid gap-2 rounded-md border p-3 bg-background">
          <Label className="text-sm font-medium">URL customizada (opcional)</Label>
          <Input
            placeholder="https://feam.br/.../view_file/..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
          />
          <Input
            placeholder="Nome do ficheiro (ex.: FEAM-TR-extra.pdf)"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={importing || !customUrl.trim()}
            onClick={() =>
              void runImport({
                customUrl: customUrl.trim(),
                customFilename: customName.trim() || undefined,
              })
            }
          >
            Importar URL
          </Button>
        </div>

        {lastImport.length > 0 && (
          <ul className="text-xs space-y-1 border rounded p-2 bg-background">
            {lastImport.map((r) => (
              <li key={r.filename} className={r.ok ? 'text-green-700' : 'text-amber-700'}>
                {r.ok ? '✓' : '○'} {r.filename}
                {!r.ok && r.manualUrl && (
                  <>
                    {' '}
                    —{' '}
                    <a href={r.manualUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      download manual
                    </a>
                  </>
                )}
                {r.error && !r.ok ? ` (${r.error})` : ''}
              </li>
            ))}
          </ul>
        )}

        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Pasta local PEA</Label>
            <Button type="button" variant="ghost" size="icon" onClick={refreshList}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {loadingList ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Listando…
            </p>
          ) : files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum PDF/DOCX na pasta ainda.</p>
          ) : (
            <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
              {files.map((f) => (
                <li key={f.relativePath} className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{f.name}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={indexingRag}
              onClick={() => void indexPeaFolderToRag()}
            >
              {indexingRag ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Indexar pasta PEA no RAG
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/knowledge-sources">Base Jurídica</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
