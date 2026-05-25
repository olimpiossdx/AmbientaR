/** Ordena documentos Firestore pelo campo `updatedAt` (mais recente primeiro). */
export function sortByFirestoreUpdatedAt<T>(rows: readonly T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      firestoreMillis((b as { updatedAt?: unknown }).updatedAt) -
      firestoreMillis((a as { updatedAt?: unknown }).updatedAt),
  );
}

function firestoreMillis(v: unknown): number {
  if (v && typeof v === 'object' && 'toMillis' in v) {
    return (v as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/** Ordena por campo de data ISO `YYYY-MM-DD` (mais recente primeiro). */
export function sortByIsoDateField<T>(
  rows: readonly T[],
  field: keyof T & string,
): T[] {
  return [...rows].sort((a, b) => {
    const da = String((a as Record<string, unknown>)[field] ?? '');
    const db = String((b as Record<string, unknown>)[field] ?? '');
    return db.localeCompare(da);
  });
}

/** Ordena oportunidades por `closeDate` (desc). */
export function sortOpportunitiesByCloseDate<T extends { closeDate?: string }>(
  rows: readonly T[],
): T[] {
  return sortByIsoDateField(rows, 'closeDate');
}

/** Ordena propostas comerciais por `proposalDate` (desc). */
export function sortCommercialProposalsByDate<T extends { proposalDate?: string }>(
  rows: readonly T[],
): T[] {
  return sortByIsoDateField(rows, 'proposalDate');
}
