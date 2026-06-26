import {
  calcularTabelaCotaAreaVolume,
  parseNumeroFormulario,
} from '@/lib/barragem/calculos';

export type TabelaNivelFormRow = {
  cota?: string;
  areaM2?: string;
  alturaM?: string;
  volumeM3?: string;
  volumeAcumuladoM3?: string;
};

/** Recalcula volumes parciais e acumulados a partir de cotas e áreas. */
export function recalcularTabelaNiveis(linhas: TabelaNivelFormRow[]): TabelaNivelFormRow[] {
  const parsed = linhas
    .map((row) => ({
      cota: parseNumeroFormulario(row.cota),
      areaM2: parseNumeroFormulario(row.areaM2),
      original: row,
    }))
    .filter((r): r is { cota: number; areaM2: number; original: TabelaNivelFormRow } =>
      r.cota != null && r.areaM2 != null,
    );

  if (parsed.length === 0) return linhas;

  const calculada = calcularTabelaCotaAreaVolume(
    parsed.map((p) => ({ cota: p.cota, areaM2: p.areaM2 })),
  );

  const byCota = new Map(calculada.map((c) => [c.cota, c]));

  return linhas.map((row) => {
    const cota = parseNumeroFormulario(row.cota);
    const calc = cota != null ? byCota.get(cota) : undefined;
    if (!calc) return row;
    return {
      ...row,
      alturaM: calc.deltaH_m > 0 ? String(calc.deltaH_m) : row.alturaM ?? '',
      volumeM3: calc.volumeParcialM3 > 0 ? calc.volumeParcialM3.toFixed(2) : row.volumeM3 ?? '0',
      volumeAcumuladoM3: calc.volumeAcumuladoM3.toFixed(2),
    };
  });
}
