import type { ProjetoTecnicoBarragem } from '@/lib/types';

export type BarragemValidationIssue = { field: string; message: string };

function hasText(v: string | undefined | null): boolean {
  return v != null && String(v).trim().length > 0;
}

export function validateBarragemForExport(
  projeto: ProjetoTecnicoBarragem,
): BarragemValidationIssue[] {
  const issues: BarragemValidationIssue[] = [];

  if (!hasText(projeto.requerente?.nome)) {
    issues.push({ field: 'requerente.nome', message: 'Nome do proprietário/requerente é obrigatório.' });
  }
  if (!hasText(projeto.empreendimento?.nome)) {
    issues.push({ field: 'empreendimento.nome', message: 'Nome do empreendimento é obrigatório.' });
  }
  if (!hasText(projeto.responsavelTecnico?.nome)) {
    issues.push({
      field: 'responsavelTecnico.nome',
      message: 'Responsável técnico é obrigatório.',
    });
  }

  return issues;
}
