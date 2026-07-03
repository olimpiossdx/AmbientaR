import type { Prada } from '@/lib/types';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48) || 'PRADA';
}

export function buildPradaExportBaseName(prada: Prada): string {
  const empreendimento = prada.empreendimento?.nome?.trim() || 'empreendimento';
  return `PRADA_${slugify(empreendimento)}`;
}
