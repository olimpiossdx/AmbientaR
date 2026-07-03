import type { PiscinaoOffStream } from '@/lib/types';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48) || 'PISCINAO';
}

export function buildPiscinaoExportBaseName(cadastro: PiscinaoOffStream): string {
  const empreendimento = cadastro.empreendimento?.nome?.trim() || 'empreendimento';
  return `Piscinao_OffStream_${slugify(empreendimento)}`;
}
