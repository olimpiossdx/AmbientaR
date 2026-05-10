'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateUploader } from '../template-uploader';
import { TEMPLATE_CARDS } from './template-config';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { DocxTemplateSlug, DocxTemplatesState } from '@/lib/docx-template-slugs';

export default function TemplatesPage() {
  const { firestore } = useFirebase();
  const docxTemplatesRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'companySettings', 'docxTemplates') : null),
    [firestore],
  );
  const { data: docxTemplates, isLoading } = useDoc<DocxTemplatesState>(docxTemplatesRef);

  const fileNames = React.useMemo(() => {
    const out: Record<string, string | null> = {};
    for (const c of TEMPLATE_CARDS) {
      const entry = docxTemplates?.[c.slug as DocxTemplateSlug];
      out[c.slug] = entry?.fileName ?? null;
    }
    return out;
  }, [docxTemplates]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Templates" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-8 max-w-4xl mx-auto">
          {TEMPLATE_CARDS.map(({ slug, title, description }) => (
            <Card key={slug} className="border-primary/50 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {title}
                </CardTitle>
                <CardDescription>
                  {description}{' '}
                  Recomendado: use placeholders no DOCX (ex.: {'{{nome_empreendimento}}'}) para preenchimento na exportação.
                  Os arquivos ficam no Firebase Storage (persistente em produção).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <TemplateUploader
                    slug={slug as DocxTemplateSlug}
                    label={title}
                    fileName={fileNames[slug] ?? null}
                    onUploadComplete={() => {}}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
