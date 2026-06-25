import type { BarragemCalculoResult } from './types';

export const GRAVITY_DAM_FS_MIN = {
  deslizamento: 1.5,
  tombamento: 1.5,
} as const;

export type GravityDamStabilityInput = {
  /** Altura da coluna d'água à montante (m). */
  alturaAguaM: number;
  /** Peso próprio por metro de extensão (kN/m). */
  pesoKN: number;
  /** Subpressão na base U (kN/m). */
  subpressaoKN?: number;
  /** Área da base por metro (m²/m → m). */
  areaBaseM2: number;
  coesaoKpa: number;
  anguloAtritoGrau: number;
  /** Braço do peso em relação ao marco de tombamento (m). */
  bracoPesoM: number;
  gammaAguaKNm3?: number;
};

export type GravityDamStabilityResult = {
  Fh_kN: number;
  bracoEmpuxoM: number;
  W_efetivoKN: number;
  resistenciaDeslizamentoKN: number;
  fsDeslizamento: number;
  fsTombamento: number;
  /** Momento resultante sobre o centro da base (kN·m/m). */
  momentoCentroKNm: number;
  /** Módulo de resistência S = B²/6 para base retangular (m³/m). */
  moduloResistenciaM3: number;
  tensaoMediaKpa: number;
  tensaoMaxKpa: number;
  tensaoMinKpa: number;
};

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Empuxo horizontal por metro: Fh = γ_w h² / 2 (manual §9.2). */
export function gravityDamHorizontalForce(
  alturaAguaM: number,
  gammaAguaKNm3 = 9.81,
): { Fh_kN: number; bracoEmpuxoM: number } {
  const h = Math.max(0, alturaAguaM);
  const Fh = (gammaAguaKNm3 * h * h) / 2;
  return { Fh_kN: Fh, bracoEmpuxoM: h / 3 };
}

/** Peso próprio W = γ_c · A (manual §9.3). */
export function gravityDamWeightFromSection(
  pesoEspecificoConcretoKNm3: number,
  areaSecaoM2: number,
): number {
  return pesoEspecificoConcretoKNm3 * areaSecaoM2;
}

/** Módulo S = B²/6 para seção retangular unitária (manual §9.6). */
export function gravityDamSectionModulusRectangular(larguraBaseM: number): number {
  const B = Math.max(0, larguraBaseM);
  return (B * B) / 6;
}

/** Tensões na base σ = W′/A_b ± M/S (manual §9.6). */
export function gravityDamBaseStresses(
  W_efetivoKN: number,
  larguraBaseM: number,
  momentoCentroKNm: number,
): { tensaoMediaKpa: number; tensaoMaxKpa: number; tensaoMinKpa: number; moduloResistenciaM3: number } {
  const B = larguraBaseM;
  const S = gravityDamSectionModulusRectangular(B);
  const sigmaMedia = B > 0 ? W_efetivoKN / B : 0;
  const flex = S > 0 ? momentoCentroKNm / S : 0;
  return {
    moduloResistenciaM3: S,
    tensaoMediaKpa: sigmaMedia,
    tensaoMaxKpa: sigmaMedia + flex,
    tensaoMinKpa: sigmaMedia - flex,
  };
}

/** FS deslizamento, tombamento e tensões na base — manual §9.4–9.6. */
export function gravityDamStability(
  input: GravityDamStabilityInput,
): BarragemCalculoResult<GravityDamStabilityResult> {
  const warnings: string[] = [];
  const gammaW = input.gammaAguaKNm3 ?? 9.81;
  const { Fh_kN, bracoEmpuxoM } = gravityDamHorizontalForce(input.alturaAguaM, gammaW);
  const U = input.subpressaoKN ?? 0;
  const W = input.pesoKN;
  const Wp = W - U;
  const Ab = input.areaBaseM2;
  const phi = degToRad(input.anguloAtritoGrau);
  const c = input.coesaoKpa;

  const steps: string[] = [
    `h = ${input.alturaAguaM} m; γ_w = ${gammaW} kN/m³`,
    `Fh = γ_w h²/2 = ${Fh_kN.toFixed(3)} kN/m`,
    `W = ${W.toFixed(3)} kN/m; U = ${U.toFixed(3)} kN/m; W′ = W − U = ${Wp.toFixed(3)} kN/m`,
    `A_b = ${Ab} m²/m; c′ = ${c} kPa; φ′ = ${input.anguloAtritoGrau}°`,
  ];

  if (W <= 0) warnings.push('Peso próprio nulo ou negativo.');
  if (Ab <= 0) warnings.push('Área da base deve ser positiva.');
  if (Fh_kN <= 0) warnings.push('Empuxo hidráulico nulo — verifique altura d\'água.');
  if (input.bracoPesoM <= 0) warnings.push('Braço do peso deve ser positivo.');

  const resistenciaDeslizamentoKN = Wp * Math.tan(phi) + c * Ab;
  const fsDeslizamento = Fh_kN > 0 ? resistenciaDeslizamentoKN / Fh_kN : 0;
  const MR = W * input.bracoPesoM;
  const MT = Fh_kN * bracoEmpuxoM;
  const fsTombamento = MT > 0 ? MR / MT : 0;

  const B = Ab;
  const momentoCentroKNm = W * (input.bracoPesoM - B / 2) - Fh_kN * bracoEmpuxoM;
  const tensoes = gravityDamBaseStresses(Wp, B, momentoCentroKNm);

  steps.push(
    `FS_d = (W′ tan φ + c A_b) / Fh = ${fsDeslizamento.toFixed(3)}`,
    `FS_t = (W · b_W) / (Fh · h/3) = ${fsTombamento.toFixed(3)}`,
    `M_c = W(b_W − B/2) − Fh·(h/3) = ${momentoCentroKNm.toFixed(3)} kN·m/m`,
    `S = B²/6 = ${tensoes.moduloResistenciaM3.toFixed(3)} m³/m`,
    `σ_média = W′/B = ${tensoes.tensaoMediaKpa.toFixed(1)} kPa`,
    `σ_máx = ${tensoes.tensaoMaxKpa.toFixed(1)} kPa; σ_mín = ${tensoes.tensaoMinKpa.toFixed(1)} kPa`,
  );

  if (tensoes.tensaoMinKpa < 0) {
    warnings.push('Tensão de tração na base (σ_mín < 0) — revisar geometria ou fundação.');
  }

  let status: BarragemCalculoResult<GravityDamStabilityResult>['status'] = 'ok';
  if (
    fsDeslizamento < GRAVITY_DAM_FS_MIN.deslizamento ||
    fsTombamento < GRAVITY_DAM_FS_MIN.tombamento ||
    tensoes.tensaoMinKpa < 0
  ) {
    status = 'nao_atende';
  } else if (warnings.length) {
    status = 'revisar';
  }

  return {
    input: { ...input, gammaAguaKNm3: gammaW },
    formula:
      'FS_d = (W′ tan φ + c A_b) / Fh; FS_t = ΣM_R/ΣM_T; σ = W′/A_b ± M/S; Fh = γ_w h²/2',
    steps,
    result: {
      Fh_kN,
      bracoEmpuxoM,
      W_efetivoKN: Wp,
      resistenciaDeslizamentoKN,
      fsDeslizamento,
      fsTombamento,
      momentoCentroKNm,
      ...tensoes,
    },
    status,
    warnings,
  };
}

export function formatGravityDamMemorial(
  calc: ReturnType<typeof gravityDamStability>,
): string {
  const r = calc.result;
  const lines = [
    '— Barragem de concreto gravidade (triagem §9.4–9.6) —',
    calc.formula,
    ...calc.steps,
    `FS deslizamento = ${r.fsDeslizamento.toFixed(3)} (mín. preliminar ${GRAVITY_DAM_FS_MIN.deslizamento})`,
    `FS tombamento = ${r.fsTombamento.toFixed(3)} (mín. preliminar ${GRAVITY_DAM_FS_MIN.tombamento})`,
    `σ_máx = ${r.tensaoMaxKpa.toFixed(1)} kPa; σ_mín = ${r.tensaoMinKpa.toFixed(1)} kPa`,
  ];
  if (calc.warnings.length) {
    lines.push(`Avisos: ${calc.warnings.join('; ')}`);
  }
  lines.push(
    'Resultado preliminar — não substitui análise estrutural completa (combinações de cargas, sismo, subpressão detalhada).',
  );
  return lines.join('\n');
}
