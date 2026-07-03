import type { ProjetoTecnicoBarragem } from '@/lib/types';

/** Título na capa do relatório exportado (PDF / Word). */
export const BARRAGEM_REPORT_TITLE = 'PROJETO TÉCNICO DE BARRAGEM';

/** Distância do topo da folha A4 até o título (~13 cm). */
export const BARRAGEM_COVER_TITLE_TOP_MM = 130;

export const BARRAGEM_TOC_HEADING = 'Sumário';

export function fmtBarragemExport(v: string | undefined | null): string {
  return v != null && String(v).trim() !== '' ? String(v).trim() : '—';
}

/** Metadados da capa (empreendimento → data), alinhados à direita no PDF/Word. */
export function buildBarragemCoverMetaLines(projeto: ProjetoTecnicoBarragem): string[] {
  return [
    fmtBarragemExport(projeto.empreendimento?.nome),
    fmtBarragemExport(projeto.requerente?.nome),
    [projeto.empreendimento?.municipio, projeto.empreendimento?.uf]
      .filter(Boolean)
      .join(' - ') || '—',
    `Status: ${fmtBarragemExport(projeto.status ?? 'Rascunho')}`,
    projeto.dataEmissao || new Date().toLocaleDateString('pt-BR'),
  ];
}
