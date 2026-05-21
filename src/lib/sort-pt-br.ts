/** Ordenação alfabética em português (pt-BR). */
export function comparePtBr(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

export function sortStringsPt(items: readonly string[]): string[] {
  return [...items].sort(comparePtBr);
}

export function sortByLabelPt<T>(
  items: readonly T[],
  getLabel: (item: T) => string,
): T[] {
  return [...items].sort((a, b) => comparePtBr(getLabel(a), getLabel(b)));
}

/** Empreendedores, clientes, fornecedores, consultorias, etc. */
export function sortByNamePt<T extends { name?: string | null }>(
  items: readonly T[],
): T[] {
  return sortByLabelPt(items, (item) => item.name?.trim() || '');
}

/** Empreendimentos (cadastro projects). */
export function sortByPropertyNamePt<T extends { propertyName?: string | null }>(
  items: readonly T[],
): T[] {
  return sortByLabelPt(items, (item) => item.propertyName?.trim() || '');
}

/**
 * Ordena listas de documentos Firestore para listas/selects:
 * por `propertyName` (empreendimentos) ou `name` (demais cadastros).
 */
export function sortFirestoreDocsForSelect<T extends Record<string, unknown>>(
  items: readonly T[],
): T[] {
  if (items.length < 2) return [...items];
  const sample = items[0];
  if (typeof sample.propertyName === 'string') {
    return sortByPropertyNamePt(items as (T & { propertyName?: string | null })[]);
  }
  if (typeof sample.name === 'string') {
    return sortByNamePt(items as (T & { name?: string | null })[]);
  }
  return [...items];
}
