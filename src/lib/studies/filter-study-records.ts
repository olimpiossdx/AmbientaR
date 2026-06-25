import { normalizeEntityId } from '@/lib/empreendedor-project-select';
import {
  getStudyEmpreendedorId,
  getStudyProjectId,
  type StudyExportRecord,
} from '@/lib/studies/study-export-record';

export type StudyEntityFilter = {
  empreendedorId?: string;
  projectId?: string;
};

/** Filtra registros de estudo por empreendedor e/ou empreendimento vinculado. */
export function filterStudyRecordsByEmpreendedorProject<
  T extends StudyExportRecord,
>(records: readonly T[], filter: StudyEntityFilter): T[] {
  const empreendedorId = normalizeEntityId(filter.empreendedorId);
  const projectId = normalizeEntityId(filter.projectId);
  if (!empreendedorId && !projectId) return [...records];

  return records.filter((record) => {
    if (empreendedorId) {
      const recordEmpId = normalizeEntityId(getStudyEmpreendedorId(record));
      if (recordEmpId !== empreendedorId) return false;
    }
    if (projectId) {
      const recordProjectId = normalizeEntityId(getStudyProjectId(record));
      const projectIds = getStudyProjectIds(record);
      if (projectIds.length > 0) {
        if (!projectIds.some((id) => normalizeEntityId(id) === projectId)) {
          return false;
        }
      } else if (recordProjectId !== projectId) {
        return false;
      }
    }
    return true;
  });
}

/** IDs de empreendimentos vinculados (ex.: procuração multi-select). */
export function getStudyProjectIds(record: StudyExportRecord): string[] {
  const raw = (record as Record<string, unknown>).projectIds;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((id) => (typeof id === 'string' ? id.trim() : ''))
    .filter(Boolean);
}
