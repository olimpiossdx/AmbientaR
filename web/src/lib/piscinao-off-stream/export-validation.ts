import type { PiscinaoOffStream } from '@/lib/types';

export type PiscinaoValidationIssue = {
  field: string;
  message: string;
  severity?: 'error' | 'warning';
};

function hasText(v: string | undefined | null): boolean {
  return v != null && String(v).trim().length > 0;
}

export function validatePiscinaoForExport(cadastro: PiscinaoOffStream): PiscinaoValidationIssue[] {
  const issues: PiscinaoValidationIssue[] = [];

  if (!hasText(cadastro.requerente?.nome)) {
    issues.push({
      field: 'requerente.nome',
      message: 'Nome do requerente é obrigatório.',
      severity: 'error',
    });
  }
  if (!hasText(cadastro.empreendimento?.nome)) {
    issues.push({
      field: 'empreendimento.nome',
      message: 'Nome do empreendimento é obrigatório.',
      severity: 'error',
    });
  }
  if (!hasText(cadastro.responsavelTecnico?.nome)) {
    issues.push({
      field: 'responsavelTecnico.nome',
      message: 'Responsável técnico é obrigatório.',
      severity: 'error',
    });
  }

  const vRippl = cadastro.demandaHidrica?.volumeUtilRipplM3;
  const vCap = cadastro.caracteristicas?.capacidadeUtilM3;
  if (hasText(vRippl) && hasText(vCap)) {
    const rippl = Number(String(vRippl).replace(',', '.'));
    const cap = Number(String(vCap).replace(',', '.'));
    if (Number.isFinite(rippl) && Number.isFinite(cap) && rippl > cap) {
      issues.push({
        field: 'caracteristicas.capacidadeUtilM3',
        message: 'Volume útil Rippl supera a capacidade declarada — revisar antes de exportar.',
        severity: 'warning',
      });
    }
  }

  return issues;
}

export function piscinaoExportBlockingIssues(
  issues: PiscinaoValidationIssue[],
): PiscinaoValidationIssue[] {
  return issues.filter((i) => i.severity !== 'warning');
}

export function piscinaoExportWarnings(issues: PiscinaoValidationIssue[]): PiscinaoValidationIssue[] {
  return issues.filter((i) => i.severity === 'warning');
}
