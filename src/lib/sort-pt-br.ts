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
