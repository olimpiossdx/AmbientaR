'use client';

import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getAmbientalContextByEmpreendimentoId } from '@/lib/ambiental-context';
import { getBearerApiHeaders } from '@/lib/api-client-auth';
import type { Prada } from '@/lib/types';
import { buildPradaExportBaseName } from '@/lib/prada/prada-export-filename';

export type PradaDocxExportResult = {
  blob: Blob;
  fileName: string;
};

export async function generatePradaExportDocxBlob(params: {
  prada: Prada;
  firestore: Firestore;
  auth: Auth | null | undefined;
  templateUrl?: string;
}): Promise<PradaDocxExportResult> {
  const { prada, firestore, auth, templateUrl } = params;
  const projectId = prada.empreendimento?.projectId?.trim();

  if (!projectId) {
    throw new Error(
      'Vincule um empreendimento cadastrado ao PRADA para exportar o Word com o template oficial.',
    );
  }

  const context = await getAmbientalContextByEmpreendimentoId(firestore, projectId);
  const headers = await getBearerApiHeaders(auth, {
    'Content-Type': 'application/json',
  });

  const res = await fetch('/api/pradas/export-docx', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pradaId: prada.id,
      context,
      prada,
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
  const base = buildPradaExportBaseName(prada);
  return { blob, fileName: `${base}.docx` };
}
