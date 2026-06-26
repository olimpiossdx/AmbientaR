import type { EstudoCavidade } from '@/lib/types';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48) || 'CAVIDADES';
}

export function buildCavidadesExportBaseName(estudo: EstudoCavidade): string {
  const empreendimento = estudo.empreendimento?.nome?.trim() || 'empreendimento';
  return `Estudo_Cavidades_${slugify(empreendimento)}`;
}
