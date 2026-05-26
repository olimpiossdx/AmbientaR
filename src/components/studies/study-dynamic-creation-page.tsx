'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DynamicStudyForm } from '@/components/dynamic-study-form';
import { TermosReferenciaCard } from '@/components/termos-referencia-card';
import { useStudyFormSchema } from '@/hooks/use-study-form-schema';
import { isStudyLinkedToTr } from '@/lib/termos-referencia-study-folders';
import {
  RCA_LISTAGEM_ACTIVITIES,
  RCA_SUBACTIVITIES,
} from '@/lib/rca-listagem-catalog';
import {
  LISTAGEM_ACTIVITY_BY_CODE,
  LISTAGEM_CODES,
  LISTAGEM_SHORT_BY_CODE,
} from '@/lib/listagem-activities';
import { ListagemActivityPicker } from '@/components/studies/listagem-activity-picker';
import { Badge } from '@/components/ui/badge';

type ListagemVariant = 'rca' | 'pca' | 'project';

type StudyDynamicCreationPageProps = {
  studySlug: string;
  studyLabel: string;
  pageTitle: string;
  cardTitle: string;
  listagemVariant: ListagemVariant;
  staticFormHref: string;
  onSuccess: () => void;
};

const FIRESTORE_COLLECTION: Record<string, string | null> = {
  rca: 'rcas',
  pca: 'pcas',
  'eia-rima': 'eiaRimas',
  ptrf: 'ptrfs',
  prada: 'pradas',
  'las-ras': 'lasRas',
  reanalise: 'reanalises',
};

export function StudyDynamicCreationPage({
  studySlug,
  studyLabel,
  pageTitle,
  cardTitle,
  listagemVariant,
  staticFormHref,
  onSuccess,
}: StudyDynamicCreationPageProps) {
  const [activity, setActivity] = React.useState('');
  const [subactivity, setSubactivity] = React.useState('');
  const [refreshToken, setRefreshToken] = React.useState(false);
  const [projectActivity, setProjectActivity] = React.useState<string | null>(null);

  const needsListagemPick = listagemVariant === 'rca' || listagemVariant === 'pca';
  const subOptionsForActivity =
    listagemVariant === 'rca' && activity ? RCA_SUBACTIVITIES[activity] ?? [] : [];
  const effectiveActivity =
    listagemVariant === 'project' ? projectActivity : activity || null;
  const effectiveSubactivity = listagemVariant === 'rca' ? subactivity || null : null;

  const listagemReady =
    listagemVariant === 'pca'
      ? Boolean(activity)
      : listagemVariant === 'rca'
        ? Boolean(activity) &&
          (subOptionsForActivity.length === 0 || Boolean(subactivity))
        : true;

  const schemaEnabled = listagemVariant === 'project' ? true : listagemReady;

  const { schema, matchedBy, loading, error, source } = useStudyFormSchema({
    studySlug,
    activity: effectiveActivity,
    subactivity: effectiveSubactivity,
    refresh: refreshToken,
    enabled: schemaEnabled,
  });

  const collectionName = FIRESTORE_COLLECTION[studySlug] ?? null;
  const listagemOptions =
    listagemVariant === 'rca'
      ? RCA_LISTAGEM_ACTIVITIES
      : LISTAGEM_CODES.map((c) => LISTAGEM_ACTIVITY_BY_CODE[c]);

  const subOptions = subOptionsForActivity;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={pageTitle}>
        <Button variant="outline" size="sm" asChild>
          <Link href={staticFormHref}>Formulário padrão</Link>
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          {isStudyLinkedToTr(studySlug) && (
            <TermosReferenciaCard studySlug={studySlug} studyLabel={studyLabel} />
          )}

          <Card>
            <CardHeader>
              <CardTitle>{cardTitle}</CardTitle>
              <CardDescription>
                Formulário gerado a partir do termo de referência vinculado à listagem e
                subatividade. Ao escolher empreendedor e empreendimento, os campos compatíveis
                são preenchidos automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {needsListagemPick && (
                <div className="grid gap-4 rounded-md border bg-muted/20 p-4 md:grid-cols-2">
                  <ListagemActivityPicker
                    value={activity}
                    onValueChange={(v) => {
                      setActivity(v);
                      setSubactivity('');
                    }}
                    options={[...listagemOptions]}
                  />
                  {listagemVariant === 'rca' && subOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label>Subatividade</Label>
                      <Select value={subactivity} onValueChange={setSubactivity}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a subatividade" />
                        </SelectTrigger>
                        <SelectContent>
                          {subOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {listagemVariant === 'project' && (
                <p className="text-sm text-muted-foreground">
                  O schema será ajustado conforme a listagem do empreendimento selecionado no
                  formulário (campo atividade do cadastro).
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!schemaEnabled || loading}
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

              {!schemaEnabled && (
                <Alert>
                  <AlertTitle>Selecione a listagem</AlertTitle>
                  <AlertDescription>
                    Escolha a listagem (e subatividade, se aplicável) para carregar o
                    formulário do termo de referência correspondente.
                  </AlertDescription>
                </Alert>
              )}

              {schemaEnabled && loading && (
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

              {schema?.listagemCode && !loading && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Formulário para</span>
                  <Badge variant="secondary" className="font-mono">
                    Listagem {schema.listagemCode}
                  </Badge>
                  {LISTAGEM_SHORT_BY_CODE[schema.listagemCode] && (
                    <span className="text-muted-foreground">
                      {LISTAGEM_SHORT_BY_CODE[schema.listagemCode]}
                    </span>
                  )}
                </div>
              )}

              {schema && !loading && (
                <DynamicStudyForm
                  schema={schema}
                  studySlug={studySlug}
                  persist={Boolean(collectionName)}
                  submitLabel="Salvar rascunho"
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
