/** Utilitários compartilhados para fusão de cadastros (cliente / empreendedor). */

export type MergeableRecord = Record<string, unknown> & { id: string };

export type MergePreviewRow = {
  field: string;
  label: string;
  canonicalValue: string;
  mergedValue: string;
  changed: boolean;
  sourceId?: string;
};

function toDisplayValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter(Boolean).join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

function timestampMs(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof value === "object" && value !== null && "toMillis" in value) {
    const fn = (value as { toMillis?: () => number }).toMillis;
    if (typeof fn === "function") return fn.call(value);
  }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    const sec = (value as { seconds?: number }).seconds;
    return typeof sec === "number" ? sec * 1000 : 0;
  }
  return 0;
}

function recordRecencyScore(record: MergeableRecord): number {
  return Math.max(
    timestampMs(record.updatedAt),
    timestampMs(record.createdAt),
  );
}

/** Pontuação de completude genérica (campos string não vazios + pesos opcionais). */
export function completenessScoreForFields(
  record: MergeableRecord,
  fields: string[],
  weights: Partial<Record<string, number>> = {},
): number {
  let score = 0;
  for (const field of fields) {
    const raw = record[field];
    const filled =
      typeof raw === "string"
        ? Boolean(raw.trim())
        : Array.isArray(raw)
          ? raw.length > 0
          : raw !== undefined && raw !== null && raw !== "";
    if (!filled) continue;
    score += weights[field] ?? 2;
  }
  if (typeof record.userId === "string" && record.userId.trim()) {
    score += weights.userId ?? 20;
  }
  const approved = record.approvedUserIds;
  if (Array.isArray(approved) && approved.length > 0) {
    score += weights.approvedUserIds ?? 5;
  }
  return score;
}

/**
 * Escolhe o valor final de um campo: preenche vazio do canônico;
 * se ambos preenchidos, prefere o registro mais recente (updatedAt/createdAt).
 */
export function pickMergedScalarField(
  canonical: MergeableRecord,
  duplicates: MergeableRecord[],
  field: string,
): unknown {
  const current = canonical[field];
  const currentStr = toDisplayValue(current);
  if (!currentStr) {
    let best: { value: unknown; score: number } | null = null;
    for (const dup of duplicates) {
      const v = dup[field];
      const s = toDisplayValue(v);
      if (!s) continue;
      const recency = recordRecencyScore(dup);
      if (!best || recency > best.score) best = { value: v, score: recency };
    }
    return best?.value ?? current;
  }

  let bestValue = current;
  let bestScore = recordRecencyScore(canonical);
  for (const dup of duplicates) {
    const v = dup[field];
    const s = toDisplayValue(v);
    if (!s) continue;
    const recency = recordRecencyScore(dup);
    if (recency > bestScore) {
      bestScore = recency;
      bestValue = v;
    }
  }
  return bestValue;
}

export function mergeStringFieldsIntoPayload(
  canonical: MergeableRecord,
  duplicates: MergeableRecord[],
  fields: string[],
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...canonical };
  for (const field of fields) {
    merged[field] = pickMergedScalarField(canonical, duplicates, field);
  }
  return merged;
}

export function unionStringArrays(
  canonical: MergeableRecord,
  duplicates: MergeableRecord[],
  field: string,
): string[] {
  const set = new Set<string>();
  const push = (arr: unknown) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((id) => {
      if (typeof id === "string" && id.trim()) set.add(id);
    });
  };
  push(canonical[field]);
  for (const dup of duplicates) push(dup[field]);
  return Array.from(set);
}

export function buildMergePreviewRows(
  canonical: MergeableRecord,
  duplicates: MergeableRecord[],
  fieldDefs: ReadonlyArray<{ field: string; label: string }>,
  mergedPayload: Record<string, unknown>,
): MergePreviewRow[] {
  return fieldDefs.map(({ field, label }) => {
    const canonicalValue = toDisplayValue(canonical[field]) || "—";
    const mergedValue = toDisplayValue(mergedPayload[field]) || "—";
    const changed = canonicalValue !== mergedValue;
    let sourceId: string | undefined;
    if (changed) {
      for (const dup of duplicates) {
        const dv = toDisplayValue(dup[field]);
        if (dv && dv === mergedValue) {
          sourceId = dup.id;
          break;
        }
      }
    }
    return { field, label, canonicalValue, mergedValue, changed, sourceId };
  });
}

export function pickIdByCompleteness(
  candidateIds: string[],
  recordsById: Map<string, MergeableRecord>,
  scoreFields: string[],
  fieldWeights?: Partial<Record<string, number>>,
): string {
  let bestId = candidateIds[0];
  let bestScore = -1;
  for (const id of candidateIds) {
    const rec = recordsById.get(id);
    if (!rec) continue;
    const score = completenessScoreForFields(rec, scoreFields, fieldWeights);
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }
  return bestId;
}
