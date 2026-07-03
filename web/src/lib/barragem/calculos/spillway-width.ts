import type { BarragemCalculoResult } from './types';

/** Largura de vertedouro soleira livre — manual §10.4: L = Q / (Cd·H^1,5) */
export function spillwayWidth(
  Q_m3s: number,
  Cd: number,
  H_m: number,
): BarragemCalculoResult<{ L_m: number }> {
  const warnings: string[] = [];
  if (Q_m3s <= 0) warnings.push('Vazão de projeto deve ser maior que zero.');
  if (Cd <= 0) warnings.push('Coeficiente Cd deve ser maior que zero.');
  if (H_m <= 0) warnings.push('Carga hidráulica H deve ser maior que zero.');

  const H15 = H_m ** 1.5;
  const denominador = Cd * H15;
  const L_m = Q_m3s / denominador;

  return {
    input: { Q_m3s, Cd, H_m },
    formula: 'L = Q / (Cd · H^(3/2))',
    steps: [
      `H^(3/2) = ${H_m}^1,5 = ${H15.toFixed(4)}`,
      `L = ${Q_m3s} / (${Cd} × ${H15.toFixed(4)})`,
      `L = ${L_m.toFixed(2)} m`,
    ],
    result: { L_m },
    status: warnings.length ? 'revisar' : 'calculado',
    warnings,
  };
}
