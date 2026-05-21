/**
 * Contador anual de ofícios (oficioCounters/{year}).
 * Um documento por ano civil; a aprovação usa sempre o ano corrente do calendário.
 */

export type OficioForCounter = {
  status?: string;
  year?: number;
  sequence?: number;
};

export type OficioCounterRow = {
  year: number;
  lastSequence: number;
  updatedAt?: string;
};

export type OficioCounterDoc = {
  lastSequence: number;
  updatedAt?: string;
  updatedBy?: string;
};

export function getCurrentCalendarYear(): number {
  return new Date().getFullYear();
}

/** Maior sequence entre ofícios Concluídos do ano (dados já carregados na página). */
export function maxConcludedSequenceInYear(
  oficios: OficioForCounter[],
  year: number,
): number {
  let max = 0;
  for (const o of oficios) {
    if (o.status !== "Concluído" || o.year !== year) continue;
    const seq = typeof o.sequence === "number" ? o.sequence : 0;
    if (seq > max) max = seq;
  }
  return max;
}

/** Próximo número que a aprovação atribuiria (contador Firestore + máximo na plataforma). */
export function nextSequenceAfterApproval(
  counterLast: number | null | undefined,
  oficios: OficioForCounter[],
  year: number,
): number {
  const fromCounter = typeof counterLast === "number" && counterLast >= 0 ? counterLast : 0;
  const fromPlatform = maxConcludedSequenceInYear(oficios, year);
  return Math.max(fromCounter, fromPlatform) + 1;
}

export function parseCounterYearInput(raw: string): number | null {
  const y = parseInt(raw.trim(), 10);
  if (!Number.isFinite(y) || y < 2000 || y > 2100) return null;
  return y;
}

export function parseCounterLastInput(raw: string): number | null {
  const n = parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 0 || n > 9999) return null;
  return n;
}

/** Valida gravação manual do contador (admin). */
export function validateCounterSave(
  year: number,
  lastSequence: number,
  oficios: OficioForCounter[],
): { ok: true } | { ok: false; message: string } {
  const maxOnPlatform = maxConcludedSequenceInYear(oficios, year);
  if (lastSequence < maxOnPlatform) {
    return {
      ok: false,
      message: `O último número não pode ser menor que ${maxOnPlatform} (já existem ofícios concluídos ${String(maxOnPlatform).padStart(3, "0")}/${year} na plataforma).`,
    };
  }
  return { ok: true };
}

/** Exclusão só permitida se não houver ofícios concluídos naquele ano. */
export function canDeleteCounterRow(
  year: number,
  oficios: OficioForCounter[],
): { ok: true } | { ok: false; message: string } {
  const maxOnPlatform = maxConcludedSequenceInYear(oficios, year);
  if (maxOnPlatform > 0) {
    return {
      ok: false,
      message: `Não é possível excluir: existem ofícios concluídos em ${year} (último nº ${maxOnPlatform}).`,
    };
  }
  return { ok: true };
}

export function counterDocToRow(year: number, data: OficioCounterDoc): OficioCounterRow {
  return {
    year,
    lastSequence: data.lastSequence,
    updatedAt: data.updatedAt,
  };
}

export function sortCounterRowsDesc(rows: OficioCounterRow[]): OficioCounterRow[] {
  return [...rows].sort((a, b) => b.year - a.year);
}

export function formatOficioNumberFromSequence(sequence: number, year: number): string {
  return `${String(sequence).padStart(3, "0")}/${year}`;
}

/** Próximo número após um último número já gravado no contador (pré-visualização na UI). */
export function getNextOficioSequence(lastSequence: number): number {
  return lastSequence + 1;
}
