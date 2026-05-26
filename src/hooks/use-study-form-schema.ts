'use client';

import * as React from 'react';
import { useFirebase } from '@/firebase';
import { fetchApiWithAuth } from '@/lib/api-client-auth';
import type { StudyFormSchema } from '@/lib/study-form-schema';

export type StudyFormSchemaMatch = {
  listagemCode: string | null;
  subactivity: string | null;
  file: string;
  strategy: string;
};

export type UseStudyFormSchemaOptions = {
  studySlug: string;
  activity?: string | null;
  subactivity?: string | null;
  source?: 'auto' | 'docx' | 'static';
  refresh?: boolean;
  enabled?: boolean;
};

export function useStudyFormSchema({
  studySlug,
  activity,
  subactivity,
  source = 'auto',
  refresh = false,
  enabled = true,
}: UseStudyFormSchemaOptions) {
  const { auth } = useFirebase();
  const [schema, setSchema] = React.useState<StudyFormSchema | null>(null);
  const [sourceKind, setSourceKind] = React.useState<string | null>(null);
  const [matchedBy, setMatchedBy] = React.useState<StudyFormSchemaMatch | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const activityKey = activity?.trim() || '';
  const subactivityKey = subactivity?.trim() || '';

  React.useEffect(() => {
    if (!enabled || !studySlug) {
      setSchema(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ source });
    if (refresh) params.set('refresh', '1');
    if (activityKey) params.set('activity', activityKey);
    if (subactivityKey) params.set('subactivity', subactivityKey);

    fetchApiWithAuth(auth, `/api/studies/${encodeURIComponent(studySlug)}/form-schema?${params}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Não foi possível carregar o formulário do documento.');
        }
        setSchema(data.schema as StudyFormSchema);
        setSourceKind(data.source ?? null);
        setMatchedBy(data.matchedBy ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          setSchema(null);
          setMatchedBy(null);
          setSourceKind(null);
          setError(e instanceof Error ? e.message : 'Erro ao carregar schema.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auth, studySlug, activityKey, subactivityKey, source, refresh, enabled]);

  return { schema, source: sourceKind, matchedBy, loading, error };
}
