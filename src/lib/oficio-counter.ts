import type { Oficio } from '@/lib/types';

export type OficioCounterDoc = {
  lastSequence: number;
  updatedAt?: string;
  updatedBy?: string;
};

/** Próximo número sequencial após `lastSequence` (ex.: 14 → 15). */
export function getNextOficioSequence(lastSequence: number | undefined | null): number {
  const n = typeof lastSequence === 'number' && lastSequence >= 0 ? lastSequence : 0;
  return n + 1;
}

export function formatOficioNumberFromSequence(sequence: number, year: number): string {
  return `${String(sequence).padStart(3, '0')}/${year}`;
}

/** Maior sequência já gravada em ofícios concluídos no ano (plataforma). */
export function maxConcludedSequenceInYear(oficios: Oficio[] | undefined, year: number): number {
  if (!oficios?.length) return 0;
  let max = 0;
  for (const o of oficios) {
    if (o.status !== 'Concluído') continue;
    const y = o.year ?? (o.oficioNumber?.includes('/') ? Number(o.oficioNumber.split('/')[1]) : undefined);
    if (y !== year) continue;
    const seq = o.sequence ?? (o.oficioNumber ? parseInt(o.oficioNumber.split('/')[0], 10) : 0);
    if (!Number.isNaN(seq) && seq > max) max = seq;
  }
  return max;
}
