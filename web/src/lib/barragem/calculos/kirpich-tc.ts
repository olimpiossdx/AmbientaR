import type { BarragemCalculoResult } from './types';

/** Tempo de concentração — Kirpich adaptado, manual §4.3: Tc = 57·(L³/H)^0,385 (min) */
export function kirpichTc(
  L_km: number,
  H_m: number,
): BarragemCalculoResult<{ Tc_min: number }> {
  const warnings: string[] = [];
  if (L_km <= 0) warnings.push('Comprimento do talvegue deve ser maior que zero.');
  if (H_m <= 0) warnings.push('Desnível deve ser maior que zero.');

  const ratio = (L_km ** 3) / H_m;
  const Tc_min = 57 * ratio ** 0.385;

  return {
    input: { L_km, H_m },
    formula: 'Tc = 57 · (L³/H)^0,385',
    steps: [
      `L³/H = ${L_km}³ / ${H_m} = ${ratio.toFixed(6)}`,
      `Tc = 57 × ${ratio.toFixed(6)}^0,385`,
      `Tc = ${Tc_min.toFixed(2)} min`,
    ],
    result: { Tc_min },
    status: warnings.length ? 'revisar' : 'calculado',
    warnings,
  };
}
