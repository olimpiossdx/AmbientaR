import type { DocxTemplateSlug } from '@/lib/docx-template-slugs';

/** Registro mínimo para exportação e ações de listagem de estudos técnicos. */
export type StudyExportRecord = {
  id: string;
  status?: string | null;
  activity?: string | null;
  subActivity?: string | null;
  empreendedor?: {
    clientId?: string;
    nome?: string;
    cpfCnpj?: string;
  } | null;
  empreendimento?: {
    projectId?: string;
    nome?: string;
    municipio?: string;
    uf?: string;
    [key: string]: unknown;
  } | null;
  termoReferencia?: {
    titulo?: string;
    processo?: string;
    versao?: string;
  } | null;
  [key: string]: unknown;
};

export const STUDY_DOCUMENT_TYPE_LABEL: Partial<Record<DocxTemplateSlug, string>> = {
  rca: 'RCA',
  pca: 'PCA',
  ptrf: 'PTRF',
  prada: 'PRADA',
  'eia-rima': 'EIA/RIMA',
  'las-ras': 'LAS-RAS',
  pia: 'PIA',
  pea: 'PEA',
};

export const STUDY_EXPORT_TEMPLATE_LABEL: Record<string, string> = {
  ...STUDY_DOCUMENT_TYPE_LABEL,
  reanalise: 'Reanálise',
};

function slugifyFilePart(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'documento';
}

export function getStudyProjectId(record: StudyExportRecord): string | null {
  const id = record.empreendimento?.projectId;
  if (typeof id === 'string' && id.trim()) return id.trim();
  const flat = (record as Record<string, unknown>).projectId;
  if (typeof flat === 'string' && flat.trim()) return flat.trim();
  return null;
}

/** Empreendedor vinculado (RCA/PCA: empreendedor.clientId; PEA/fauna: empreendedorId). */
export function getStudyEmpreendedorId(record: StudyExportRecord): string | null {
  const fromNested = record.empreendedor?.clientId;
  if (typeof fromNested === 'string' && fromNested.trim()) return fromNested.trim();

  const fromRequerente = (record.requerente as { clientId?: string } | null | undefined)
    ?.clientId;
  if (typeof fromRequerente === 'string' && fromRequerente.trim()) {
    return fromRequerente.trim();
  }

  const flat = (record as Record<string, unknown>).empreendedorId;
  if (typeof flat === 'string' && flat.trim()) return flat.trim();

  return null;
}

export function getStudyExportBaseName(
  record: StudyExportRecord,
  templateSlug: DocxTemplateSlug,
): string {
  const prefix = (STUDY_DOCUMENT_TYPE_LABEL[templateSlug] ?? templateSlug).replace(/\//g, '-');
  const name = record.empreendimento?.nome || record.id;
  return `${prefix}_${slugifyFilePart(String(name))}`;
}

export function validateStudyForExport(
  record: StudyExportRecord,
): { ok: true } | { ok: false; message: string } {
  if (!record.empreendimento?.nome?.trim()) {
    return { ok: false, message: 'Informe o empreendimento antes de exportar.' };
  }
  if (!getStudyProjectId(record)) {
    return {
      ok: false,
      message:
        'Vincule um empreendimento cadastrado (com projeto) para exportar com template oficial e branding.',
    };
  }
  return { ok: true };
}
