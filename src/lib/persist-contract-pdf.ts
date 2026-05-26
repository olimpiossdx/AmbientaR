import { doc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Contract } from '@/lib/types';
import type { LocalBranding } from '@/hooks/use-local-branding';
import type { BrandingPdfImages } from '@/lib/branding-pdf';
import { contractPdfBlob } from '@/app/(app)/contracts/contract-pdf';
import { sanitizeStorageFileName, uploadFileToStorage } from '@/lib/storage-upload';

function contractPdfStoragePath(contractId: string, contratanteNome?: string): string {
  const base = (contratanteNome || 'contrato').replace(/\s+/g, '_').slice(0, 60);
  return `contracts/${contractId}/para-assinatura-${Date.now()}-${sanitizeStorageFileName(base)}.pdf`;
}

/**
 * Envia o blob ao Storage e grava `contractPdfUrl` no Firestore.
 * Não altera `fileUrl` (reservado ao PDF assinado).
 */
export async function persistContractPdfBlob(
  firestore: Firestore,
  contractId: string,
  contract: Contract,
  blob: Blob,
): Promise<string> {
  if (!contractId?.trim()) {
    throw new Error("ID do contrato inválido para gerar o PDF.");
  }
  const file = new File([blob], "contrato-para-assinatura.pdf", {
    type: "application/pdf",
  });
  const storagePath = contractPdfStoragePath(
    contractId.trim(),
    contract.contratante?.nome,
  );
  const downloadUrl = await uploadFileToStorage(file, storagePath);
  await updateDoc(doc(firestore, "contracts", contractId), {
    contractPdfUrl: downloadUrl,
  });
  return downloadUrl;
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
  preloadedImages?: BrandingPdfImages | null,
): Promise<string> {
  const blob = await contractPdfBlob(contract, branding ?? undefined, {
    preloadedImages,
  });
  return persistContractPdfBlob(firestore, contractId, contract, blob);
}
