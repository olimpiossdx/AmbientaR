import type { BarragemCalculoResult } from './types';

/** Uma linha da tabela Rippl (manual §5.5). */
export type RipplPeriodoInput = {
  label?: string;
  /** Vazão afluente média no período (m³/s). Ignorada se `vAfluente_m3` informado. */
  qAfluente_m3s?: number;
  /** Volume afluente no período (m³). */
  vAfluente_m3?: number;
  /** Vazão de demanda média (m³/s). Ignorada se `vDemanda_m3` informado. */
  qDemanda_m3s?: number;
  /** Volume de demanda no período (m³). */
  vDemanda_m3?: number;
  /** Evaporação no período (m³). */
  evap_m3?: number;
  /** Dias do período (conversão Q→V). Padrão 30. */
  diasNoPeriodo?: number;
};

export type RipplLinhaCalculada = {
  label: string;
  vAfluente_m3: number;
  vDemanda_m3: number;
  evap_m3: number;
  saldo_m3: number;
  deficitPeriodo_m3: number;
  deficitAcumulado_m3: number;
};

export type RipplAnaliseResult = {
  linhas: RipplLinhaCalculada[];
  volumeUtilNecessario_m3: number;
};

const SEGUNDOS_POR_DIA = 86_400;

function volumeFromQ(q_m3s: number, dias: number): number {
  return q_m3s * SEGUNDOS_POR_DIA * dias;
}

/** Converte entrada em volumes por período. */
export function prepararRipplPeriodos(periodos: RipplPeriodoInput[]): RipplLinhaCalculada[] {
  const linhas: RipplLinhaCalculada[] = [];
  let deficitAcumulado = 0;

  periodos.forEach((p, index) => {
    const dias = p.diasNoPeriodo != null && p.diasNoPeriodo > 0 ? p.diasNoPeriodo : 30;
    const vAfluente =
      p.vAfluente_m3 != null && Number.isFinite(p.vAfluente_m3)
        ? p.vAfluente_m3
        : p.qAfluente_m3s != null && Number.isFinite(p.qAfluente_m3s)
          ? volumeFromQ(p.qAfluente_m3s, dias)
          : 0;
    const vDemanda =
      p.vDemanda_m3 != null && Number.isFinite(p.vDemanda_m3)
        ? p.vDemanda_m3
        : p.qDemanda_m3s != null && Number.isFinite(p.qDemanda_m3s)
          ? volumeFromQ(p.qDemanda_m3s, dias)
          : 0;
    const evap = p.evap_m3 != null && Number.isFinite(p.evap_m3) ? Math.max(0, p.evap_m3) : 0;

    const saldo = vAfluente - vDemanda - evap;
    const deficitPeriodo = saldo < 0 ? -saldo : 0;

    if (saldo >= 0) {
      deficitAcumulado = Math.max(0, deficitAcumulado - saldo);
    } else {
      deficitAcumulado += -saldo;
    }

    linhas.push({
      label: p.label?.trim() || `P${index + 1}`,
      vAfluente_m3: vAfluente,
      vDemanda_m3: vDemanda,
      evap_m3: evap,
      saldo_m3: saldo,
      deficitPeriodo_m3: deficitPeriodo,
      deficitAcumulado_m3: deficitAcumulado,
    });
  });

  return linhas;
}

/** Análise Rippl — maior déficit acumulado = volume útil necessário (manual §5.5). */
export function ripplAnalise(periodos: RipplPeriodoInput[]): BarragemCalculoResult<{
  volumeUtilNecessario_m3: number;
}> & { tabela: RipplLinhaCalculada[] } {
  const warnings: string[] = [];

  if (!periodos.length) {
    return {
      input: { periodos: 0 },
      formula: 'Saldo_i = V_afl,i − V_dem,i − E_i; volume útil = max(déficit acumulado)',
      steps: ['Nenhum período informado.'],
      result: { volumeUtilNecessario_m3: 0 },
      status: 'revisar',
      warnings: ['Informe ao menos um período na série.'],
      tabela: [],
    };
  }

  const linhas = prepararRipplPeriodos(periodos);
  const volumeUtilNecessario_m3 = linhas.length
    ? Math.max(...linhas.map((l) => l.deficitAcumulado_m3))
    : 0;

  const totalAfl = linhas.reduce((s, l) => s + l.vAfluente_m3, 0);
  const totalDem = linhas.reduce((s, l) => s + l.vDemanda_m3, 0);
  if (totalAfl <= 0) warnings.push('Volume afluente total nulo — verifique as vazões.');
  if (totalDem <= 0) warnings.push('Demanda total nula — verifique as vazões de demanda.');
  if (volumeUtilNecessario_m3 > totalAfl && totalAfl > 0) {
    warnings.push('Volume útil necessário supera a afluência total anual — revisar série.');
  }

  const steps = [
    `${periodos.length} período(s) analisado(s).`,
    `Afluência total: ${totalAfl.toFixed(2)} m³`,
    `Demanda total: ${totalDem.toFixed(2)} m³`,
    `Maior déficit acumulado: ${volumeUtilNecessario_m3.toFixed(2)} m³`,
  ];

  return {
    input: { periodos: periodos.length },
    formula: 'Saldo_i = V_afl,i − V_dem,i − E_i; volume útil = max(déficit acumulado em períodos secos)',
    steps,
    result: { volumeUtilNecessario_m3 },
    status: warnings.length ? 'revisar' : 'calculado',
    warnings,
    tabela: linhas,
  };
}

/** Série mensal vazia (12 meses) para formulários. */
export const RIPPL_MESES_PADRAO = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

export function criarSerieRipplMensalVazia(): RipplPeriodoInput[] {
  return RIPPL_MESES_PADRAO.map((label) => ({
    label,
    qAfluente_m3s: undefined,
    qDemanda_m3s: undefined,
    diasNoPeriodo: 30,
    evap_m3: 0,
  }));
}

/** Formata tabela Rippl como texto (memorial / textarea). */
export function formatRipplMemorial(
  calc: ReturnType<typeof ripplAnalise>,
): string {
  const lines = [
    '### Método de Rippl (regularização)',
    '',
    '**Fórmula:**',
    calc.formula,
    '',
    '**Resumo:**',
    ...calc.steps.map((s) => `- ${s}`),
    '',
    `**Volume útil necessário:** ${calc.result.volumeUtilNecessario_m3.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m³`,
    '',
    '| Mês | V afluente (m³) | V demanda (m³) | Evap. (m³) | Saldo (m³) | Déficit acum. (m³) |',
    '|-----|----------------:|---------------:|-----------:|-----------:|-------------------:|',
    ...calc.tabela.map(
      (l) =>
        `| ${l.label} | ${l.vAfluente_m3.toFixed(0)} | ${l.vDemanda_m3.toFixed(0)} | ${l.evap_m3.toFixed(0)} | ${l.saldo_m3.toFixed(0)} | ${l.deficitAcumulado_m3.toFixed(0)} |`,
    ),
  ];
  if (calc.warnings.length) {
    lines.push('', '**Avisos:**', ...calc.warnings.map((w) => `- ${w}`));
  }
  return lines.join('\n');
}
