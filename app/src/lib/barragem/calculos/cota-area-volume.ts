import type { BarragemCalculoResult } from './types';

/** Volume parcial entre duas cotas — manual §3.3: V = (A_i + A_{i+1})/2 · Δh */
export function cotaAreaVolumeRow(
  A_i_m2: number,
  A_i1_m2: number,
  deltaH_m: number,
): BarragemCalculoResult<{ V_parcial_m3: number }> {
  const warnings: string[] = [];
  if (deltaH_m <= 0) warnings.push('Δh deve ser maior que zero.');
  if (A_i_m2 < 0 || A_i1_m2 < 0) warnings.push('Áreas não podem ser negativas.');
  if (A_i1_m2 < A_i_m2) {
    warnings.push('Área na cota superior menor que na inferior — verificar dados.');
  }

  const V_parcial_m3 = ((A_i_m2 + A_i1_m2) / 2) * deltaH_m;

  return {
    input: { A_i_m2, A_i1_m2, deltaH_m },
    formula: 'V = (A_i + A_{i+1}) / 2 · Δh',
    steps: [
      `V = (${A_i_m2} + ${A_i1_m2}) / 2 × ${deltaH_m}`,
      `V = ${V_parcial_m3.toFixed(2)} m³`,
    ],
    result: { V_parcial_m3 },
    status: warnings.length ? 'revisar' : 'calculado',
    warnings,
  };
}

/** Volume acumulado até o nível n (soma dos parciais). */
export function cotaAreaVolumeAcumulado(parciais_m3: number[]): number {
  return parciais_m3.reduce((acc, v) => acc + v, 0);
}

/** Recalcula tabela cota-área-volume a partir de linhas com cota e área. */
export type CotaAreaLinha = {
  cota: number;
  areaM2: number;
};

export type CotaAreaLinhaCalculada = CotaAreaLinha & {
  deltaH_m: number;
  volumeParcialM3: number;
  volumeAcumuladoM3: number;
};

export function calcularTabelaCotaAreaVolume(
  linhas: CotaAreaLinha[],
): CotaAreaLinhaCalculada[] {
  if (linhas.length === 0) return [];

  const sorted = [...linhas].sort((a, b) => a.cota - b.cota);
  const result: CotaAreaLinhaCalculada[] = [];
  let acumulado = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      result.push({
        ...sorted[i],
        deltaH_m: 0,
        volumeParcialM3: 0,
        volumeAcumuladoM3: 0,
      });
      continue;
    }
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const deltaH_m = curr.cota - prev.cota;
    const { result: vol } = cotaAreaVolumeRow(prev.areaM2, curr.areaM2, deltaH_m);
    acumulado += vol.V_parcial_m3;
    result.push({
      ...curr,
      deltaH_m,
      volumeParcialM3: vol.V_parcial_m3,
      volumeAcumuladoM3: acumulado,
    });
  }

  return result;
}
