import { doc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Contract } from '@/lib/types';
import type { LocalBranding } from '@/hooks/use-local-branding';
import { contractPdfBlob } from '@/app/(app)/contracts/contract-pdf';
import { sanitizeStorageFileName, uploadFileToStorage } from '@/lib/storage-upload';

function contractPdfStoragePath(contractId: string, contratanteNome?: string): string {
  const base = (contratanteNome || 'contrato').replace(/\s+/g, '_').slice(0, 60);
  return `contracts/${contractId}/para-assinatura-${Date.now()}-${sanitizeStorageFileName(base)}.pdf`;
}

/**
 * Gera o PDF do contrato, envia ao Storage e grava `contractPdfUrl` no Firestore.
 * Não altera `fileUrl` (reservado ao PDF assinado).
 */
export async function persistContractPdfForSignature(
  firestore: Firestore,
  contractId: string,
  contract: Contract,
  branding?: LocalBranding | null,
): Promise<string> {
  const blob = await contractPdfBlob(contract, branding ?? undefined);
  const file = new File([blob], 'contrato-para-assinatura.pdf', { type: 'application/pdf' });
  const storagePath = contractPdfStoragePath(contractId, contract.contratante?.nome);
  const downloadUrl = await uploadFileToStorage(file, storagePath);
  await updateDoc(doc(firestore, 'contracts', contractId), { contractPdfUrl: downloadUrl });
  return downloadUrl;
}
