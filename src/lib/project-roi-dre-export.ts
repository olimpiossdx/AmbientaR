import { formatCurrencyBRL } from '@/lib/financial-core';
import type { ProjectRoiCase, ProjectRoiSemaforo } from '@/lib/types';
import type { ProjectRoiSnapshot } from '@/lib/project-roi-aggregator';

const SEMAFORO_LABEL: Record<ProjectRoiSemaforo, string> = {
  ganhando: 'Ganhando',
  perdendo: 'Perdendo',
  empatando: 'Empatando',
  sem_movimento: 'Sem movimento',
};

export function buildProjectRoiDreCsv(
  roiCase: ProjectRoiCase,
  snap: ProjectRoiSnapshot,
  title: string,
): string {
  const rows: string[][] = [
    ['DRE gerencial do projeto (Projetos & ROI)'],
    ['Não substitui a DRE Contábil da empresa'],
    [''],
    ['Caso', title],
    ['Referência', roiCase.sourceProposalNumber || '—'],
    ['Origem', roiCase.origin],
    [''],
    ['Linha', 'Valor (R$)'],
    ['Orçamento / receita contratada', String(snap.orcamento)],
    ['Receitas recebidas', String(snap.recebido)],
    ['(-) Despesas diretas', String(snap.pago)],
    ['(-) Impostos pagos (vinculados)', String(snap.impostosDespesas)],
    ['(-) Provisão imposto (perfil)', String(snap.impostosProvisao)],
    ['(=) Resultado do projeto', String(snap.resultado)],
    ['Margem %', snap.margemPct != null ? snap.margemPct.toFixed(1) : '—'],
    ['Saldo de caixa', String(snap.saldoCaixa)],
    [
      'Saldo orçamentário',
      snap.saldoOrcamento != null ? String(snap.saldoOrcamento) : '—',
    ],
    ['Situação', SEMAFORO_LABEL[snap.semaforo]],
    [''],
    ['Extrato'],
    ['Data', 'Tipo', 'Descrição', 'Valor'],
    ...snap.extrato.map((line) => [
      line.date,
      line.kind,
      line.description.replace(/"/g, '""'),
      String(line.amount),
    ]),
  ];

  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'),
    )
    .join('\n');
}

export function downloadProjectRoiDreCsv(
  roiCase: ProjectRoiCase,
  snap: ProjectRoiSnapshot,
  title: string,
): void {
  const csv = buildProjectRoiDreCsv(roiCase, snap, title);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DRE_Projeto_${(title || roiCase.id).replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatDreLineValue(value: number): string {
  return formatCurrencyBRL(value);
}
