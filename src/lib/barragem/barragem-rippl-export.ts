import type { RipplSerieMensalRow } from '@/lib/types';
import {
  formatRipplMemorial,
  parseNumeroFormulario,
  ripplAnalise,
  type RipplPeriodoInput,
} from '@/lib/barragem/calculos';

/** Monta corpo da secção Rippl para exportação (memorial salvo ou recálculo da série). */
export function buildRipplExportBody(
  ripplSeries: RipplSerieMensalRow[] | undefined,
  memorial: string | undefined | null,
): string {
  const stored = memorial != null && String(memorial).trim() !== '' ? String(memorial).trim() : '';
  const periodos = ripplSeriesToInput(ripplSeries);
  if (periodos.length) {
    const calc = ripplAnalise(periodos);
    return formatRipplMemorial(calc).replace(/^###[^\n]*\n+/m, '');
  }
  if (stored) return stored;
  return '';
}

export function ripplSeriesToInput(rows: RipplSerieMensalRow[] | undefined): RipplPeriodoInput[] {
  if (!rows?.length) return [];
  return rows
    .map((r) => ({
      label: r.label,
      qAfluente_m3s: parseNumeroFormulario(r.qAfluenteM3s) ?? undefined,
      qDemanda_m3s: parseNumeroFormulario(r.qDemandaM3s) ?? undefined,
      diasNoPeriodo: parseNumeroFormulario(r.diasNoPeriodo) ?? 30,
      evap_m3: parseNumeroFormulario(r.evapM3) ?? 0,
    }))
    .filter(
      (p) =>
        (p.qAfluente_m3s != null && p.qAfluente_m3s > 0) ||
        (p.qDemanda_m3s != null && p.qDemanda_m3s > 0),
    );
}
