/** Slug do estudo na rota (ex.: prada, ptrf). */
export type StudySlug = string;

/** Subpasta dentro de "termos de referencia" vinculada a um estudo. */
export const STUDY_TR_FOLDER: Record<string, string> = {
  prada: 'PRADA',
  ptrf: 'PTRF',
  pea: 'PEA',
  'educacao-ambiental': 'PEA',
  rca: 'RCA',
  pca: 'PCA',
  'eia-rima': 'EIA-RIMA',
  'las-ras': 'LAS-RAS',
  reanalise: 'REANALISE',
};

/** Estudos que já possuem vínculo com subpasta de TR. */
export const LINKED_STUDIES: StudySlug[] = [
  'prada',
  'ptrf',
  'pea',
  'educacao-ambiental',
  'rca',
  'pca',
  'eia-rima',
  'las-ras',
  'reanalise',
];

export function getTrFolderForStudy(studySlug: string): string | null {
  const normalized = studySlug?.toLowerCase().trim() || '';
  return STUDY_TR_FOLDER[normalized] ?? null;
}

export function isStudyLinkedToTr(studySlug: string): boolean {
  return LINKED_STUDIES.includes(studySlug?.toLowerCase().trim() || '');
}

/** Rota do formulário dinâmico (criação a partir do termo de referência). */
export function getStudyDynamicFormHref(studySlug: string): string {
  const slug = studySlug?.toLowerCase().trim() || '';
  if (slug === 'las-ras' || slug === 'reanalise') {
    return `/studies/${slug}/new?form=dynamic`;
  }
  return `/studies/${slug}/new?form=dynamic`;
}
