'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Loader2, FolderOpen } from 'lucide-react';
import { getTrFolderForStudy, isStudyLinkedToTr } from '@/lib/termos-referencia-config';

type Props = {
  studySlug: string;
  studyLabel: string;
};

export function TermosReferenciaCard({ studySlug, studyLabel }: Props) {
  const folderName = getTrFolderForStudy(studySlug);
  const [files, setFiles] = React.useState<{ name: string; relativePath: string }[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!folderName) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/termos-referencia/list?study=${encodeURIComponent(studySlug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && Array.isArray(data.files)) {
          setFiles(data.files);
        } else {
          setFiles([]);
          if (data.message) setError(data.message);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFiles([]);
          setError(err.message || 'Erro ao listar arquivos.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studySlug, folderName]);

  if (!folderName) return null;

  return (
    <Card className="border-muted bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          Termos de referência vinculados
        </CardTitle>
        <CardDescription>
          Pasta <strong>{folderName}</strong> em &quot;termos de referencia&quot; está vinculada ao estudo {studyLabel}.
          Use a Base Jurídica para indexar esses arquivos (RAG). O preenchimento dos campos deste formulário é manual; a IA entra na geração de documentos/laudos (template DOCX), não neste cadastro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando lista de arquivos…
          </p>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : files && files.length > 0 ? (
          <ul className="text-sm space-y-1">
            {files.map((f) => (
              <li key={f.relativePath} className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{f.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Nenhum arquivo .pdf, .docx ou .dotx nesta pasta ainda.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/knowledge-sources">
              Ver Base Jurídica (RAG)
            </Link>
          </Button>
          {isStudyLinkedToTr(studySlug) && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/studies/${studySlug}/new?form=dynamic`}>
                Novo com formulário do documento
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
