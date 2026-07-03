import type { ProjetoTecnicoBarragem } from '@/lib/types';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48) || 'BARRAGEM';
}

export function buildBarragemExportBaseName(projeto: ProjetoTecnicoBarragem): string {
  const empreendimento = projeto.empreendimento?.nome?.trim() || 'empreendimento';
  return `Projeto_Tecnico_Barragem_${slugify(empreendimento)}`;
}
