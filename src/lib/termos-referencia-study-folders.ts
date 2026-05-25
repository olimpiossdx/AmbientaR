/** Slug do estudo na rota (ex.: prada, ptrf). */
export type StudySlug = string;

/** Subpasta dentro de "termos de referencia" vinculada a um estudo. */
export const STUDY_TR_FOLDER: Record<string, string> = {
  prada: 'PRADA',
  ptrf: 'PTRF',
  pea: 'PEA',
  'educacao-ambiental': 'PEA',
};

/** Estudos que já possuem vínculo com subpasta de TR. */
export const LINKED_STUDIES: StudySlug[] = ['prada', 'ptrf', 'pea', 'educacao-ambiental'];

export function getTrFolderForStudy(studySlug: string): string | null {
  const normalized = studySlug?.toLowerCase().trim() || '';
  return STUDY_TR_FOLDER[normalized] ?? null;
}

export function isStudyLinkedToTr(studySlug: string): boolean {
  return LINKED_STUDIES.includes(studySlug?.toLowerCase().trim() || '');
}
