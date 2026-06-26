import type { FaunaStudy } from '@/lib/types';
import { getFaunaStudyLabel } from '@/lib/fauna-study-utils';

export const FAUNA_REPORT_TITLE = 'ESTUDO TÉCNICO DE FAUNA';

export function buildFaunaCoverMetaLines(study: FaunaStudy): string[] {
  const emp = study.empreendedor as
    | { name?: string; municipio?: string; uf?: string }
    | undefined;
  const lines = [getFaunaStudyLabel(study), emp?.name?.trim() || '—'];
  if (emp?.municipio || emp?.uf) {
    lines.push([emp.municipio, emp.uf].filter(Boolean).join(' - '));
  }
  lines.push(
    `Status: ${study.status === 'completed' ? 'Concluído' : 'Rascunho'}`,
    new Date().toLocaleDateString('pt-BR'),
  );
  return lines;
}
