'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DynamicStudyForm, type DynamicFormValues } from '@/components/dynamic-study-form';
import { useStudyFormSchema } from '@/hooks/use-study-form-schema';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { getStudyDocActivity, getStudyDocEmpreendimentoNome } from '@/lib/studies/study-document-record';

type ListagemVariant = 'rca' | 'pca' | 'project';

type StudyDynamicEditPageProps = {
  studySlug: string;
  collectionName: string;
  documentId: string;
  pageTitlePrefix: string;
  listHref: string;
  listagemVariant: ListagemVariant;
  onSuccess: () => void;
};

const FIRESTORE_COLLECTION: Record<string, string> = {
  'las-ras': 'lasRas',
  reanalise: 'reanalises',
  'eia-rima': 'eiaRimas',
  rca: 'rcas',
  pca: 'pcas',
};

export function StudyDynamicEditPage({
  studySlug,
  collectionName,
  documentId,
  pageTitlePrefix,
  listHref,
  listagemVariant,
  onSuccess,
}: StudyDynamicEditPageProps) {
  const { firestore } = useFirebase();
  const [refreshToken, setRefreshToken] = React.useState(false);
  const [projectActivity, setProjectActivity] = React.useState<string | null>(null);

  const docRef = useMemoFirebase(() => {
    if (!firestore || !documentId) return null;
    return doc(firestore, collectionName, documentId);
  }, [firestore, collectionName, documentId]);

  const { data: savedDoc, isLoading: loadingDoc } = useDoc<DynamicFormValues & { id: string }>(
    docRef,
  );

  const savedActivity = React.useMemo(
    () => (savedDoc ? getStudyDocActivity(savedDoc) : null),
    [savedDoc],
  );

  const effectiveActivity =
    listagemVariant === 'project' ? projectActivity ?? savedActivity : savedActivity;

  const { schema, matchedBy, loading: loadingSchema, error, source } = useStudyFormSchema({
    studySlug,
    activity: effectiveActivity,
    subactivity: null,
    refresh: refreshToken,
    enabled: Boolean(savedDoc),
  });

  const persistCollection = FIRESTORE_COLLECTION[studySlug] ?? collectionName;

  if (loadingDoc) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title={`${pageTitlePrefix}…`} />
        <main className="p-6">
          <Skeleton className="h-[400px] w-full" />
        </main>
      </div>
    );
  }

  if (!savedDoc) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Registro não encontrado" />
        <main className="p-6">
          <Button asChild variant="outline">
            <Link href={listHref}>Voltar à lista</Link>
          </Button>
        </main>
      </div>
    );
  }

  const titleName = getStudyDocEmpreendimentoNome(savedDoc);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={`${pageTitlePrefix}: ${titleName}`}>
        <Button variant="outline" size="sm" asChild>
          <Link href={listHref}>Voltar à lista</Link>
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <Card>
            <CardHeader>
              <CardTitle>Editar formulário do documento</CardTitle>
              <CardDescription>
                Alterações são salvas como rascunho. Exportação com branding na visualização da
                lista.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingSchema}
                  onClick={() => setRefreshToken((v) => !v)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar a partir do documento
                </Button>
                {matchedBy?.file && (
                  <span className="text-xs text-muted-foreground">
                    Fonte: {matchedBy.file} ({source ?? '—'})
                  </span>
                )}
              </div>

              {loadingSchema && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando estrutura do formulário…
                </p>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Formulário indisponível</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {schema && !loadingSchema && (
                <DynamicStudyForm
                  schema={schema}
                  studySlug={studySlug}
                  defaultValues={savedDoc}
                  currentId={documentId}
                  persist
                  submitLabel="Salvar alterações"
                  onSuccess={() => onSuccess()}
                  onProjectActivityChange={
                    listagemVariant === 'project' ? setProjectActivity : undefined
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
