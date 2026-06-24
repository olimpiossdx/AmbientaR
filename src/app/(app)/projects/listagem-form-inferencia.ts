import { lookupListagemGDn217 } from '@/lib/listagem-g/dn217-catalog';
import type { ListagemLetter } from './listagem-form-activity';
import { listagemFormFieldPath, resolveListagemActivity } from './listagem-form-activity';
import {
  inferirFormularioListagemG,
  LISTAGEM_G_ACTIVITY_BY_TIPO,
  LISTAGEM_G_FORM_TIPO_PADRAO,
  subatividadeParaFormularioListagemG,
  type ListagemGFormTipo,
} from './listagem-g-form-registry';

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

type ListagemGFormApi = {
  setValue: (name: string, value: unknown, options?: { shouldDirty?: boolean }) => void;
  getValues: (name: string) => unknown;
};

export function aplicarCodigoDnListagemG(
  form: ListagemGFormApi,
  codigoRaw: string,
  options?: { atividadeIndex?: number; fieldPrefix?: 'atividadesPrincipal' | 'outrasAtividades' },
): boolean {
  const entry = lookupListagemGDn217(codigoRaw);
  if (!entry) return false;

  const prefix = options?.fieldPrefix ?? 'atividadesPrincipal';
  const index = options?.atividadeIndex ?? 0;
  const base = `listagemG.${prefix}.${index}`;

  form.setValue(`${base}.codigo`, entry.codigo, { shouldDirty: true });
  form.setValue(`${base}.atividade`, entry.descricao, { shouldDirty: true });
  if (entry.unidade) {
    form.setValue(`${base}.parametroUnidade`, entry.unidade, { shouldDirty: true });
  }

  const tipo = inferirFormularioListagemG(entry.codigo) as ListagemGFormTipo;
  aplicarFormularioTipoListagem(
    form,
    'G',
    tipo,
    LISTAGEM_G_ACTIVITY_BY_TIPO,
    LISTAGEM_G_FORM_TIPO_PADRAO,
  );
  form.setValue('subActivity', subatividadeParaFormularioListagemG(tipo), { shouldDirty: true });
  form.setValue('listagemG.empreendimento.codigoDn', entry.codigo, { shouldDirty: true });

  return true;
}
