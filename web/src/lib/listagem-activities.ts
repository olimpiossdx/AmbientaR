/** Rótulos oficiais das listagens A–H (DN 217 / formulários RCA e PCA). */
export const LISTAGEM_ACTIVITY_BY_CODE: Record<string, string> = {
  A: 'LISTAGEM A – ATIVIDADES MINERÁRIAS',
  B: 'LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS',
  C: 'LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS',
  D: 'LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA',
  E: 'LISTAGEM E – ATIVIDADES DE INFRAESTRUTURA',
  F: 'LISTAGEM F – GERENCIAMENTO DE RESÍDUOS E SERVIÇOS',
  G: 'LISTAGEM G – ATIVIDADES AGROSSILVIPASTORIS',
  H: 'LISTAGEM H – OUTRAS ATIVIDADES - H-01-01-1 Atividades e empreendimentos não listados ou não enquadrados em outros códigos, com supressão de vegetação primária ou secundária nativa pertencente ao bioma Mata Atlântica, em estágios médio e/ou avançado de regeneração, sujeita a EIA/Rima nos termos da Lei Federal nº 11.428, de 22 de dezembro de 2006, exceto árvores isoladas.',
};

export const LISTAGEM_CODES = Object.keys(LISTAGEM_ACTIVITY_BY_CODE) as Array<
  keyof typeof LISTAGEM_ACTIVITY_BY_CODE
>;

/** Rótulo curto para seletores e badges (listagem A–H). */
export const LISTAGEM_SHORT_BY_CODE: Record<string, string> = {
  A: 'Atividades minerárias',
  B: 'Indústria metalúrgica e afins',
  C: 'Indústria química e afins',
  D: 'Indústria alimentícia',
  E: 'Infraestrutura',
  F: 'Resíduos e serviços',
  G: 'Agrossilvipastoris',
  H: 'Outras atividades',
};

export function getListagemDisplayLabel(code: string): string {
  const c = code.toUpperCase();
  const short = LISTAGEM_SHORT_BY_CODE[c];
  return short ? `Listagem ${c} — ${short}` : LISTAGEM_ACTIVITY_BY_CODE[c] ?? `Listagem ${c}`;
}

export function extractListagemCode(raw?: string | null): string | null {
  if (!raw) return null;
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const match = normalized.match(/\blistagem\s+([a-h])\b/i);
  if (match?.[1]) return match[1].toUpperCase();
  const direct = normalized.match(/\b([a-h])\b/i);
  return direct?.[1] ? direct[1].toUpperCase() : null;
}
