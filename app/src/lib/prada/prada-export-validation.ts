import type { Prada } from '@/lib/types';

export type PradaValidationIssue = { field: string; message: string };

function hasText(v: string | undefined | null): boolean {
  return v != null && String(v).trim().length > 0;
}

/** Validação mínima para exportar PRADA (PDF ou Word). */
export function validatePradaForExport(prada: Prada): PradaValidationIssue[] {
  const issues: PradaValidationIssue[] = [];

  if (!hasText(prada.requerente?.nome)) {
    issues.push({ field: 'requerente.nome', message: 'Nome do requerente é obrigatório.' });
  }
  if (!hasText(prada.empreendimento?.nome)) {
    issues.push({ field: 'empreendimento.nome', message: 'Nome do empreendimento é obrigatório.' });
  }
  if (!hasText(prada.responsavelTecnico?.nome)) {
    issues.push({
      field: 'responsavelTecnico.nome',
      message: 'Responsável técnico é obrigatório.',
    });
  }

  return issues;
}
