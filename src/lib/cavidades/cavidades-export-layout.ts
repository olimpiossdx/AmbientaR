import type { EstudoCavidade } from '@/lib/types';

export const CAVIDADES_REPORT_TITLE = 'Estudo espeleológico — Cavidades naturais subterrâneas (MG)';
export const CAVIDADES_TOC_HEADING = 'Sumário';
export const CAVIDADES_COVER_TITLE_TOP_MM = 52;

export function buildCavidadesCoverMetaLines(estudo: EstudoCavidade): string[] {
  const lines: string[] = [];
  if (estudo.empreendimento?.nome) lines.push(estudo.empreendimento.nome);
  if (estudo.requerente?.nome) lines.push(`Requerente: ${estudo.requerente.nome}`);
  const loc = [estudo.empreendimento?.municipio, estudo.empreendimento?.uf]
    .filter(Boolean)
    .join(' — ');
  if (loc) lines.push(loc);
  if (estudo.responsavelTecnico?.nome) {
    lines.push(`RT: ${estudo.responsavelTecnico.nome}`);
  }
  if (estudo.responsavelTecnico?.art) lines.push(`ART: ${estudo.responsavelTecnico.art}`);
  lines.push(`Status: ${estudo.status ?? 'Rascunho'}`);
  return lines;
}
