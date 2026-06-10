import { doc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Procuracao } from '@/lib/types';
import type { LocalBranding } from '@/hooks/use-local-branding';
import type { BrandingPdfImages } from '@/lib/branding-pdf';
import { procuracaoPdfBlob } from '@/app/(app)/studies/procuracao/procuracao-pdf';
import { sanitizeStorageFileName, uploadFileToStorage } from '@/lib/storage-upload';

function procuracaoPdfStoragePath(procuracaoId: string, outorganteNome?: string): string {
  const base = (outorganteNome || 'procuracao').replace(/\s+/g, '_').slice(0, 60);
  return `procuracoes/${procuracaoId}/para-assinatura-${Date.now()}-${sanitizeStorageFileName(base)}.pdf`;
}

export async function persistProcuracaoPdfBlob(
  firestore: Firestore,
  procuracaoId: string,
  proc: Procuracao,
  blob: Blob,
): Promise<string> {
  if (!procuracaoId?.trim()) {
    throw new Error('ID da procuração inválido para gerar o PDF.');
  }
  const file = new File([blob], 'procuracao-para-assinatura.pdf', {
    type: 'application/pdf',
  });
  const storagePath = procuracaoPdfStoragePath(
    procuracaoId.trim(),
    proc.outorgante?.nome,
  );
  const downloadUrl = await uploadFileToStorage(file, storagePath);
  await updateDoc(doc(firestore, 'procuracoes', procuracaoId), {
    contractPdfUrl: downloadUrl,
  });
  return downloadUrl;
}

export async function persistProcuracaoPdfForSignature(
  firestore: Firestore,
  procuracaoId: string,
  proc: Procuracao,
  branding?: LocalBranding | null,
  preloadedImages?: BrandingPdfImages | null,
): Promise<string> {
  const blob = await procuracaoPdfBlob(proc, branding ?? undefined, {
    preloadedImages,
  });
  return persistProcuracaoPdfBlob(firestore, procuracaoId, proc, blob);
}
