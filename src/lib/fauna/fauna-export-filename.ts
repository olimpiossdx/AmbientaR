import type { FaunaStudy } from '@/lib/types';
import { getFaunaStudyLabel } from '@/lib/fauna-study-utils';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48) || 'FAUNA';
}

export function buildFaunaExportBaseName(study: FaunaStudy): string {
  const emp = study.empreendedor as { name?: string } | undefined;
  const empreendedor = emp?.name?.trim() || 'empreendedor';
  const tipo = slugify(getFaunaStudyLabel(study));
  return `Estudo_Fauna_${tipo}_${slugify(empreendedor)}`;
}
