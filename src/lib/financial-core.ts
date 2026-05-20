/**
 * Cálculos e regras compartilhadas do módulo Financeiro.
 */

import type { Expense, Invoice, Revenue } from '@/lib/types';

export type DreRevenueRegime = 'faturas_pagas' | 'caixa' | 'combinado_sem_duplicar';

export function datePart(dateStr: string | undefined): string {
  if (dateStr == null || dateStr === '') return '';
  const s = String(dateStr).slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function inYearPeriod(part: string, year: number): boolean {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  return part >= start && part <= end;
}

/** Marca faturas Unpaid com vencimento passado como Overdue (uso client-side). */
export function computeOverdueInvoiceUpdates(
  invoices: Invoice[],
  today = new Date(),
): { id: string; status: 'Overdue' }[] {
  const todayStr = today.toISOString().slice(0, 10);
  return invoices
    .filter(
      (i) =>
        i.status === 'Unpaid' &&
        datePart(i.dueDate) !== '' &&
        datePart(i.dueDate) < todayStr,
    )
    .map((i) => ({ id: i.id, status: 'Overdue' as const }));
}

export type DreBreakdown = {
  receitaBruta: number;
  receitaFaturas: number;
  receitaCaixa: number;
  receitaCaixaVinculadaFatura: number;
  receitaCaixaAvulsa: number;
  deducoes: number;
  receitaLiquida: number;
  despesasOperacionais: number;
  depreciacaoDespesas: number;
  resultadoOperacional: number;
  outrasReceitasDespesas: number;
  resultadoLiquido: number;
  regime: DreRevenueRegime;
};

export function calculateDre(
  invoices: Invoice[],
  revenues: Revenue[],
  expenses: Expense[],
  year: number,
  regime: DreRevenueRegime = 'combinado_sem_duplicar',
): DreBreakdown {
  const inPeriod = (part: string) => inYearPeriod(part, year);

  const receitaFaturas = invoices
    .filter((i) => i.status === 'Paid' && inPeriod(datePart(i.invoiceDate)))
    .reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

  const revenuesInPeriod = revenues.filter((r) => inPeriod(datePart(r.date)));
  const receitaCaixaTotal = revenuesInPeriod.reduce(
    (acc, r) => acc + (Number(r.amount) || 0),
    0,
  );
  const receitaCaixaVinculadaFatura = revenuesInPeriod
    .filter((r) => r.invoiceId)
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const receitaCaixaAvulsa = receitaCaixaTotal - receitaCaixaVinculadaFatura;

  let receitaBruta = 0;
  switch (regime) {
    case 'faturas_pagas':
      receitaBruta = receitaFaturas;
      break;
    case 'caixa':
      receitaBruta = receitaCaixaTotal;
      break;
    case 'combinado_sem_duplicar':
    default:
      receitaBruta = receitaFaturas + receitaCaixaAvulsa;
      break;
  }

  const deducoes = 0;
  const receitaLiquida = receitaBruta - deducoes;

  const despesasInPeriod = expenses.filter((e) => inPeriod(datePart(e.date)));
  const depreciacaoDespesas = despesasInPeriod
    .filter((e) => e.category === 'depreciacao' || e.depreciacaoBemId)
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const despesasOperacionais = despesasInPeriod.reduce(
    (acc, e) => acc + (Number(e.amount) || 0),
    0,
  );

  const resultadoOperacional = receitaLiquida - despesasOperacionais;
  const outrasReceitasDespesas = 0;
  const resultadoLiquido = resultadoOperacional + outrasReceitasDespesas;

  return {
    receitaBruta,
    receitaFaturas,
    receitaCaixa: receitaCaixaTotal,
    receitaCaixaVinculadaFatura,
    receitaCaixaAvulsa,
    deducoes,
    receitaLiquida,
    despesasOperacionais,
    depreciacaoDespesas,
    resultadoOperacional,
    outrasReceitasDespesas,
    resultadoLiquido,
    regime,
  };
}

export const EXPENSE_CATEGORIES = [
  { value: 'operacional', label: 'Operacional' },
  { value: 'pessoal', label: 'Pessoal / folha' },
  { value: 'subcontratacao', label: 'Subcontratação ambiental' },
  { value: 'impostos', label: 'Impostos e taxas' },
  { value: 'depreciacao', label: 'Depreciação' },
  { value: 'aquisicao_bem', label: 'Aquisição de bem' },
  { value: 'financeiro', label: 'Financeiro / juros' },
  { value: 'outros', label: 'Outros' },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value'];

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(value) ? value : 0,
  );
}

/** Depreciação linear mensal (R$). */
export function monthlyDepreciationAmount(bem: {
  metodoDepreciacao: string;
  valorAquisicao: number;
  valorResidual?: number;
  vidaUtilMeses?: number;
  depreciacaoAcumulada?: number;
}): number {
  if (bem.metodoDepreciacao === 'nao_depreciavel') return 0;
  const meses = bem.vidaUtilMeses ?? 0;
  if (meses <= 0) return 0;
  const base = Math.max(0, (bem.valorAquisicao || 0) - (bem.valorResidual || 0));
  const acumulada = bem.depreciacaoAcumulada ?? 0;
  const restante = Math.max(0, base - acumulada);
  const mensal = base / meses;
  return Math.min(mensal, restante);
}

export function formatCronogramaText(
  items: { etapa?: string; dataInicio?: string | Date; dataFim?: string | Date }[],
): string {
  if (!items?.length) return '—';
  return items
    .map((c, i) => {
      const ini =
        c.dataInicio instanceof Date
          ? c.dataInicio.toLocaleDateString('pt-BR')
          : c.dataInicio
            ? new Date(c.dataInicio).toLocaleDateString('pt-BR')
            : '—';
      const fim =
        c.dataFim instanceof Date
          ? c.dataFim.toLocaleDateString('pt-BR')
          : c.dataFim
            ? new Date(c.dataFim).toLocaleDateString('pt-BR')
            : '—';
      return `${i + 1}. ${c.etapa || 'Etapa'} — ${ini} a ${fim}`;
    })
    .join('\n');
}
