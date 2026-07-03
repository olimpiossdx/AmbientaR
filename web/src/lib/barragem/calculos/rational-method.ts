import type { BarragemCalculoResult } from './types';

/** Vazão de pico pelo método racional — manual §4.5: Q = 0,278·C·I·A */
export function rationalMethod(
  C: number,
  I_mm_h: number,
  A_km2: number,
): BarragemCalculoResult<{ Q_m3s: number }> {
  const warnings: string[] = [];
  if (C <= 0 || C > 1) warnings.push('Coeficiente C fora do intervalo usual (0–1).');
  if (A_km2 <= 0) warnings.push('Área da bacia deve ser maior que zero.');
  if (I_mm_h <= 0) warnings.push('Intensidade de chuva deve ser maior que zero.');

  const Q_m3s = 0.278 * C * I_mm_h * A_km2;

  return {
    input: { C, I_mm_h, A_km2 },
    formula: 'Q = 0,278 · C · I · A',
    steps: [
      `Q = 0,278 × ${C} × ${I_mm_h} × ${A_km2}`,
      `Q = ${Q_m3s.toFixed(4)} m³/s`,
    ],
    result: { Q_m3s },
    status: warnings.length ? 'revisar' : 'calculado',
    warnings,
  };
}
