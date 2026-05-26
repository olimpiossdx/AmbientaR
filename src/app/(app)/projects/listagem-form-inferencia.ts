import type { ListagemLetter } from './listagem-form-activity';
import { listagemFormFieldPath, resolveListagemActivity } from './listagem-form-activity';

export function aplicarFormularioTipoListagem(
  form: {
    setValue: (name: string, value: unknown, options?: { shouldDirty?: boolean }) => void;
  },
  letter: ListagemLetter,
  formularioTipo: string,
  activityByTipo: Record<string, string>,
  defaultTipo: string,
): void {
  form.setValue(listagemFormFieldPath(letter), formularioTipo, { shouldDirty: true });
  form.setValue(
    'activity',
    resolveListagemActivity(letter, formularioTipo, activityByTipo, defaultTipo),
    { shouldDirty: true },
  );
}
