import type { PiaRecord } from '@/lib/pia/pia-record';

export type PiaValidationIssue = { field: string; message: string };

function hasText(v: string | undefined | null): boolean {
  return v != null && String(v).trim().length > 0;
}

/** Validação mínima para aprovar ou exportar PIA completo. */
export function validatePiaForExport(record: PiaRecord): PiaValidationIssue[] {
  const issues: PiaValidationIssue[] = [];

  if (record.status !== 'Aprovado') {
    issues.push({
      field: 'status',
      message: 'O PIA precisa estar com status Aprovado para exportar o documento oficial.',
    });
  }

  if (!hasText(record.requerente?.nome)) {
    issues.push({ field: 'requerente.nome', message: 'Nome do requerente é obrigatório.' });
  }
  if (!hasText(record.requerente?.cpfCnpj)) {
    issues.push({ field: 'requerente.cpfCnpj', message: 'CPF/CNPJ do requerente é obrigatório.' });
  }
  if (!hasText(record.empreendimento?.nome)) {
    issues.push({ field: 'empreendimento.nome', message: 'Nome do empreendimento é obrigatório.' });
  }
  if (!hasText(record.responsavelTecnico?.nome)) {
    issues.push({
      field: 'responsavelTecnico.nome',
      message: 'Responsável técnico do PIA é obrigatório.',
    });
  }

  const temFinalidade =
    hasText(record.objetivo?.finalidade) || hasText(record.objetivo?.texto);
  if (!temFinalidade) {
    issues.push({
      field: 'objetivo',
      message: 'Informe a finalidade ou descrição do objetivo da intervenção.',
    });
  }

  const diag = record.diagnostico;
  const temDiagnostico =
    hasText(diag?.meioBiotico) ||
    hasText(diag?.meioAbiotico?.clima) ||
    hasText(diag?.meioAbiotico?.solos) ||
    hasText(diag?.socioeconomico);
  if (!temDiagnostico) {
    issues.push({
      field: 'diagnostico',
      message: 'Preencha ao menos um campo do diagnóstico socioambiental.',
    });
  }

  return issues;
}

export function validatePiaForApproval(record: PiaRecord): PiaValidationIssue[] {
  const issues = validatePiaForExport({ ...record, status: 'Aprovado' });
  return issues.filter((i) => i.field !== 'status');
}
