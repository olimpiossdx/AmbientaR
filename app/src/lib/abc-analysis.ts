export type AbcClass = 'A' | 'B' | 'C';

export type AbcRow = {
  id: string;
  label: string;
  valor: number;
  pct: number;
  acc: number;
  classe: AbcClass;
};

export type AbcClassSummary = {
  count: number;
  valor: number;
};

export function classifyAbc(cumulativePct: number, cutoffA = 80, cutoffB = 95): AbcClass {
  if (cumulativePct <= cutoffA) return 'A';
  if (cumulativePct <= cutoffB) return 'B';
  return 'C';
}

export function getAbcBadgeClass(classe: AbcClass): string {
  switch (classe) {
    case 'A':
      return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
    case 'B':
      return 'bg-amber-500/20 text-amber-800 border-amber-500/30';
    case 'C':
      return 'bg-slate-500/15 text-slate-700 border-slate-500/25';
    default:
      return 'bg-slate-500/15 text-slate-700 border-slate-500/25';
  }
}

export function getAbcBarColor(classe: AbcClass): string {
  switch (classe) {
    case 'A':
      return 'hsl(142 76% 36%)';
    case 'B':
      return 'hsl(38 92% 50%)';
    case 'C':
      return 'hsl(215 16% 47%)';
    default:
      return 'hsl(var(--muted-foreground))';
  }
}

export function truncateAbcLabel(label: string, max = 42): string {
  const t = label.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function computeAbcRanking(
  entries: { id: string; label: string; valor: number }[],
  cutoffs?: { a?: number; b?: number }
): AbcRow[] {
  const cutoffA = cutoffs?.a ?? 80;
  const cutoffB = cutoffs?.b ?? 95;
  const rows = [...entries].sort((a, b) => b.valor - a.valor);
  const total = rows.reduce((sum, r) => sum + r.valor, 0) || 1;
  let acc = 0;
  return rows.map((r) => {
    const pct = (r.valor / total) * 100;
    acc += pct;
    return {
      id: r.id,
      label: r.label,
      valor: r.valor,
      pct,
      acc,
      classe: classifyAbc(acc, cutoffA, cutoffB),
    };
  });
}

export function summarizeAbcByClass(rows: AbcRow[]): Record<AbcClass, AbcClassSummary> {
  const summary: Record<AbcClass, AbcClassSummary> = {
    A: { count: 0, valor: 0 },
    B: { count: 0, valor: 0 },
    C: { count: 0, valor: 0 },
  };
  rows.forEach((r) => {
    summary[r.classe].count += 1;
    summary[r.classe].valor += r.valor;
  });
  return summary;
}
