import type { EstudoSegurancaBarragem } from '@/lib/types';

export const SEGURANCA_REPORT_TITLE = 'ESTUDO DE SEGURANÇA DE BARRAGEM';

export const SEGURANCA_COVER_TITLE_TOP_MM = 130;

export const SEGURANCA_TOC_HEADING = 'Sumário';

export function fmtSegurancaExport(v: string | undefined | null): string {
  return v != null && String(v).trim() !== '' ? String(v).trim() : '—';
}

export function buildSegurancaCoverMetaLines(estudo: EstudoSegurancaBarragem): string[] {
  return [
    fmtSegurancaExport(estudo.empreendimento?.nome),
    fmtSegurancaExport(estudo.requerente?.nome),
    [estudo.empreendimento?.municipio, estudo.empreendimento?.uf].filter(Boolean).join(' - ') || '—',
    `Status: ${fmtSegurancaExport(estudo.status ?? 'Rascunho')}`,
    estudo.dataEmissao || new Date().toLocaleDateString('pt-BR'),
  ];
}
