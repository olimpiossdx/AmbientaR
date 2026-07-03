import type { FaunaStudy } from '@/lib/types';

export type FaunaValidationIssue = { field: string; message: string };

function hasText(v: string | undefined | null): boolean {
  return v != null && String(v).trim().length > 0;
}

/** Validação mínima para exportar estudo de fauna (PDF ou Word). */
export function validateFaunaForExport(study: FaunaStudy): FaunaValidationIssue[] {
  const issues: FaunaValidationIssue[] = [];
  const emp = study.empreendedor as { name?: string } | undefined;

  if (!hasText(emp?.name) && !hasText(study.empreendedorId)) {
    issues.push({
      field: 'empreendedor',
      message: 'Empreendedor é obrigatório para exportar.',
    });
  }

  return issues;
}
