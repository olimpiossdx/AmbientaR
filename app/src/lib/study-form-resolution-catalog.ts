export type StudyTypeKey = 'rca' | 'pca' | 'eia-rima' | 'las-ras' | 'reanalise';

type StudyResolutionCatalog = {
  aliases: string[];
  listagemAliases: Record<string, string[]>;
};

const BASE_LISTAGEM_ALIASES: Record<string, string[]> = {
  A: ['listagem a', 'a'],
  B: ['listagem b', 'b'],
  C: ['listagem c', 'c'],
  D: ['listagem d', 'd'],
  E: ['listagem e', 'e'],
  F: ['listagem f', 'f'],
  G: ['listagem g', 'g'],
  H: ['listagem h', 'h'],
};

export const STUDY_FORM_RESOLUTION_CATALOG: Record<StudyTypeKey, StudyResolutionCatalog> = {
  rca: {
    aliases: ['rca', 'relatorio controle ambiental'],
    listagemAliases: BASE_LISTAGEM_ALIASES,
  },
  pca: {
    aliases: ['pca', 'plano controle ambiental'],
    listagemAliases: BASE_LISTAGEM_ALIASES,
  },
  'eia-rima': {
    aliases: ['eia', 'rima', 'eia rima', 'estudo impacto ambiental'],
    listagemAliases: BASE_LISTAGEM_ALIASES,
  },
  'las-ras': {
    aliases: ['las', 'ras', 'las ras', 'relatorio ambiental simplificado'],
    listagemAliases: BASE_LISTAGEM_ALIASES,
  },
  reanalise: {
    aliases: ['reanalise', 'reanalisar', 'reanalise processo'],
    listagemAliases: BASE_LISTAGEM_ALIASES,
  },
};

export function getStudyCatalogAliases(studySlug: string): string[] {
  const key = studySlug as StudyTypeKey;
  return STUDY_FORM_RESOLUTION_CATALOG[key]?.aliases ?? [studySlug];
}

export function getListagemCatalogAliases(studySlug: string, listagemCode?: string | null): string[] {
  if (!listagemCode) return [];
  const key = studySlug as StudyTypeKey;
  const byStudy = STUDY_FORM_RESOLUTION_CATALOG[key]?.listagemAliases?.[listagemCode];
  return byStudy ?? BASE_LISTAGEM_ALIASES[listagemCode] ?? [];
}
