import type { BarragemCalculoResult } from './types';

export type BishopCenario =
  | 'operacao_normal'
  | 'final_construcao'
  | 'rebaixamento_rapido'
  | 'sismo';

export const BISHOP_CENARIOS: readonly {
  value: BishopCenario;
  label: string;
  fsMin: number;
  fsMax?: number;
}[] = [
  { value: 'operacao_normal', label: 'Operação normal', fsMin: 1.5 },
  { value: 'final_construcao', label: 'Final de construção', fsMin: 1.3, fsMax: 1.5 },
  { value: 'rebaixamento_rapido', label: 'Rebaixamento rápido', fsMin: 1.2, fsMax: 1.3 },
  { value: 'sismo', label: 'Sismo', fsMin: 1.1, fsMax: 1.2 },
] as const;

export type BishopFatiaInput = {
  label?: string;
  /** Largura da fatia na base (m). */
  larguraM: number;
  /** Peso da fatia (kN) por metro de extensão. */
  pesoKN: number;
  /** Ângulo da base da fatia (graus, positivo no sentido do deslizamento). */
  anguloBaseGrau: number;
  /** Força de poro-pressão na base u·b (kN/m). */
  ubKN?: number;
};

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Bishop simplificado (método das fatias) — iteração em F (manual §8.4). */
export function bishopSimplified(
  fatias: BishopFatiaInput[],
  coesaoKpa: number,
  anguloAtritoGrau: number,
  cenario: BishopCenario = 'operacao_normal',
): BarragemCalculoResult<{ FS: number }> {
  const warnings: string[] = [];
  const phi = degToRad(anguloAtritoGrau);
  const tanPhi = Math.tan(phi);

  if (!fatias.length) {
    return {
      input: { fatias: 0, coesaoKpa, anguloAtritoGrau },
      formula: 'Σ[c′b + (W − u b) tan φ′] / mα = Σ W sin α; mα = cos α + (sin α tan φ′) / FS',
      steps: ['Nenhuma fatia informada.'],
      result: { FS: 0 },
      status: 'revisar',
      warnings: ['Informe ao menos uma fatia vertical.'],
    };
  }

  if (coesaoKpa < 0) warnings.push('Coesão negativa — verifique unidades (kPa).');
  if (anguloAtritoGrau < 0 || anguloAtritoGrau > 45) {
    warnings.push('Ângulo de atrito fora do intervalo usual (0–45°).');
  }

  let FS = 1.5;
  const maxIter = 60;
  const steps: string[] = [
    `${fatias.length} fatia(s); c′ = ${coesaoKpa} kPa; φ′ = ${anguloAtritoGrau}°`,
  ];

  for (let iter = 0; iter < maxIter; iter++) {
    let somaResist = 0;
    let somaMobil = 0;

    for (const f of fatias) {
      const alpha = degToRad(f.anguloBaseGrau);
      const W = f.pesoKN;
      const b = f.larguraM;
      const ub = f.ubKN ?? 0;

      if (b <= 0 || W <= 0) {
        warnings.push(`Fatia "${f.label ?? '?'}" com largura ou peso inválido.`);
        continue;
      }

      let mAlpha = Math.cos(alpha) + (Math.sin(alpha) * tanPhi) / FS;
      if (mAlpha < 0.05) mAlpha = 0.05;

      somaResist += coesaoKpa * b + (W - ub) * tanPhi;
      somaMobil += (W * Math.sin(alpha)) / mAlpha;
    }

    if (somaMobil <= 0) {
      return {
        input: { fatias: fatias.length, coesaoKpa, anguloAtritoGrau },
        formula: 'Bishop simplificado — método das fatias',
        steps: [...steps, 'Soma mobilizadora nula ou negativa — revisar ângulos e pesos.'],
        result: { FS: 0 },
        status: 'revisar',
        warnings,
      };
    }

    const FSnovo = somaResist / somaMobil;
    steps.push(`Iteração ${iter + 1}: FS = ${FSnovo.toFixed(4)}`);
    if (Math.abs(FSnovo - FS) < 0.0005) {
      FS = FSnovo;
      break;
    }
    FS = FSnovo;
  }

  const criterio = BISHOP_CENARIOS.find((c) => c.value === cenario) ?? BISHOP_CENARIOS[0];
  let status: BarragemCalculoResult<{ FS: number }>['status'] = 'calculado';
  if (FS < criterio.fsMin) {
    status = 'nao_atende';
    warnings.push(
      `FS = ${FS.toFixed(2)} abaixo do mínimo preliminar (${criterio.fsMin}) para ${criterio.label}.`,
    );
  } else if (criterio.fsMax != null && FS > criterio.fsMax + 0.5) {
    status = 'atende';
  } else if (FS >= criterio.fsMin) {
    status = 'atende';
  }

  if (warnings.length && status === 'calculado') status = 'revisar';

  steps.push(`FS convergido: ${FS.toFixed(4)}`);
  steps.push(`Critério ${criterio.label}: FS ≥ ${criterio.fsMin}`);

  return {
    input: { fatias: fatias.length, coesaoKpa, anguloAtritoGrau },
    formula: 'Σ[c′b + (W − u b) tan φ′] / mα = Σ W sin α; mα = cos α + (sin α tan φ′) / FS',
    steps,
    result: { FS },
    criteria: { cenario: criterio.label, fsMin: criterio.fsMin },
    status,
    warnings,
  };
}

/** Formata resultado Bishop para memorial. */
export function formatBishopMemorial(
  calc: ReturnType<typeof bishopSimplified>,
  fatias: BishopFatiaInput[],
): string {
  const lines = [
    '### Estabilidade de taludes — Bishop simplificado (triagem)',
    '',
    '**Fórmula:**',
    calc.formula,
    '',
    '**Fatias:**',
    ...fatias.map(
      (f, i) =>
        `- ${f.label ?? `Fatia ${i + 1}`}: b = ${f.larguraM} m; W = ${f.pesoKN} kN/m; α = ${f.anguloBaseGrau}°` +
        (f.ubKN ? `; u·b = ${f.ubKN} kN/m` : ''),
    ),
    '',
    '**Substituição / iteração:**',
    ...calc.steps.slice(0, 8).map((s) => `- ${s}`),
    calc.steps.length > 8 ? `- … (${calc.steps.length - 8} iterações omitidas)` : '',
    '',
    `**Fator de segurança FS:** ${calc.result.FS.toFixed(3)}`,
    `**Critério:** ${(calc.criteria as { cenario?: string; fsMin?: number })?.cenario ?? '—'} (FS mín. ${(calc.criteria as { fsMin?: number })?.fsMin ?? '—'})`,
    '',
    '(Triagem preliminar — estudo geotécnico formal exige investigação de campo, parâmetros representativos e superfície de ruptura adequada.)',
  ];
  if (calc.warnings.length) {
    lines.push('', '**Avisos:**', ...calc.warnings.map((w) => `- ${w}`));
  }
  return lines.filter(Boolean).join('\n');
}
