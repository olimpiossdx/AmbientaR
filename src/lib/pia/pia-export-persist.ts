'use client';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { sanitizeStorageFileName, uploadFileToStorage } from '@/lib/storage-upload';
import { PIA_LICENSING_DOC_ID } from '@/lib/pia/pia-licensing-doc';
import type { PiaExportVersion, PiaRecord } from '@/lib/pia/pia-record';

function storagePathForPiaExport(
  piaId: string,
  format: 'pdf' | 'docx',
  fileName: string,
): string {
  return `pias/${piaId}/exports/${Date.now()}-${format}-${sanitizeStorageFileName(fileName)}`;
}

export async function persistPiaExportVersion(
  firestore: Firestore,
  piaId: string,
  format: 'pdf' | 'docx',
  blob: Blob,
  fileName: string,
  sectionManifest: string[],
  createdBy?: string,
): Promise<PiaExportVersion> {
  const file = new File([blob], fileName, {
    type:
      format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const storagePath = storagePathForPiaExport(piaId, format, fileName);
  const downloadUrl = await uploadFileToStorage(file, storagePath);
  const versionId = `${Date.now()}-${format}`;
  const createdAt = new Date().toISOString();

  const version: PiaExportVersion = {
    versionId,
    format,
    storagePath,
    downloadUrl,
    fileName,
    createdAt,
    sectionManifest,
    createdBy,
  };

  const piaRef = doc(firestore, 'pias', piaId);
  const snap = await getDoc(piaRef);
  const existing = snap.data() as PiaRecord | undefined;
  const prev = existing?.exportVersions ?? [];
  const latestKey = format === 'pdf' ? 'pdf' : 'docx';
  const ref = {
    versionId,
    storagePath,
    downloadUrl,
    fileName,
    createdAt,
    sectionManifest,
  };

  await updateDoc(piaRef, {
    exportVersions: [...prev, version],
    latestExport: {
      ...(existing?.latestExport ?? {}),
      [latestKey]: ref,
    },
  });

  return version;
}

type LicensingDocRow = {
  id: string;
  label: string;
  checked: boolean;
  fileName?: string;
  fileUrl?: string;
  source?: string;
  piaId?: string;
};

/** Anexa exportação PDF ao processo de licenciamento (slot PIA). */
export async function attachPiaPdfToRequestLicensing(
  firestore: Firestore,
  requestId: string,
  piaId: string,
  fileUrl: string,
  fileName: string,
): Promise<void> {
  const reqRef = doc(firestore, 'requests', requestId);
  const snap = await getDoc(reqRef);
  if (!snap.exists()) {
    throw new Error('Processo não encontrado para anexar o PIA.');
  }

  const data = snap.data() as {
    licensingData?: { documents?: LicensingDocRow[] };
  };
  const docs = [...(data.licensingData?.documents ?? [])];
  let idx = docs.findIndex((d) => d.id === PIA_LICENSING_DOC_ID);
  if (idx < 0) {
    docs.push({
      id: PIA_LICENSING_DOC_ID,
      label: 'Projeto de Intervenção Ambiental (PIA)',
      checked: true,
      fileName,
      fileUrl,
      source: 'pia_export',
      piaId,
    });
  } else {
    docs[idx] = {
      ...docs[idx],
      checked: true,
      fileName,
      fileUrl,
      source: 'pia_export',
      piaId,
    };
  }

  await updateDoc(reqRef, {
    'licensingData.documents': docs,
  });
}
