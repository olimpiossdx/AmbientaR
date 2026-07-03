import type { BarragemCalculoResult } from './types';
import {
  BISHOP_CENARIOS,
  type BishopCenario,
  type BishopFatiaInput,
} from './bishop-simplified';

export type MorgensternPriceResult = {
  FS: number;
  lambda: number;
};

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Função de meia-seno f(x) nos pontos médios das fatias (manual §8.4 — Morgenstern-Price). */
export function morgensternPriceHalfSineFactors(n: number): number[] {
  if (n <= 0) return [];
  return Array.from({ length: n }, (_, i) => Math.sin((Math.PI * (i + 0.5)) / n));
}

/**
 * Recorrência Fredlund–Krahn (vertical slices) — retorna E_n (deve tender a 0).
 * X_i = λ f_i E_i na face esquerda da fatia i; E_0 = E_n = 0.
 */
function endIntersliceForce(
  fatias: BishopFatiaInput[],
  coesaoKpa: number,
  phiRad: number,
  FS: number,
  lambda: number,
  f: number[],
): number {
  const n = fatias.length;
  let E = 0;

  for (let i = 0; i < n; i++) {
    const slice = fatias[i];
    const alpha = degToRad(slice.anguloBaseGrau);
    const b = slice.larguraM;
    const W = slice.pesoKN;
    const U = slice.ubKN ?? 0;
    const sinA = Math.sin(alpha);
    const cosA = Math.cos(alpha);
    const tanA = Math.tan(alpha);
    const tanPhi = Math.tan(phiRad);

    const mAlpha = cosA + (sinA * tanPhi) / FS;
    if (Math.abs(mAlpha) < 1e-6) return Number.NaN;

    const Xi = lambda * f[i] * E;
    const numeradorN =
      W + Xi - (coesaoKpa * b * sinA + U * sinA * tanPhi) / FS;
    const N = numeradorN / mAlpha;

    const T = (coesaoKpa * b + (N - U) * tanPhi) / FS;
    const deltaE = N * sinA - T * cosA;
    E += deltaE;
  }

  return E;
}

function solveLambda(
  fatias: BishopFatiaInput[],
  coesaoKpa: number,
  phiRad: number,
  FS: number,
  f: number[],
): number {
  let lo = -1.5;
  let hi = 1.5;
  let flo = endIntersliceForce(fatias, coesaoKpa, phiRad, FS, lo, f);
  let fhi = endIntersliceForce(fatias, coesaoKpa, phiRad, FS, hi, f);

  if (!Number.isFinite(flo) || !Number.isFinite(fhi)) return 0;

  if (flo * fhi > 0) {
    let bestL = 0;
    let bestAbs = Math.abs(flo);
    for (const trial of [-1, -0.5, 0, 0.5, 1]) {
      const r = endIntersliceForce(fatias, coesaoKpa, phiRad, FS, trial, f);
      if (Number.isFinite(r) && Math.abs(r) < bestAbs) {
        bestAbs = Math.abs(r);
        bestL = trial;
      }
    }
    return bestL;
  }

  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    const fm = endIntersliceForce(fatias, coesaoKpa, phiRad, FS, mid, f);
    if (!Number.isFinite(fm)) return mid;
    if (Math.abs(fm) < 1e-4) return mid;
    if (flo * fm <= 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

function computeFsFromSlices(
  fatias: BishopFatiaInput[],
  coesaoKpa: number,
  phiRad: number,
  FS: number,
  lambda: number,
  f: number[],
): number {
  let somaResist = 0;
  let somaMobil = 0;
  const tanPhi = Math.tan(phiRad);

  let E = 0;
  for (let i = 0; i < fatias.length; i++) {
    const slice = fatias[i];
    const alpha = degToRad(slice.anguloBaseGrau);
    const b = slice.larguraM;
    const W = slice.pesoKN;
    const U = slice.ubKN ?? 0;
    const sinA = Math.sin(alpha);
    const cosA = Math.cos(alpha);

    const mAlpha = cosA + (sinA * tanPhi) / FS;
    if (Math.abs(mAlpha) < 1e-6) continue;

    const Xi = lambda * f[i] * E;
    const N =
      (W + Xi - (coesaoKpa * b * sinA + U * sinA * tanPhi) / FS) / mAlpha;
    const T = (coesaoKpa * b + (N - U) * tanPhi) / FS;

    somaResist += coesaoKpa * b + (N - U) * tanPhi;
    somaMobil += T;
    E += N * sinA - T * cosA;
  }

  if (somaMobil <= 0) return FS;
  return somaResist / somaMobil;
}

/** Morgenstern-Price com função de meia-seno — iteração em FS e λ (manual §8.4). */
export function morgensternPriceHalfSine(
  fatias: BishopFatiaInput[],
  coesaoKpa: number,
  anguloAtritoGrau: number,
  cenario: BishopCenario = 'operacao_normal',
): BarragemCalculoResult<MorgensternPriceResult> {
  const warnings: string[] = [];
  const phi = degToRad(anguloAtritoGrau);
  const f = morgensternPriceHalfSineFactors(fatias.length);

  if (!fatias.length) {
    return {
      input: { fatias: 0, coesaoKpa, anguloAtritoGrau },
      formula: 'Morgenstern-Price — f(x)=sin(πx/L); equilíbrio de forças e λ por E_n→0',
      steps: ['Nenhuma fatia informada.'],
      result: { FS: 0, lambda: 0 },
      status: 'revisar',
      warnings: ['Informe ao menos uma fatia vertical.'],
    };
  }

  if (coesaoKpa < 0) warnings.push('Coesão negativa — verifique unidades (kPa).');
  if (anguloAtritoGrau < 0 || anguloAtritoGrau > 45) {
    warnings.push('Ângulo de atrito fora do intervalo usual (0–45°).');
  }

  let FS = 1.5;
  let lambda = 0;
  const steps: string[] = [
    `${fatias.length} fatia(s); f(x)=meia-seno; c′ = ${coesaoKpa} kPa; φ′ = ${anguloAtritoGrau}°`,
  ];

  for (let iter = 0; iter < 50; iter++) {
    lambda = solveLambda(fatias, coesaoKpa, phi, FS, f);
    const En = endIntersliceForce(fatias, coesaoKpa, phi, FS, lambda, f);
    const FSnovo = computeFsFromSlices(fatias, coesaoKpa, phi, FS, lambda, f);

    steps.push(
      `Iteração ${iter + 1}: FS = ${FSnovo.toFixed(4)}, λ = ${lambda.toFixed(4)}, E_n = ${Number.isFinite(En) ? En.toFixed(4) : '—'}`,
    );

    if (!Number.isFinite(FSnovo) || FSnovo <= 0) {
      return {
        input: { fatias: fatias.length, coesaoKpa, anguloAtritoGrau },
        formula: 'Morgenstern-Price — f(x)=sin(πx/L)',
        steps,
        result: { FS: 0, lambda },
        status: 'revisar',
        warnings: [...warnings, 'FS não convergiu — revise geometria e parâmetros.'],
      };
    }

    if (Math.abs(FSnovo - FS) < 0.0005 && Math.abs(En) < 0.05) {
      FS = FSnovo;
      break;
    }
    FS = FSnovo;
  }

  const criterio = BISHOP_CENARIOS.find((c) => c.value === cenario) ?? BISHOP_CENARIOS[0];
  let status: BarragemCalculoResult<MorgensternPriceResult>['status'] = 'calculado';
  if (FS < criterio.fsMin) {
    status = 'nao_atende';
    warnings.push(
      `FS = ${FS.toFixed(2)} abaixo do mínimo preliminar (${criterio.fsMin}) para ${criterio.label}.`,
    );
  } else if (Number.isFinite(FS) && FS >= criterio.fsMin) {
    status = 'atende';
  }
  if (warnings.length && status === 'calculado') status = 'revisar';

  steps.push(`FS convergido: ${FS.toFixed(4)}; λ = ${lambda.toFixed(4)}`);
  steps.push(`Critério ${criterio.label}: FS ≥ ${criterio.fsMin}`);

  return {
    input: { fatias: fatias.length, coesaoKpa, anguloAtritoGrau },
    formula:
      'Morgenstern-Price: X_i = λ f_i E_i; f_i = sin(π(i+½)/n); equilíbrio de forças com λ ajustado por E_n→0',
    steps,
    result: { FS, lambda },
    criteria: { cenario: criterio.label, fsMin: criterio.fsMin },
    status,
    warnings,
  };
}

export function formatMorgensternPriceMemorial(
  calc: ReturnType<typeof morgensternPriceHalfSine>,
  fatias: BishopFatiaInput[],
): string {
  const lines = [
    '### Estabilidade de taludes — Morgenstern-Price (meia-seno, triagem)',
    '',
    '**Fórmula / método:**',
    calc.formula,
    '',
    '**Fatias:**',
    ...fatias.map(
      (f, i) =>
        `- ${f.label ?? `Fatia ${i + 1}`}: b = ${f.larguraM} m; W = ${f.pesoKN} kN/m; α = ${f.anguloBaseGrau}°` +
        (f.ubKN ? `; u·b = ${f.ubKN} kN/m` : ''),
    ),
    '',
    '**Iteração:**',
    ...calc.steps.slice(0, 8).map((s) => `- ${s}`),
    calc.steps.length > 8 ? `- … (${calc.steps.length - 8} passos omitidos)` : '',
    '',
    `**Fator de segurança FS:** ${calc.result.FS.toFixed(3)}`,
    `**λ (escala interfatias):** ${calc.result.lambda.toFixed(4)}`,
    `**Critério:** ${(calc.criteria as { cenario?: string; fsMin?: number })?.cenario ?? '—'} (FS mín. ${(calc.criteria as { fsMin?: number })?.fsMin ?? '—'})`,
    '',
    '(Triagem preliminar — superfícies não circulares e modelos 2D/3D podem divergir; validar com software geotécnico.)',
  ];
  if (calc.warnings.length) {
    lines.push('', '**Avisos:**', ...calc.warnings.map((w) => `- ${w}`));
  }
  return lines.filter(Boolean).join('\n');
}
