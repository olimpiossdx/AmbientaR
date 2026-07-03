import type { PiaRecord } from '@/lib/pia/pia-record';
import { sanitizeStorageFileName } from '@/lib/storage-upload';

export function buildPiaExportBaseName(record: PiaRecord): string {
  const emp = (record.empreendimento?.nome || 'PIA').replace(/\s+/g, '_').slice(0, 48);
  const date = new Date().toISOString().slice(0, 10);
  return sanitizeStorageFileName(`PIA_${emp}_${date}`);
}
