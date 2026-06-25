import type { BarragemCalculoResult } from './types';

/** Formata resultado de cálculo como texto de memorial (manual §17). */
export function formatCalculoMemorial(
  titulo: string,
  calc: BarragemCalculoResult<Record<string, number>>,
): string {
  const lines = [
    `### ${titulo}`,
    '',
    '**Fórmula:**',
    calc.formula,
    '',
    '**Substituição:**',
    ...calc.steps.map((s) => `- ${s}`),
    '',
    '**Resultado:**',
    ...Object.entries(calc.result).map(([k, v]) => `- ${k}: ${formatNum(v)}`),
  ];
  if (calc.warnings.length) {
    lines.push('', '**Avisos:**', ...calc.warnings.map((w) => `- ${w}`));
  }
  return lines.join('\n');
}

function formatNum(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : '—';
}

/** Converte string de formulário (pt-BR ou en) em número. */
export function parseNumeroFormulario(value: string | undefined | null): number | null {
  if (value == null || String(value).trim() === '') return null;
  const normalized = String(value).trim().replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
