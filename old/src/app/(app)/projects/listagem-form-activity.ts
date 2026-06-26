/**
 * Rótulos de activity por listagem (campo activity do empreendimento).
 * "Geral" usa sempre LISTAGEM X; fichas específicas usam rótulo detalhado.
 */

export type ListagemLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export const LISTAGEM_ACTIVITY_GERAL: Record<ListagemLetter, string> = {
  A: 'LISTAGEM A',
  B: 'LISTAGEM B',
  C: 'LISTAGEM C',
  D: 'LISTAGEM D',
  E: 'LISTAGEM E',
  F: 'LISTAGEM F',
  G: 'LISTAGEM G',
  H: 'LISTAGEM H',
};

export function listagemFormFieldPath(letter: ListagemLetter): string {
  return `listagem${letter}.formularioTipo`;
}

export function resolveListagemActivity(
  letter: ListagemLetter,
  formularioTipo: string | undefined | null,
  activityByTipo: Record<string, string>,
  defaultTipo: string,
): string {
  const tipo = formularioTipo || defaultTipo;
  if (tipo === 'geral') return LISTAGEM_ACTIVITY_GERAL[letter];
  return activityByTipo[tipo] ?? LISTAGEM_ACTIVITY_GERAL[letter];
}

export function applyListagemTabActivity(
  form: { getValues: (n: string) => unknown; setValue: (n: string, v: string, o?: object) => void },
  letter: ListagemLetter,
  activityByTipo: Record<string, string>,
  defaultTipo: string,
): void {
  const tipo = form.getValues(listagemFormFieldPath(letter)) as string | undefined;
  form.setValue(
    'activity',
    resolveListagemActivity(letter, tipo, activityByTipo, defaultTipo),
    { shouldDirty: false },
  );
}
