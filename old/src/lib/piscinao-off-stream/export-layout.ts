import type { PiscinaoOffStream } from '@/lib/types';

export const PISCINAO_REPORT_TITLE = 'CADASTRO DE PISCINÃO OFF-STREAM';

export const PISCINAO_COVER_TITLE_TOP_MM = 130;

export const PISCINAO_TOC_HEADING = 'Sumário';

export function fmtPiscinaoExport(v: string | undefined | null): string {
  return v != null && String(v).trim() !== '' ? String(v).trim() : '—';
}

export function buildPiscinaoCoverMetaLines(cadastro: PiscinaoOffStream): string[] {
  return [
    fmtPiscinaoExport(cadastro.empreendimento?.nome),
    fmtPiscinaoExport(cadastro.requerente?.nome),
    [cadastro.empreendimento?.municipio, cadastro.empreendimento?.uf].filter(Boolean).join(' - ') || '—',
    `Status: ${fmtPiscinaoExport(cadastro.status ?? 'Rascunho')}`,
    cadastro.dataEmissao || new Date().toLocaleDateString('pt-BR'),
  ];
}
