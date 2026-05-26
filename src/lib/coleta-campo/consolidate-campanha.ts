import { doc, serverTimestamp, updateDoc, type Firestore } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { Inventario } from '@/lib/types';
import { getClientFirebaseStorage } from '@/lib/firebase-storage-client';
import { COLLECTION_CAMPANHAS } from './constants';
import {
  buildCampanhaExcelArrayBuffer,
  validateCampanhaForExport,
  type ExportCampanhaInput,
  type ExportValidationIssue,
} from './export-excel';
import { mapCampanhaToInventoryImport } from './map-to-inventory-import';

const CONSOLIDATED_PATH = (campanhaId: string) =>
  `coleta-campo-exports/${campanhaId}/planilha-consolidada.xlsx`;

export type ConsolidateCampanhaResult = {
  issues: ExportValidationIssue[];
  downloadUrl?: string;
  storagePath?: string;
};

/**
 * Gera planilha Excel, grava no Storage e atualiza metadados da campanha.
 * Opcionalmente marca `status: concluida` (ao finalizar campanha).
 */
export async function consolidateCampanhaToStorage(
  firestore: Firestore,
  input: ExportCampanhaInput,
  options?: { markConcluida?: boolean },
): Promise<ConsolidateCampanhaResult> {
  const issues = validateCampanhaForExport(input);
  if (issues.some((i) => i.level === 'error')) {
    return { issues };
  }

  const buffer = buildCampanhaExcelArrayBuffer(input);
  const storagePath = CONSOLIDATED_PATH(input.campanha.id);
  const storage = getClientFirebaseStorage();
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, buffer, {
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const downloadUrl = await getDownloadURL(storageRef);

  const mapped = mapCampanhaToInventoryImport(input);
  const dataRowCount = Math.max(0, mapped.importedTrees.length);

  const patch: Partial<Inventario> & Record<string, unknown> = {
    exportExcelStoragePath: storagePath,
    exportExcelUrl: downloadUrl,
    exportConsolidatedAt: serverTimestamp(),
    exportSummary: {
      totalParcels: mapped.importedParcels.length,
      totalTrees: mapped.importedTrees.length,
      totalSpecies: mapped.importedSpecies.length,
      excelRowCount: dataRowCount,
    },
    updatedAt: serverTimestamp(),
  };

  if (options?.markConcluida) {
    patch.status = 'concluida';
  }

  await updateDoc(doc(firestore, COLLECTION_CAMPANHAS, input.campanha.id), patch);

  return { issues, downloadUrl, storagePath };
}
