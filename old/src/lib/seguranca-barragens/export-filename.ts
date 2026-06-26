import type { EstudoSegurancaBarragem } from '@/lib/types';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48) || 'SEGURANCA';
}

export function buildSegurancaExportBaseName(estudo: EstudoSegurancaBarragem): string {
  const empreendimento = estudo.empreendimento?.nome?.trim() || 'empreendimento';
  return `Seguranca_Barragem_${slugify(empreendimento)}`;
}
