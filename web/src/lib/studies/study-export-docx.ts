'use client';

import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getAmbientalContextByEmpreendimentoId } from '@/lib/ambiental-context';
import { getBearerApiHeaders } from '@/lib/api-client-auth';
import type { DocxTemplateSlug } from '@/lib/docx-template-slugs';
import {
  getStudyExportBaseName,
  getStudyProjectId,
  type StudyExportRecord,
} from '@/lib/studies/study-export-record';

export type StudyDocxExportResult = {
  blob: Blob;
  fileName: string;
};

export async function generateStudyExportDocxBlob(params: {
  record: StudyExportRecord;
  templateSlug: DocxTemplateSlug;
  firestore: Firestore;
  auth: Auth | null | undefined;
  templateUrl?: string;
}): Promise<StudyDocxExportResult> {
  const { record, templateSlug, firestore, auth, templateUrl } = params;
  const projectId = getStudyProjectId(record);
  if (!projectId) {
    throw new Error(
      'Vincule um empreendimento cadastrado para exportar o Word com template e branding.',
    );
  }

  const context = await getAmbientalContextByEmpreendimentoId(firestore, projectId);
  const headers = await getBearerApiHeaders(auth, {
    'Content-Type': 'application/json',
  });

  const res = await fetch('/api/laudos/gerar-docx', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      laudoId: record.id,
      tipoEstudo: templateSlug,
      context,
      templateUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? res.statusText ?? 'Erro ao gerar Word.',
    );
  }

  const blob = await res.blob();
  const base = getStudyExportBaseName(record, templateSlug);
  return { blob, fileName: `${base}.docx` };
}
