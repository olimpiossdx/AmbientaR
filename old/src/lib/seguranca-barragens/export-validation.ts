import type { EstudoSegurancaBarragem } from '@/lib/types';
import { validateHecRasExport } from '@/lib/seguranca-barragens/hec-ras-export';

export type SegurancaValidationIssue = {
  field: string;
  message: string;
  severity?: 'error' | 'warning';
};

function hasText(v: string | undefined | null): boolean {
  return v != null && String(v).trim().length > 0;
}

export function validateSegurancaForExport(
  estudo: EstudoSegurancaBarragem,
): SegurancaValidationIssue[] {
  const issues: SegurancaValidationIssue[] = [];

  if (!hasText(estudo.requerente?.nome)) {
    issues.push({
      field: 'requerente.nome',
      message: 'Nome do requerente é obrigatório.',
      severity: 'error',
    });
  }
  if (!hasText(estudo.empreendimento?.nome)) {
    issues.push({
      field: 'empreendimento.nome',
      message: 'Nome do empreendimento é obrigatório.',
      severity: 'error',
    });
  }
  if (!hasText(estudo.responsavelTecnico?.nome)) {
    issues.push({
      field: 'responsavelTecnico.nome',
      message: 'Responsável técnico é obrigatório.',
      severity: 'error',
    });
  }

  if (estudo.classificacao?.danoPotencialAssociado === 'alto' && !hasText(estudo.pae?.contatos)) {
    issues.push({
      field: 'pae.contatos',
      message: 'DPA alto: recomenda-se preencher contatos do PAE antes de exportar.',
      severity: 'warning',
    });
  }

  for (const issue of validateHecRasExport(estudo)) {
    issues.push({
      field: issue.field,
      message: `Dam Break / HEC-RAS: ${issue.message}`,
      severity: 'warning',
    });
  }

  const db = estudo.damBreak;
  const hasDamTriagem =
    Boolean(db?.volumeMobilizadoM3?.trim()) || Boolean(db?.vazaoPicoM3s?.trim());
  if (
    hasDamTriagem &&
    !estudo.hecRasResultados?.importedAt &&
    estudo.classificacao?.danoPotencialAssociado === 'alto'
  ) {
    issues.push({
      field: 'hecRasResultados',
      message:
        'DPA alto com triagem Dam Break: recomenda-se importar resultados do HEC-RAS antes de exportar.',
      severity: 'warning',
    });
  }

  return issues;
}

export function segurancaExportBlockingIssues(
  issues: SegurancaValidationIssue[],
): SegurancaValidationIssue[] {
  return issues.filter((i) => i.severity !== 'warning');
}

export function segurancaExportWarnings(
  issues: SegurancaValidationIssue[],
): SegurancaValidationIssue[] {
  return issues.filter((i) => i.severity === 'warning');
}
