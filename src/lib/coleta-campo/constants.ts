/** Rotas e coleções do módulo Coleta de campo (independente de `inventories`). */

export const COLETA_CAMPO_BASE = '/coleta-campo';

export const COLLECTION_CAMPANHAS = 'inventarios';
export const COLLECTION_PARCELAS = 'inventario_parcelas';
export const COLLECTION_INDIVIDUOS = 'inventario_individuos';

/** Colunas do modelo de importação do Inventário Florestal (`import-dialog.tsx`). */
export const EXCEL_HEADERS_BASE = [
  'Parcela',
  'Área da Parcela',
  'Núm. Árvore',
  'Nome Científico',
  'Nome Comum',
  'Família',
  'CAP',
  'Alt. Total',
  'Alt. Comercial',
] as const;

export const EXCEL_HEADERS_MULTINIVEL_EXTRA = ['UP', 'US', 'NI'] as const;

export function excelHeadersForTipo(tipo: 'simples' | 'multinivel'): string[] {
  if (tipo === 'multinivel') {
    return [
      'Parcela',
      ...EXCEL_HEADERS_MULTINIVEL_EXTRA,
      'Área da Parcela',
      'Núm. Árvore',
      'Nome Científico',
      'Nome Comum',
      'Família',
      'CAP',
      'Alt. Total',
      'Alt. Comercial',
    ];
  }
  return [...EXCEL_HEADERS_BASE];
}

export const CAMPANHA_STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  em_campo: 'Em campo',
  sincronizado: 'Sincronizado',
  concluida: 'Concluída',
};

export function suggestParcelaCodigo(existingCount: number): string {
  const n = existingCount + 1;
  return `P${String(n).padStart(2, '0')}`;
}
